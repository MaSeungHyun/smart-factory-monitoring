import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

/** Transfer_Forklift.glb (원본 그대로) */
export default function TransferModel() {
  return <primitive object={useCloned(MODEL_URL.transferForklift)} />
}
