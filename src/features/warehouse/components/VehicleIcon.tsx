import { Car, Container, Forklift, Truck } from 'lucide-react'

import type { VehicleCategory } from '../lib/vehicles'

const ICON = { amr: Truck, agv: Car, forklift: Forklift, rack: Container }

export default function VehicleIcon({ category, size = 18 }: { category: VehicleCategory; size?: number }) {
  const Icon = ICON[category]

  return <Icon size={size} />
}
