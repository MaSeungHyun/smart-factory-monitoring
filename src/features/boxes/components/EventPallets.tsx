import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Matrix4, type Group } from 'three'

import { getExactTime } from '@/features/playback'
import PalletModel from '@/features/scene/components/models/PalletModel'
import type { PlaybackRun } from '@/shared/types/playback'
import type { PalletEvent } from '@/shared/types/runEvents'

import { localMatrix } from '../lib/boxParenting'
import { createCarriedPallets } from '../lib/carriedPallet'
import { palletEventAt, palletNodeName, palletTracks } from '../lib/palletTracks'

/**
 * PROVISIONAL: palletEvents 가 있는 run 의 팔레트. 그룹 이름 pallet:<id> 로
 * 박스가 parentKind 'pallet' 일 때 이 그룹의 자식처럼 따라온다.
 */
export default function EventPallets({ run, events }: { run: PlaybackRun; events: PalletEvent[] }) {
  const poseAt = useMemo(() => createCarriedPallets(run), [run])

  const tracks = useMemo(() => palletTracks(events), [events])

  const ids = useMemo(() => [...tracks.keys()], [tracks])

  const scene = useThree((state) => state.scene)

  const slots = useRef(new Map<string, Group | null>())

  const scratch = useMemo(() => ({ parent: new Matrix4(), world: new Matrix4(), locals: new Map<PalletEvent, Matrix4>(), pose: [0, 0, 0, 0] }), [])

  const applied = useRef(Number.NaN)

  useFrame(() => {
    const time = getExactTime()

    if (applied.current === time) return

    applied.current = time

    for (const [id, list] of tracks) {
      const slot = slots.current.get(id)

      if (!slot) continue

      const index = palletEventAt(list, time)

      const event = list[index]

      slot.visible = !!event && event.kind !== 'ship'

      if (!slot.visible || !event) continue

      const carrier = event.parentId && event.local ? scene.getObjectByName(event.parentId) : null

      if (carrier && event.local) {
        let local = scratch.locals.get(event)

        if (!local) scratch.locals.set(event, (local = localMatrix(event.local)))

        carrier.updateWorldMatrix(true, false)

        scratch.world.multiplyMatrices(carrier.matrixWorld, local)

        scratch.world.decompose(slot.position, slot.quaternion, slot.scale)

        continue
      }

      if (!poseAt(list, time, scratch.pose)) continue

      const [x, y, z, yaw] = scratch.pose

      slot.position.set(x, y, z)

      slot.rotation.set(0, yaw, 0)
    }
  })

  return (
    <>
      {ids.map((id) => (
        <group key={id} name={palletNodeName(id)} visible={false} ref={(node) => { slots.current.set(id, node) }}>
          <PalletModel />
        </group>
      ))}
    </>
  )
}
