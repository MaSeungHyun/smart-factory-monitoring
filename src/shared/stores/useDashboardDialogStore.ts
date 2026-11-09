import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface DashboardDialogState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const dashboardDialogStore = createStore<DashboardDialogState>((set, get) => ({
  open: false,
  setOpen(open) {
    set({ open })
  },
  toggle() {
    set({ open: !get().open })
  },
}))

export function useDashboardDialog() {
  return useStore(dashboardDialogStore)
}
