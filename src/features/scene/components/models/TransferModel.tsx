import { TRANSFER_STOPPERS } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

/** carriage + 스토퍼 2개 (robot_IK procedural). 녹화 파츠가 y 를 움직인다 */
function Carriage() {
  return (
    <group name="carriage">
      {TRANSFER_STOPPERS.parts.map((stopper) => (
        <mesh key={stopper.name} name={stopper.name} position={stopper.pos} castShadow>
          <boxGeometry args={TRANSFER_STOPPERS.size} />

          <meshStandardMaterial color={TRANSFER_STOPPERS.color} />
        </mesh>
      ))}
    </group>
  )
}

/** Transfer_Forklift.glb (원본 그대로) */
export default function TransferModel() {
  return (
    <>
      <primitive object={useCloned(MODEL_URL.transferForklift)} />

      <Carriage />
    </>
  )
}