import { useMemo } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useStore } from '@/store/useStore'
import { CURRENT_USER } from '@/lib/constants'
import type { PermissionResource } from '@/types'

/**
 * Effective permissions of the staff member the UI is acting as.
 * Owner has everything; `simulate as` in Settings switches this (spec §26).
 */
export function usePermissions(): Record<PermissionResource, Set<string>> {
  const actingStaffId = useUiStore((s) => s.actingStaffId)
  const staff = useStore((s) => s.staff)
  return useMemo(() => {
    const member = staff.find((s) => s.id === actingStaffId)
    const effective = member && member.role !== 'owner' ? member : CURRENT_USER
    if (effective.role === 'owner') {
      return {
        products: new Set(['view', 'create', 'edit', 'delete']),
        orders: new Set(['view', 'edit', 'refund', 'cancel']),
        customers: new Set(['view', 'edit', 'delete']),
        analytics: new Set(['view']),
        settings: new Set(['view', 'edit']),
      }
    }
    return {
      products: new Set(effective.permissions.products),
      orders: new Set(effective.permissions.orders),
      customers: new Set(effective.permissions.customers),
      analytics: new Set(effective.permissions.analytics),
      settings: new Set(effective.permissions.settings),
    }
  }, [actingStaffId, staff])
}

export function useCan(resource: PermissionResource, action: string): boolean {
  const perms = usePermissions()
  return perms[resource].has(action)
}
