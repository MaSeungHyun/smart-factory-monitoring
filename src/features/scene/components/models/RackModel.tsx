import type { SceneEquipment } from '@/shared/types'

import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

function FixedRack() {
  return <primitive object={useCloned(MODEL_URL.rack)} />
}

function MobileRack() {
  return <primitive object={useCloned(MODEL_URL.rackMobile)} />
}

/** rackType "mobile" -> Rack_m.glb, 그 외 Rack.glb */
export default function RackModel({ entity }: { entity: SceneEquipment }) {
  return entity.settings?.rackType === 'mobile' ? <MobileRack /> : <FixedRack />
}
