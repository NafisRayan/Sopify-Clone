import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  Badge, Button, CardHeader, CardSection, DividedCard, EmptyState, Input, PageHeader,
  Select, useConfirm, useToast,
} from '@/components/ui'
import { formatRelative } from '@/lib/format'
import { PERMISSION_RESOURCES, type PermissionResource } from '@/types'
import { removeStaff, setStaffStatus, updateStaff, updateStaffPermissions } from '@/services/settingsService'
import { useCan } from '@/lib/permissions'

const ACTIONS_BY_RESOURCE: Record<PermissionResource, { action: string; label: string }[]> = {
  products: [
    { action: 'view', label: 'View' },
    { action: 'create', label: 'Create' },
    { action: 'edit', label: 'Edit' },
    { action: 'delete', label: 'Delete' },
  ],
  orders: [
    { action: 'view', label: 'View' },
    { action: 'edit', label: 'Edit' },
    { action: 'refund', label: 'Refund' },
    { action: 'cancel', label: 'Cancel' },
  ],
  customers: [
    { action: 'view', label: 'View' },
    { action: 'edit', label: 'Edit' },
    { action: 'delete', label: 'Delete' },
  ],
  analytics: [{ action: 'view', label: 'View' }],
  settings: [
    { action: 'view', label: 'View' },
    { action: 'edit', label: 'Edit' },
  ],
}

const RESOURCE_LABELS: Record<PermissionResource, string> = {
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  analytics: 'Analytics',
  settings: 'Settings',
}

export default function StaffDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const member = useStore((s) => s.staff.find((m) => m.id === id))
  const [perms, setPerms] = useState(member?.permissions)
  const canEdit = useCan('settings', 'edit')
  const isOwner = member?.role === 'owner'

  useEffect(() => {
    setPerms(member?.permissions)
  }, [member])

  if (!member || !perms) {
    return (
      <div>
        <PageHeader title="Staff member not found" backTo="/settings/users" backLabel="Users" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Staff member not found" primaryAction={{ label: 'Back to staff', onClick: () => navigate('/settings/users') }} />
        </div>
      </div>
    )
  }

  const togglePerm = (resource: PermissionResource, action: string) => {
    if (!canEdit) return
    setPerms((prev) => {
      if (!prev) return prev
      const current = prev[resource]
      const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action]
      return { ...prev, [resource]: next }
    })
  }

  const savePerms = async () => {
    for (const resource of PERMISSION_RESOURCES) {
      await updateStaffPermissions(member.id, resource, perms[resource])
    }
    toast('Permissions saved — they now apply to this staff member\'s view')
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={member.name}
        subtitle={`${member.email} · ${member.role}${member.lastActiveAt ? ` · last active ${formatRelative(member.lastActiveAt)}` : ''}`}
        backTo="/settings/users"
        backLabel="Users and permissions"
        primaryAction={
          !isOwner && canEdit ? (
            <Button variant="primary" onClick={() => void savePerms()}>
              Save permissions
            </Button>
          ) : undefined
        }
        secondaryActions={
          !isOwner && canEdit ? (
            <Button
              variant="destructive"
              icon={<Trash2 size={13} />}
              onClick={() =>
                confirm({
                  title: `Remove ${member.name}?`,
                  body: 'They will lose access to the admin immediately. Their order and customer history remains.',
                  confirmLabel: 'Remove staff',
                  destructive: true,
                  onConfirm: async () => {
                    await removeStaff(member.id)
                    toast('Staff member removed', { tone: 'critical' })
                    navigate('/settings/users')
                  },
                })
              }
            >
              Remove
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DividedCard>
            <CardHeader
              title="Permissions"
              subtitle={isOwner ? 'Store owners have full access' : 'Choose what this staff member can do'}
            />
            <div className="divide-y divide-border">
              {PERMISSION_RESOURCES.map((resource) => (
                <div key={resource} className="px-4 py-3.5">
                  <p className="text-[13px] font-semibold">{RESOURCE_LABELS[resource]}</p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {ACTIONS_BY_RESOURCE[resource].map(({ action, label }) => {
                      const checked = perms[resource].includes(action)
                      // dependencies: create/edit/delete imply view; edit implies view
                      const impliedBy =
                        action !== 'view' && !perms[resource].includes('view') ? 'view' : undefined
                      return (
                        <label key={action} className={`flex items-center gap-2 text-[13px] ${canEdit && !isOwner ? 'cursor-pointer' : 'opacity-70'}`}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[#303030]"
                            checked={checked}
                            disabled={isOwner || !canEdit}
                            onChange={() => {
                              togglePerm(resource, action)
                              if (action !== 'view' && !checked) togglePerm(resource, 'view')
                            }}
                            aria-label={`${label} ${RESOURCE_LABELS[resource]}`}
                          />
                          {label}
                          {impliedBy && !checked && <span className="text-xs text-text-subdued">(adds View)</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DividedCard>
        </div>

        <div className="space-y-4">
          <DividedCard>
            <CardHeader title="Profile" />
            <CardSection>
              <div className="space-y-3">
                <Input label="Name" value={member.name} disabled />
                <Input label="Email" value={member.email} disabled />
                <Select
                  label="Role"
                  value={member.role}
                  onChange={(e) => {
                    const role = e.target.value as typeof member.role
                    void updateStaff(member.id, { role }).then(() => toast('Role updated'))
                  }}
                  options={[
                    { label: 'Staff', value: 'staff' },
                    { label: 'Admin', value: 'admin' },
                  ]}
                  disabled={isOwner || !canEdit}
                />
              </div>
            </CardSection>
          </DividedCard>

          <DividedCard>
            <CardHeader title="Status" />
            <CardSection>
              <div className="flex items-center justify-between">
                <Badge tone={member.status === 'active' ? 'success' : member.status === 'invited' ? 'warning' : 'neutral'} dot>
                  {member.status}
                </Badge>
                {!isOwner && canEdit && (
                  <div className="flex gap-1.5">
                    {member.status !== 'active' ? (
                      <Button size="sm" onClick={() => void setStaffStatus(member.id, 'active').then(() => toast('Account activated'))}>
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          void setStaffStatus(member.id, 'deactivated').then(() => toast('Account deactivated', { tone: 'warning' }))
                        }
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardSection>
          </DividedCard>
        </div>
      </div>
    </div>
  )
}
