import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Product, Customer, Order, AbandonedCheckout, Collection, Location, InventoryLevel,
  InventoryHistoryEntry, Discount, Campaign, StaffMember, StorePage, BlogPost, FileAsset,
  NavMenu, AppEntry, StoreSettings, AdminNotification, TaskItem, ThemeSettings,
} from '@/types'
import {
  seedProducts, seedCustomers, seedOrders, seedAbandoned, seedCollections, seedLocations,
  seedInventoryLevels, seedInventoryHistory, seedDiscounts, seedCampaigns, seedStaff,
  seedPages, seedPosts, seedFiles, seedMenus, seedApps, seedAppSuggestions, seedSettings,
  seedNotifications, seedTasks, seedTheme, seedThemeLibrary, type ThemeLibraryEntry,
} from '@/data'

/**
 * Central application state. UI never mutates these directly — it calls the
 * services in src/services, which compose the actions below (spec §37/§39).
 * Persisted to localStorage; seeds hydrate on first launch (spec §38).
 */
export interface AppState {
  products: Product[]
  customers: Customer[]
  orders: Order[]
  abandoned: AbandonedCheckout[]
  collections: Collection[]
  locations: Location[]
  inventoryLevels: InventoryLevel[]
  inventoryHistory: InventoryHistoryEntry[]
  discounts: Discount[]
  campaigns: Campaign[]
  staff: StaffMember[]
  pages: StorePage[]
  posts: BlogPost[]
  files: FileAsset[]
  menus: NavMenu[]
  apps: AppEntry[]
  appSuggestions: AppEntry[]
  settings: StoreSettings
  notifications: AdminNotification[]
  tasks: TaskItem[]
  theme: ThemeSettings
  themeLibrary: ThemeLibraryEntry[]

  // low-level entity operations (services build on these)
  addProduct: (p: Product) => void
  patchProduct: (id: string, patch: Partial<Product>) => void
  removeProducts: (ids: string[]) => void

  addCustomer: (c: Customer) => void
  patchCustomer: (id: string, patch: Partial<Customer>) => void
  removeCustomers: (ids: string[]) => void

  addOrder: (o: Order) => void
  patchOrder: (id: string, patch: Partial<Order>) => void
  removeOrders: (ids: string[]) => void
  patchAbandoned: (id: string, patch: Partial<AbandonedCheckout>) => void

  addCollection: (c: Collection) => void
  patchCollection: (id: string, patch: Partial<Collection>) => void
  removeCollections: (ids: string[]) => void

  addLocation: (l: Location) => void
  patchLocation: (id: string, patch: Partial<Location>) => void
  removeLocation: (id: string) => void

  upsertInventoryLevel: (level: InventoryLevel) => void
  addInventoryHistory: (entries: InventoryHistoryEntry[]) => void

  addDiscount: (d: Discount) => void
  patchDiscount: (id: string, patch: Partial<Discount>) => void
  removeDiscounts: (ids: string[]) => void

  addCampaign: (c: Campaign) => void
  patchCampaign: (id: string, patch: Partial<Campaign>) => void
  removeCampaign: (id: string) => void

  addStaff: (s: StaffMember) => void
  patchStaff: (id: string, patch: Partial<StaffMember>) => void
  removeStaff: (id: string) => void

  addPage: (p: StorePage) => void
  patchPage: (id: string, patch: Partial<StorePage>) => void
  removePages: (ids: string[]) => void

  addPost: (p: BlogPost) => void
  patchPost: (id: string, patch: Partial<BlogPost>) => void
  removePosts: (ids: string[]) => void

  addFiles: (f: FileAsset[]) => void
  patchFile: (id: string, patch: Partial<FileAsset>) => void
  removeFiles: (ids: string[]) => void

  setMenus: (menus: NavMenu[]) => void

  addApp: (a: AppEntry) => void
  patchApp: (id: string, patch: Partial<AppEntry>) => void
  removeApp: (id: string) => void

  updateSettings: (patch: Partial<StoreSettings>) => void
  updateTheme: (patch: Partial<ThemeSettings>) => void
  setThemeLibrary: (entries: ThemeLibraryEntry[]) => void

  patchNotification: (id: string, patch: Partial<AdminNotification>) => void
  markAllNotificationsRead: () => void
  toggleTask: (id: string) => void
  resetData: () => void
}

