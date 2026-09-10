import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { parseJson, toJson, toConnection, filterByQuery, encodeCursor } from '../../common/helpers'
import { mapProduct, productTotalInventory, mapCollection } from '../../common/mappers'
import { uid } from '../../common/ids'
import { slugify } from '../../common/ids'

function matchesRules(
  product: { tags: string[]; title: string; productType: string; vendor: string },
  rules: { column: string; relation: string; condition: string }[],
  match: 'all' | 'any',
): boolean {
  if (rules.length === 0) return false
  const results = rules.map((r) => {
    const haystack =
      r.column === 'tag' ? product.tags.join('|')
      : r.column === 'title' ? product.title
      : r.column === 'product_type' ? product.productType
      : product.vendor
    const needle = r.condition.trim().toLowerCase()
    if (!needle) return false
    if (r.relation === 'equals') return haystack.toLowerCase() === needle || (r.column === 'tag' && product.tags.some((t) => t.toLowerCase() === needle))
    if (r.relation === 'contains') return haystack.toLowerCase().includes(needle)
    return haystack.toLowerCase().startsWith(needle)
  })
  return match === 'all' ? results.every(Boolean) : results.some(Boolean)
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async levelsByVariant(): Promise<Map<string, number>> {
    const levels = await this.prisma.inventoryLevel.findMany()
    const map = new Map<string, number>()
    for (const l of levels) map.set(l.variantId, (map.get(l.variantId) ?? 0) + l.available)
    return map
  }

  private async decorate(products: Record<string, unknown>[]): Promise<any[]> {
    const levels = await this.levelsByVariant()
    return products.map((p) => {
      const mapped = mapProduct(p)
      const variants = parseJson<{ id: string }[]>(p.variants as string, [])
      mapped.totalInventory = p.trackQuantity
        ? variants.reduce((s, v) => s + (levels.get(v.id) ?? 0), 0)
        : 0
      return mapped
    })
  }

  async product(id: string): Promise<any> {
    const row = await this.prisma.product.findUnique({ where: { id } })
    if (!row) return null
    const [decorated] = await this.decorate([row as unknown as Record<string, unknown>])
    return decorated
  }

  async products(args: any): Promise<any> {
    let rows = (await this.prisma.product.findMany({ orderBy: { updatedAt: 'desc' } })) as unknown as Record<string, unknown>[]
    if (args.status) rows = rows.filter((r) => r.status === args.status)
    rows = filterByQuery(rows, args.query, (r) => [
      r.title as string, r.vendor as string, r.productType as string,
      parseJson<string[]>(r.tags as string, []).join(' '),
      parseJson<{ sku?: string }[]>(r.variants as string, []).map((v) => v.sku ?? '').join(' '),
    ])
    if (args.reverse) rows = [...rows].reverse()
    const decorated = await this.decorate(rows)
    return toConnection(decorated, args.first, args.after)
  }

  async create(input: Record<string, any>): Promise<any> {
    const now = new Date()
    const id = uid('p')
    const title = input.title ?? ''
    const row = await this.prisma.product.create({
      data: {
        id,
        title,
        descriptionHtml: input.descriptionHtml ?? '<p></p>',
        vendor: input.vendor ?? 'Northstar Goods',
        productType: input.productType ?? '',
        category: input.category ?? null,
        status: input.status ?? 'draft',
        tags: toJson(input.tags ?? []),
        collectionIds: toJson(input.collectionIds ?? []),
        channels: toJson(input.channels ?? ['online_store']),
        options: toJson(input.options ?? []),
        variants: toJson(
          input.variants?.length
            ? input.variants.map((v: any, i: number) => ({
                id: v.id ?? `${id}_v${i + 1}`,
                productId: id,
                title: v.title ?? 'Default Title',
                sku: v.sku ?? '',
                barcode: v.barcode ?? null,
                price: v.price ?? 0,
                compareAtPrice: v.compareAtPrice ?? null,
                costPerItem: v.costPerItem ?? null,
                optionValues: v.optionValues ?? {},
                weightGrams: v.weightGrams ?? null,
                imageId: v.imageId ?? null,
                available: v.available ?? true,
              }))
            : [{ id: `${id}_v1`, productId: id, title: 'Default Title', sku: '', barcode: null, price: 0, compareAtPrice: null, costPerItem: null, optionValues: {}, weightGrams: null, imageId: null, available: true }],
        ),
        media: toJson(input.media ?? []),
        seo: toJson(input.seo ?? { title, description: '', handle: slugify(title) || id }),
        weightGrams: input.weightGrams ?? null,
        requiresShipping: input.requiresShipping ?? true,
        trackQuantity: input.trackQuantity ?? true,
        createdAt: now,
        updatedAt: now,
      },
    })
    return (await this.decorate([row as unknown as Record<string, unknown>]))[0]
  }

  async update(id: string, input: Record<string, any>): Promise<any> {
    const existing = await this.prisma.product.findUnique({ where: { id } })
    if (!existing) throw new Error('Product not found')
    const data: Record<string, unknown> = { updatedAt: new Date() }
    const direct = ['title', 'descriptionHtml', 'vendor', 'productType', 'category', 'status', 'weightGrams', 'requiresShipping', 'trackQuantity']
    for (const key of direct) if (input[key] !== undefined) data[key] = input[key]
    for (const key of ['tags', 'collectionIds', 'channels', 'options', 'variants', 'media', 'seo']) {
      if (input[key] !== undefined) data[key] = toJson(input[key])
    }
    await this.prisma.product.update({ where: { id }, data })
    return this.product(id)
  }

  async delete(ids: string[]): Promise<string[]> {
    const store = this.prisma
    for (const col of await store.collection.findMany()) {
      const productIds = parseJson<string[]>(col.productIds as string, [])
      if (productIds.some((pid) => ids.includes(pid))) {
        await store.collection.update({
          where: { id: col.id },
          data: { productIds: toJson(productIds.filter((pid) => !ids.includes(pid))) },
        })
      }
    }
    await store.product.deleteMany({ where: { id: { in: ids } } })
    return ids
  }

  async duplicate(id: string): Promise<any> {
    const source = await this.prisma.product.findUnique({ where: { id } })
    if (!source) throw new Error('Product not found')
    const newId = uid('p')
    const seo = parseJson<{ title: string; description: string; handle: string }>(source.seo as string, { title: '', description: '', handle: '' })
    const copy = await this.prisma.product.create({
      data: {
        id: newId,
        title: `${source.title} (copy)`,
        descriptionHtml: source.descriptionHtml,
        vendor: source.vendor,
        productType: source.productType,
        category: source.category,
        status: 'draft',
        tags: parseJson(source.tags as string, []),
        collectionIds: toJson([]),
        channels: parseJson(source.channels as string, []),
        options: parseJson(source.options as string, []),
        variants: toJson(
          parseJson<Record<string, unknown>[]>(source.variants as string, []).map((v, i) => ({ ...v, id: `${newId}_v${i + 1}`, productId: newId })),
        ),
        media: toJson(
          parseJson<Record<string, unknown>[]>(source.media as string, []).map((m, i) => ({ ...m, id: `${newId}_m${i + 1}`, productId: newId })),
        ),
        seo: toJson({ ...seo, handle: slugify(`${seo.handle}-copy`) }),
        weightGrams: source.weightGrams,
        requiresShipping: source.requiresShipping,
        trackQuantity: source.trackQuantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    return (await this.decorate([copy as unknown as Record<string, unknown>]))[0]
  }

  async setStatus(ids: string[], status: string): Promise<string[]> {
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { status, updatedAt: new Date() } })
    return ids
  }

  async modifyTags(ids: string[], tags: string[], mode: 'add' | 'remove'): Promise<string[]> {
    for (const id of ids) {
      const p = await this.prisma.product.findUnique({ where: { id } })
      if (!p) continue
      const current = parseJson<string[]>(p.tags as string, [])
      const next = mode === 'add' ? [...new Set([...current, ...tags])] : current.filter((t) => !tags.includes(t))
      await this.prisma.product.update({ where: { id }, data: { tags: toJson(next), updatedAt: new Date() } })
    }
    return ids
  }

  async reorderMedia(id: string, mediaIds: string[]): Promise<any> {
    const p = await this.prisma.product.findUnique({ where: { id } })
    if (!p) throw new Error('Product not found')
    const media = parseJson<Record<string, unknown>[]>(p.media as string, [])
    const map = new Map(media.map((m) => [m.id as string, m]))
    const ordered = mediaIds.map((mid) => map.get(mid)).filter(Boolean) as Record<string, unknown>[]
    const rest = media.filter((m) => !mediaIds.includes(m.id as string))
    await this.prisma.product.update({ where: { id }, data: { media: toJson([...ordered, ...rest]), updatedAt: new Date() } })
    return this.product(id)
  }

  // collections
  async collection(id: string): Promise<any> {
    const row = await this.prisma.collection.findUnique({ where: { id } })
    return row ? mapCollection(row as unknown as Record<string, unknown>) : null
  }

  async collections(args: any): Promise<any> {
    let rows = (await this.prisma.collection.findMany({ orderBy: { title: 'asc' } })) as unknown as Record<string, unknown>[]
    rows = filterByQuery(rows, args.query, (r) => [r.title as string, r.handle as string])
    const mapped = rows.map(mapCollection)
    return toConnection(mapped, args.first, args.after)
  }

  private async evaluateSmart(rules: { column: string; relation: string; condition: string }[], match: 'all' | 'any'): Promise<string[]> {
    const products = await this.prisma.product.findMany({ where: { status: { not: 'archived' } } })
    return products
      .filter((p) =>
        matchesRules(
          {
            tags: parseJson<string[]>(p.tags as string, []),
            title: p.title,
            productType: p.productType,
            vendor: p.vendor,
          },
          rules,
          match,
        ),
      )
      .map((p) => p.id)
  }

  async createCollection(input: Record<string, any>): Promise<any> {
    const id = uid('col')
    const title = input.title ?? 'Untitled collection'
    const type = input.type ?? 'manual'
    const rules = input.rules ?? []
    const productIds =
      type === 'smart' ? await this.evaluateSmart(rules, input.rulesMatch ?? 'all') : input.productIds ?? []
    await this.prisma.collection.create({
      data: {
        id,
        title,
        descriptionHtml: input.descriptionHtml ?? '<p></p>',
        imageSrc: input.imageSrc ?? null,
        handle: input.handle || slugify(title) || id,
        type,
        rules: toJson(rules),
        rulesMatch: input.rulesMatch ?? 'all',
        productIds: toJson(productIds),
        status: input.status ?? 'active',
        seoTitle: input.seoTitle ?? title,
        seoDescription: input.seoDescription ?? null,
        publishedAt: (input.status ?? 'active') === 'active' ? new Date() : null,
        createdAt: new Date(),
      },
    })
    return this.collection(id)
  }

  async updateCollection(id: string, input: Record<string, any>): Promise<any> {
    const existing = await this.prisma.collection.findUnique({ where: { id } })
    if (!existing) throw new Error('Collection not found')
    const merged = { ...mapCollection(existing as unknown as Record<string, unknown>), ...input }

    let productIds = parseJson<string[]>(merged.productIds as unknown as string, [])
    if (merged.type === 'smart') {
      productIds = await this.evaluateSmart(merged.rules as never, merged.rulesMatch as 'all' | 'any')
    }
    const prevIds = parseJson<string[]>(existing.productIds as string, [])
    const added = productIds.filter((pid) => !prevIds.includes(pid))
    const removed = prevIds.filter((pid) => !productIds.includes(pid))

    await this.prisma.collection.update({
      where: { id },
      data: {
        title: merged.title,
        descriptionHtml: merged.descriptionHtml,
        imageSrc: merged.imageSrc ?? null,
        handle: merged.handle,
        type: merged.type,
        rules: toJson(merged.rules),
        rulesMatch: merged.rulesMatch,
        productIds: toJson(productIds),
        status: merged.status,
        seoTitle: merged.seoTitle ?? null,
        seoDescription: merged.seoDescription ?? null,
      },
    })
    // reconcile product side
    for (const pid of added) {
      const p = await this.prisma.product.findUnique({ where: { id: pid } })
      if (p) {
        const list = parseJson<string[]>(p.collectionIds as string, [])
        if (!list.includes(id)) await this.prisma.product.update({ where: { id: pid }, data: { collectionIds: toJson([...list, id]) } })
      }
    }
    for (const pid of removed) {
      const p = await this.prisma.product.findUnique({ where: { id: pid } })
      if (p) {
        const list = parseJson<string[]>(p.collectionIds as string, [])
        await this.prisma.product.update({ where: { id: pid }, data: { collectionIds: toJson(list.filter((c) => c !== id)) } })
      }
    }
    return this.collection(id)
  }

  async deleteCollections(ids: string[]): Promise<string[]> {
    for (const col of await this.prisma.collection.findMany({ where: { id: { in: ids } } })) {
      for (const pid of parseJson<string[]>(col.productIds as string, [])) {
        const p = await this.prisma.product.findUnique({ where: { id: pid } })
        if (p) {
          const list = parseJson<string[]>(p.collectionIds as string, [])
          await this.prisma.product.update({ where: { id: pid }, data: { collectionIds: toJson(list.filter((c) => c !== col.id)) } })
        }
      }
    }
    await this.prisma.collection.deleteMany({ where: { id: { in: ids } } })
    return ids
  }

  async modifyProducts(id: string, productIds: string[], mode: 'add' | 'remove'): Promise<any> {
    const col = await this.prisma.collection.findUnique({ where: { id } })
    if (!col) throw new Error('Collection not found')
    const current = parseJson<string[]>(col.productIds as string, [])
    const next = mode === 'add' ? [...new Set([...current, ...productIds])] : current.filter((pid) => !productIds.includes(pid))
    await this.updateCollection(id, { productIds: next })
    return this.collection(id)
  }
}
