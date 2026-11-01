import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

/** rail_condition.glb (원본 그대로) */
export default function RailModel() {
  return <primitive object={useCloned(MODEL_URL.railCondition)} />
}
