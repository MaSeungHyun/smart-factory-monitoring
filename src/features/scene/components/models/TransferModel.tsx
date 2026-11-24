import { useLayoutEffect, useRef } from 'react'
import type { Group, Object3D } from 'three'

import { castShadows, staticShadows } from '@/shared/lib/three/modelBounds'

import { TRANSFER_STOPPERS } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

/** 녹화가 y 를 움직이는 포크 노드 (나머지 프레임은 고정) */
const FORK_NODE = 'Transfer_Forklift_fork'

/** 프레임은 고정 그림자, 오르내리는 포크만 움직이는 그림자 */
const prepareTransfer = (model: Object3D) => {
  staticShadows(model)

  const fork = model.getObjectByName(FORK_NODE)

  if (fork) castShadows(fork)

  return model
}

/** carriage + 스토퍼 2개 (robot_IK procedural). 녹화 파츠가 y 를 움직인다 */
function Carriage() {
  const group = useRef<Group>(null)

  // 오르내리므로 움직이는 그림자에 넣는다
  useLayoutEffect(() => {
    if (group.current) castShadows(group.current)
  }, [])

  return (
    <group ref={group} name="carriage">
      {TRANSFER_STOPPERS.parts.map((stopper) => (
        <mesh key={stopper.name} name={stopper.name} position={stopper.pos}>
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
      <primitive object={useCloned(MODEL_URL.transferForklift, prepareTransfer)} />

      <Carriage />
    </>
  )
}