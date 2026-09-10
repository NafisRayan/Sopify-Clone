import re

p = 'prisma/schema.prisma'
s = open(p, encoding='utf-8').read()

# switch to postgres
s = s.replace('provider = "sqlite"', 'provider = "postgresql"')

# restore native Json on aggregate fields (model -> field list)
json_fields = {
    'Product': ['tags', 'collectionIds', 'channels', 'options', 'variants', 'media', 'seo'],
    'Collection': ['rules', 'productIds'],
    'Customer': ['defaultAddress', 'addresses', 'tags'],
    'Company': ['locations', 'contacts'],
    'Order': ['lineItems', 'shippingAddress', 'billingAddress', 'discountCode', 'tags', 'timeline', 'fulfillments', 'refunds'],
    'AbandonedCheckout': ['lineItems'],
    'ReturnRecord': ['lines'],
    'OrderEdit': ['added', 'removed'],
    'OrderRisk': ['signals'],
    'Transfer': ['lines'],
    'Discount': ['bxgy', 'productIds', 'combinations'],
    'BlogPost': ['tags'],
    'FileAsset': ['dimensions'],
    'NavMenu': ['items'],
    'MetaobjectDefinition': ['fields'],
    'MetaobjectEntry': ['fields'],
    'AppEntry': ['permissions'],
    'StaffMember': ['permissions'],
    'GiftCard': ['history'],
    'StoreSettings': ['value'],
    'Theme': ['value'],
}

def patch_model(text, model, fields):
    # locate model block
    match = re.search(r'(model ' + model + r' \{)(.*?)(\n\})', text, re.S)
    if not match:
        raise SystemExit(f'model {model} not found')
    block = match.group(2)
    for field in fields:
        # "  field         String?" or "  field String   @default(...)"  -> Json
        block = re.sub(
            r'(\n  ' + field + r'\s+)String(\??)',
            lambda m: m.group(1) + 'Json' + (m.group(2) if m.group(2) == '?' else ''),
            block,
        )
    return text[:match.start(2)] + block + text[match.end(2):]

for model, fields in json_fields.items():
    s = patch_model(s, model, fields)

# fix defaults for Json non-null fields: Json @default("[]") is invalid; use @default("[]")::Json? -> Prisma supports @default("[]") for Json on postgres? No. Remove Json defaults.
s = re.sub(r'(Json\s+)@default\("\[\]"\)', r'\1', s)
s = re.sub(r'(Json\s+)@default\("\{\}"\)', r'\1', s)
s = re.sub(r'(Json\s+)@default\("\{\\"orderDiscounts\\":false,\\"\\"', r'\1', s)  # safety
s = re.sub(r'(Json +)@default\([^)]*\)', r'\1', s)

open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('schema converted to postgres + Json')
