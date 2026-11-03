// v3 애니메이션 파츠 검증: node scripts/check-animated-parts.mjs [runDir]
// 1) 디코더(buildPartTracks / samplePart) 로 manifest + 청크를 읽는다
// 2) GLB 노드 파츠의 partName 이 해당 GLB 안에 있는지 확인한다 (GLTFLoader 처럼 "." 등을 지워 비교)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildPartTracks, samplePart } from '../src/shared/lib/animatedParts/partTimeline.ts'

const runDir = process.argv[2] ?? 'public/data/run-2026-11-03-t06-20m-w7200-s12345-v3'

const GLB_BY_KIND = {
  forklift: 'Forklift.glb',
  agv: 'AGV.glb',
  transfer: 'Transfer_Forklift.glb',
  robot: 'RobotArm.glb',
  door: 'door.glb',
}

/**
 * GLB 에 없어도 되는 파츠: 앱이 직접 만드는 procedural 파츠 +
 * AGV.Lift (robot_IK 도 AGV.glb 위에 빈 그룹으로 만든다. 보이는 메시가 없어 앱에서는 건너뛴다)
 */
const APP_NODES = { door: ['curtain'], transfer: ['stopper-x', 'stopper+x'], conveyor: ['belt'], agv: ['AGV.Lift'] }

const clean = (name) => name.replace(/\s/g, '_').replace(/[[\]./:]/g, '')

function glbNodeNames(file) {
  const buffer = readFileSync(join('src/assets/models', file))

  const length = buffer.readUInt32LE(12)

  const json = JSON.parse(buffer.subarray(20, 20 + length).toString('utf8'))

  return new Set((json.nodes ?? []).flatMap((node) => (node.name ? [node.name, clean(node.name)] : [])))
}

let errors = 0

const fail = (message) => {
  errors += 1

  console.error('FAIL', message)
}

// [1] 디코더

const manifest = JSON.parse(readFileSync(join(runDir, 'manifest.json'), 'utf8'))

const parts = manifest.animatedParts ?? []

if (!parts.length) fail('manifest.animatedParts 없음')

for (const entry of manifest.chunks) {
  const chunk = JSON.parse(readFileSync(join(runDir, entry.file), 'utf8'))

  const offset = manifest.simTimeOffset

  const tracks = buildPartTracks(parts, chunk.snapshot.parts, chunk.tracks.parts, offset)

  const rows = chunk.tracks.parts?.length ?? 0

  const moving = tracks.filter((track) => track.t.length > 1).length

  if (tracks.length !== parts.length) fail(`chunk ${entry.i}: tracks ${tracks.length} != parts ${parts.length}`)

  for (const track of tracks) {
    for (let n = 1; n < track.t.length; n += 1) if (track.t[n] < track.t[n - 1]) fail(`chunk ${entry.i}: part ${track.part.i} 시간 역순`)

    const mid = (entry.t0 + entry.t1) / 2 - offset

    const value = samplePart(track, mid)

    const quat = track.part.channel === 'quat'

    if (value !== null && quat !== Array.isArray(value)) fail(`chunk ${entry.i}: part ${track.part.i} 값 형식`)

    if (Array.isArray(value) && Math.abs(Math.hypot(...value) - 1) > 1e-3) fail(`chunk ${entry.i}: part ${track.part.i} quat 정규화`)
  }

  const fork = tracks.find((track) => track.part.kind === 'forklift' && track.t.length > 1)

  const sample = fork ? [fork.part.deviceId, fork.t.length, samplePart(fork, fork.t[1] + 0.05)].join(' ') : '-'

  console.log(`chunk ${entry.i} (${entry.t0}-${entry.t1}s): rows ${rows}, moving parts ${moving}/${tracks.length}, forklift sample: ${sample}`)
}

// [2] GLB 노드 이름

const equipmentIds = new Set(manifest.equipment.map((item) => item.id))

const cache = new Map()

for (const part of parts) {
  if (!equipmentIds.has(part.deviceId)) {
    console.warn(`SKIP part ${part.i}: ${part.deviceId} 는 장비 목록에 없음 (앱이 그리지 않음)`)

    continue
  }

  if (APP_NODES[part.kind]?.includes(part.partName)) continue

  const file = GLB_BY_KIND[part.kind]

  if (!file) {
    fail(`part ${part.i}: kind ${part.kind} 의 GLB 매핑 없음`)

    continue
  }

  if (!cache.has(file)) cache.set(file, glbNodeNames(file))

  if (!cache.get(file).has(part.partName) && !cache.get(file).has(clean(part.partName))) fail(`part ${part.i}: ${part.partName} 이 ${file} 에 없음`)
}

console.log(errors ? `${errors} errors` : `OK: ${parts.length} parts, GLB nodes 확인 완료`)

process.exit(errors ? 1 : 0)