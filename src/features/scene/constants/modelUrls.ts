import agvUrl from '@/assets/models/AGV.glb?url'
import amrUrl from '@/assets/models/AMR.glb?url'
import doorUrl from '@/assets/models/door.glb?url'
import forkliftUrl from '@/assets/models/Forklift.glb?url'
import palletUrl from '@/assets/models/pallet.glb?url'
import rackUrl from '@/assets/models/Rack.glb?url'
import rackMobileUrl from '@/assets/models/Rack_m.glb?url'
import railUrl from '@/assets/models/rail.glb?url'
import railCUrl from '@/assets/models/rail_c.glb?url'
import railConditionUrl from '@/assets/models/rail_condition.glb?url'
import railInOutUrl from '@/assets/models/rail_in_out.glb?url'
import robotArmUrl from '@/assets/models/RobotArm.glb?url'
import robotArmPlaceUrl from '@/assets/models/robot_arm_place.glb?url'
import robotBaseUrl from '@/assets/models/robot_base.glb?url'
import scanTunnelUrl from '@/assets/models/ScanTunnel.glb?url'
import transferForkliftUrl from '@/assets/models/Transfer_Forklift.glb?url'

/** 장비 종류별 GLB (smart-factory modelAssets / modelUrls 와 같은 파일) */
export const MODEL_URL = {
  agv: agvUrl,
  amr: amrUrl,
  door: doorUrl,
  forklift: forkliftUrl,
  pallet: palletUrl,
  rack: rackUrl,
  rackMobile: rackMobileUrl,
  rail: railUrl,
  railC: railCUrl,
  railCondition: railConditionUrl,
  railInOut: railInOutUrl,
  robotArm: robotArmUrl,
  robotArmPlace: robotArmPlaceUrl,
  robotBase: robotBaseUrl,
  scanTunnel: scanTunnelUrl,
  transferForklift: transferForkliftUrl,
} as const
