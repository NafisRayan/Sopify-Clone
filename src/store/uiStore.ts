import { create } from 'zustand'

/** Transient UI state (not persisted except actingStaffId for permission demo) */
interface UiState {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  globalSearchOpen: boolean
  setGlobalSearchOpen: (open: boolean) => void
  /** which staff member's permissions the UI is simulating (owner default) */
  actingStaffId: string | null
  setActingStaffId: (id: string | null) => void
}

export const useUiStore = create<UiState>()((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  globalSearchOpen: false,
  setGlobalSearchOpen: (globalSearchOpen) => set({ globalSearchOpen }),
  actingStaffId: null,
  setActingStaffId: (actingStaffId) => set({ actingStaffId }),
}))
