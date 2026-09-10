import type {
  FulfillmentStatus,
  PaymentStatus,
  ProductStatus,
  DiscountStatus,
  DiscountType,
  CampaignChannel,
  CampaignStatus,
  OrderStatus,
  MarketingConsent,
  StaffMember,
} from '@/types'

export const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  authorized: 'Authorized',
  partially_refunded: 'Partially refunded',
  refunded: 'Refunded',
  voided: 'Voided',
  unpaid: 'Unpaid',
}

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  fulfilled: 'Fulfilled',
  unfulfilled: 'Unfulfilled',
  partial: 'Partially fulfilled',
  returned: 'Returned',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  cancelled: 'Cancelled',
  draft: 'Draft',
}

export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  draft: 'Draft',
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed amount',
  free_shipping: 'Free shipping',
  bxgy: 'Buy X get Y',
}

export const CAMPAIGN_CHANNEL_LABELS: Record<CampaignChannel, string> = {
  email: 'Email',
  social: 'Social',
  search: 'Search',
  sms: 'SMS',
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  scheduled: 'Scheduled',
  draft: 'Draft',
}

export const CONSENT_LABELS: Record<MarketingConsent, string> = {
  subscribed: 'Subscribed',
  not_subscribed: 'Not subscribed',
  pending: 'Pending',
}

export const CURRENT_USER: StaffMember = {
  id: 'staff_owner',
  name: 'Ava Chen',
  email: 'ava@northstargoods.com',
  role: 'owner',
  status: 'active',
  lastActiveAt: new Date().toISOString(),
  permissions: {
    products: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'edit', 'refund', 'cancel'],
    customers: ['view', 'edit', 'delete'],
    analytics: ['view'],
    settings: ['view', 'edit'],
  },
}

export const TABLE_PAGE_SIZES = [10, 25, 50] as const
