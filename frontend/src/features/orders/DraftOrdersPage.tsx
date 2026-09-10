import { PageHeader } from '@/components/ui'
import { OrdersTable } from './OrdersListPage'

export default function DraftOrdersPage() {
  return (
    <div>
      <PageHeader title="Drafts" subtitle="Orders created manually or converted from abandoned checkouts" />
      <OrdersTable mode="drafts" />
    </div>
  )
}