const seedState = {
  products: seedProducts,
  customers: seedCustomers,
  orders: seedOrders,
  abandoned: seedAbandoned,
  collections: seedCollections,
  locations: seedLocations,
  inventoryLevels: seedInventoryLevels,
  inventoryHistory: seedInventoryHistory,
  discounts: seedDiscounts,
  campaigns: seedCampaigns,
  staff: seedStaff,
  pages: seedPages,
  posts: seedPosts,
  files: seedFiles,
  menus: seedMenus,
  apps: seedApps,
  appSuggestions: seedAppSuggestions,
  settings: seedSettings,
  notifications: seedNotifications,
  tasks: seedTasks,
  theme: seedTheme,
  themeLibrary: seedThemeLibrary,
}

const upsert = <T>(list: T[], item: T, key: (x: T) => string): T[] =>
  list.some((x) => key(x) === key(item))
    ? list.map((x) => (key(x) === key(item) ? item : x))
    : [item, ...list]

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...seedState,

      addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
      patchProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeProducts: (ids) =>
        set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) })),

      addCustomer: (c) => set((s) => ({ customers: [c, ...s.customers] })),
      patchCustomer: (id, patch) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCustomers: (ids) =>
        set((s) => ({ customers: s.customers.filter((c) => !ids.includes(c.id)) })),

      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      patchOrder: (id, patch) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      removeOrders: (ids) => set((s) => ({ orders: s.orders.filter((o) => !ids.includes(o.id)) })),
      patchAbandoned: (id, patch) =>
        set((s) => ({ abandoned: s.abandoned.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      addCollection: (c) => set((s) => ({ collections: [c, ...s.collections] })),
      patchCollection: (id, patch) =>
        set((s) => ({ collections: s.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCollections: (ids) =>
        set((s) => ({ collections: s.collections.filter((c) => !ids.includes(c.id)) })),

      addLocation: (l) => set((s) => ({ locations: [...s.locations, l] })),
      patchLocation: (id, patch) =>
        set((s) => ({ locations: s.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeLocation: (id) => set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),

      upsertInventoryLevel: (level) =>
        set((s) => ({
          inventoryLevels: upsert(
            s.inventoryLevels,
            level,
            (l) => `${l.variantId}:${l.locationId}`,
          ),
        })),
      addInventoryHistory: (entries) =>
        set((s) => ({ inventoryHistory: [...entries, ...s.inventoryHistory] })),

      addDiscount: (d) => set((s) => ({ discounts: [d, ...s.discounts] })),
      patchDiscount: (id, patch) =>
        set((s) => ({ discounts: s.discounts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDiscounts: (ids) => set((s) => ({ discounts: s.discounts.filter((d) => !ids.includes(d.id)) })),

      addCampaign: (c) => set((s) => ({ campaigns: [c, ...s.campaigns] })),
      patchCampaign: (id, patch) =>
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),

      addStaff: (m) => set((s) => ({ staff: [...s.staff, m] })),
      patchStaff: (id, patch) =>
        set((s) => ({ staff: s.staff.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeStaff: (id) => set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),

      addPage: (p) => set((s) => ({ pages: [p, ...s.pages] })),
      patchPage: (id, patch) =>
        set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePages: (ids) => set((s) => ({ pages: s.pages.filter((p) => !ids.includes(p.id)) })),

      addPost: (p) => set((s) => ({ posts: [p, ...s.posts] })),
      patchPost: (id, patch) =>
        set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePosts: (ids) => set((s) => ({ posts: s.posts.filter((p) => !ids.includes(p.id)) })),

      addFiles: (f) => set((s) => ({ files: [...f, ...s.files] })),
      patchFile: (id, patch) =>
        set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeFiles: (ids) => set((s) => ({ files: s.files.filter((f) => !ids.includes(f.id)) })),

      setMenus: (menus) => set({ menus }),

      addApp: (a) => set((s) => ({ apps: [a, ...s.apps] })),
      patchApp: (id, patch) =>
        set((s) => ({ apps: s.apps.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeApp: (id) => set((s) => ({ apps: s.apps.filter((a) => a.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateTheme: (patch) => set((s) => ({ theme: { ...s.theme, ...patch } })),
      setThemeLibrary: (entries) => set({ themeLibrary: entries }),

      patchNotification: (id, patch) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      toggleTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

      resetData: () => set({ ...seedState }),
    }),
    {
      name: 'northstar-admin-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

/** Non-hook access for services outside React */
export const getStore = () => useStore.getState()
