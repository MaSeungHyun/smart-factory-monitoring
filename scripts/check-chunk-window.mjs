// node scripts/check-chunk-window.mjs : 泥?겕 李??댁뼱 遺숈씠湲?/ t=600 寃쎄퀎 ?곗냽???뺤씤 (vite ssr 濡?src 瑜?洹몃?濡??쎈뒗??
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const DIR = 'public/data/run-2026-11-03-t06-20m-w7200-s12345-v3/'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

let failed = 0

const ok = (cond, msg) => {
  if (!cond) failed++

  console.log(cond ? 'OK  ' : 'FAIL', msg)
}

try {
  const { ChunkWindow, windowAt } = await server.ssrLoadModule('/src/features/playback/lib/chunkWindow.ts')

  const { indexAt, statusAt } = await server.ssrLoadModule('/src/features/playback/lib/frameAt.ts')

  const { samplePart } = await server.ssrLoadModule('/src/shared/lib/animatedParts/partTimeline.ts')

  const { buildRackTimeline, rackStateAt } = await server.ssrLoadModule('/src/features/warehouse/lib/rackTimeline.ts')

  const manifest = JSON.parse(await readFile(DIR + 'manifest.json', 'utf8'))

  const aggregates = manifest.aggregates ? JSON.parse(await readFile(DIR + manifest.aggregates, 'utf8')) : undefined

  let fetches = 0

  const fetchChunk = async (url) => (fetches++, JSON.parse(await readFile(url, 'utf8')))

  const win = new ChunkWindow(manifest, DIR, fetchChunk, aggregates)

  // [1] 李?/ 援먯껜 議곌굔
  ok(JSON.stringify(windowAt(manifest, 0)) === '[0,1]' && JSON.stringify(windowAt(manifest, 650)) === '[1,1]', 'windowAt 0 -> [0,1], 650 -> [1,1]')

  const merged = await win.build(0)

  ok(!win.needs(0) && !win.needs(599.9) && !win.needs(600.5) === (manifest.chunks.length > 2 ? false : true), 'needs(): 2 chunks -> one window covers whole run')

  const tail = await new ChunkWindow(manifest, DIR, fetchChunk, aggregates).build(650)

  ok(win.needs(1200) === false, 'loop: time 0 / end stay in window [0,1]')

  // [2] 踰붿쐞
  const { t } = merged.tracks

  ok(t[0] < 0.1 && t[t.length - 1] === manifest.duration, `tracks cover 0..${t[t.length - 1]} (${t.length} frames)`)

  ok(t.every((v, i) => i === 0 || v > t[i - 1]), 'track times strictly increasing across boundary')

  ok(merged.status[merged.status.length - 1].t >= 1199, `status to ${merged.status.at(-1).t}`)

  ok(merged.events.some((e) => e.t >= 600) && merged.events.some((e) => e.t < 600), `events both sides (${merged.events.length})`)

  // [3] t=600 ?곗냽?? ?댁뼱 遺숈씤 run 怨?泥?겕1 ?⑤룆 run (泥?겕1 ?ㅻ깄???쒖옉) ??媛숈? ?곹깭?ъ빞 ?쒕떎
  const at = (run, time) => indexAt(run.tracks.t, time)

  let maxJoint = 0

  for (const [id, frames] of Object.entries(merged.tracks.joints)) {
    const a = frames[at(merged, 600.2)], b = tail.tracks.joints[id][at(tail, 600.2)]

    a.forEach((v, k) => (maxJoint = Math.max(maxJoint, Math.abs(((v - b[k] + 540) % 360) - 180))))

    const p = frames[at(merged, 599.95)], q = frames[at(merged, 600.15)]

    p.forEach((v, k) => (maxJoint = Math.max(maxJoint, Math.abs(v - q[k]) > 30 ? Math.abs(v - q[k]) : maxJoint)))
  }

  ok(maxJoint < 1, `joints merged == chunk1 at 600.2, no jump across 600 (max diff ${maxJoint.toFixed(3)} deg)`)

  let maxAmr = 0

  for (const [id, poses] of Object.entries(merged.tracks.poses)) {
    const a = poses[at(merged, 599.95)], b = poses[at(merged, 600.15)]

    if (a && b) maxAmr = Math.max(maxAmr, Math.hypot(a[0] - b[0], a[2] - b[2]))
  }

  ok(maxAmr < 0.5, `AMR max step across 600: ${maxAmr.toFixed(3)} m`)

  const s0 = statusAt(merged.status, 599.9), s1 = statusAt(merged.status, 600.3), sTail = statusAt(tail.status, 600.3)

  ok(s1.counts.inbound >= s0.counts.inbound && s1.counts.inbound === sTail.counts.inbound, `counts continuous: inbound ${s0.counts.inbound} -> ${s1.counts.inbound} (chunk1 alone ${sTail.counts.inbound})`)

  ok(Object.keys(s1.equipment).length === Object.keys(s0.equipment).length, `equipment states ${Object.keys(s1.equipment).length}`)

  // 諛뺤뒪: 600 ???댁븘 ?덈뒗 諛뺤뒪 吏묓빀
  const alive = (run, time) => new Set(run.boxes.filter((b) => b.t0 <= time && (b.t1 === null || b.t1 > time)).map((b) => b.id))

  const am = alive(merged, 600.5), at1 = alive(tail, 600.5)

  // 청크1 스냅샷에는 이미 출하된 팔레트 위 박스가 남아 있다. 이어 붙인 run 은 청크0 에서 퇴장을 알고 있으므로 그 박스는 차이로 치지 않는다
  const retired = (id) => { const box = merged.boxes.find((b) => b.id === id); return box && box.t1 !== null && box.t1 < 600 && box.reason === 'outbound' }

  const diff = [...am].filter((id) => !at1.has(id)).length + [...at1].filter((id) => !am.has(id) && !retired(id)).length

  ok(diff === 0, `boxes alive at 600.5: merged ${am.size}, chunk1 alone ${at1.size}, diff ${diff}; total tracks ${merged.boxes.length}`)

  // ?뚯툩
  let moved = 0, partDiff = 0

  for (const [k, track] of merged.parts.entries()) {
    const a = samplePart(track, 600.5), b = samplePart(tail.parts[k], 600.5)

    if (track.t.some((v) => v > 600)) moved++

    if (typeof a === 'number' && typeof b === 'number') partDiff = Math.max(partDiff, Math.abs(a - b))
  }

  ok(partDiff < 0.05, `animated parts merged == chunk1 at 600.5 (max ${partDiff.toFixed(4)}), ${moved} parts have rows after 600`)

  // ??  const equipment = manifest.equipment.map((e) => ({ ...e, x: e.pos[0], z: e.pos[1] }))

  const equipment = manifest.equipment.map((e) => ({ ...e, x: e.pos[0], z: e.pos[1] }))

  const rm = buildRackTimeline(merged, equipment), rt = buildRackTimeline(tail, equipment)

  if (rm && rt) {
    const filled = (map) => [...map.values()].flat().filter(Boolean).length

    const a = rackStateAt(rm, 600.5), b = rackStateAt(rt, 600.5)

    ok(Math.abs(filled(a) - filled(b)) <= 1, `rack slots filled at 600.5: merged ${filled(a)}, chunk1 alone ${filled(b)}; changes ${rm.changes.length}`)
  } else ok(false, 'rack timeline missing')

  console.log(`chunk fetches: ${fetches}`)
} finally {
  await server.close()
}

if (failed) {
  console.log(`${failed} failed`)

  process.exit(1)
}