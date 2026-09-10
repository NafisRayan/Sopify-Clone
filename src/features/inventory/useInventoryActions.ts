import { getStore, useStore } from '@/store/useStore'
import { uid } from '@/lib/id'
import { delay } from '@/lib/delay'
import type { Location } from '@/types'

export interface LocationInput {
  name: string
  address1: string
  city: string
  province: string
  country: string
  zip: string
  phone: string
}

/** Local wrapper around settings/inventory services for the locations feature */
export function useInventoryActions() {
  const store = useStore.getState()

  const createLocation = async (input: LocationInput): Promise<Location> => {
    await delay(300)
    const location: Location = {
      id: uid('loc'),
      name: input.name.trim(),
      address1: input.address1.trim(),
      city: input.city,
      province: input.province,
      country: input.country,
      zip: input.zip,
      phone: input.phone || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    }
    store.addLocation(location)
    return location
  }

  const updateLocation = async (id: string, input: LocationInput): Promise<void> => {
    await delay(300)
    store.patchLocation(id, {
      name: input.name.trim(),
      address1: input.address1.trim(),
      city: input.city,
      province: input.province,
      country: input.country,
      zip: input.zip,
      phone: input.phone || undefined,
    })
  }

  const setLocationActive = async (id: string, active: boolean): Promise<void> => {
    await delay(250)
    store.patchLocation(id, { active })
  }

  return { createLocation, updateLocation, setLocationActive }
}

/** Convenience for tests/dev */
export function countInventoryAt(locationId: string): number {
  return getStore().inventoryLevels.filter((l) => l.locationId === locationId).length
}
