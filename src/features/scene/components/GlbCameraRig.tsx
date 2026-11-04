import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { AnimationMixer, LoopOnce, Matrix4, PerspectiveCamera, Quaternion, Spherical, Vector3, type AnimationAction, type AnimationClip, type Object3D } from 'three'

import cameraUrl from '@/assets/models/main_camera.glb?url'
import { FACTORY_GLB_URL } from '@/features/template'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { cameraBus, type CameraCommand } from '@/shared/stores/cameraBus'
import { DEFAULT_ROBOT_ID, monitorView, useMonitorState, type MonitorViewState } from '@/shared/stores/useMonitorViewStore'
import { uiStore } from '@/shared/stores/useUiStore'

import { cameraArrival } from '../lib/cameraArrival'
import { focusPose, zoomPose } from '../lib/focusPose'
import { useSceneWarm } from '../lib/sceneWarm'
import { glbCameraPose, type CameraPose } from '../lib/glbCameraPose'
import { robotCameraPose } from '../lib/robotCameraPose'
import { scanCameraPose } from '../lib/scanCameraPose'
import { warehouseCameraPose } from '../lib/warehouseCameraPose'

/** factory.glb 카메라 노드 (대소문자 무시). 메인 홈 시점은 main_camera.glb 끝 자세 */
const MAIN_CAM = 'main_cam'

const ROBOT_CAM = 'robot_cam'

const CLIP_NAME = 'main_camAction'

/** 시점 이동 비행 시간 (초) */
const DURATION = 1.4

/** 휠 줌 비행 시간 (초) */
const ZOOM_DURATION = 0.35

/** 정면 / 측면 / 탑뷰 전환 비행 시간 (초). 이때만 타깃 둘레로 돌며 빠르게 간다 */
const ANGLE_DURATION = 0.6

/** F 키 포커싱 비행 시간 (초). 빠르게 붙는다 */
const FOCUS_KEY_DURATION = 0.5

/** 더블클릭 따라가기 비행 시간 (초). 일반 이동보다 조금 빠르게 */
const FOLLOW_DURATION = 1.1

/** 인트로 카메라가 끝나는 자세(메인 홈 시점). 궤적은 통째로 옮기고 회전·화각은 진행도에 따라 서서히 맞춘다 */
const INTRO_END_POSE = {
  position: new Vector3(114.903, 124.905, 123.815),
  target: new Vector3(6.235, -8.646, 8.339),
  fov: 32.269,
}

// 줌 아웃 한계: 인트로 끝 시점의 카메라-타깃 거리보다 멀어지지 않게 한다
const MAX_ZOOM_OUT_DISTANCE = INTRO_END_POSE.position.distanceTo(INTRO_END_POSE.target)

/** 한 프레임에 클립이 통째로 건너뛰지 않게 하는 상한(초) */
const CLIP_STEP = 0.05

/** ease-out (cubic): 빠르게 출발해 오버슈트 없이 멈춘다 */
const ease = (k: number) => 1 - (1 - k) ** 3

interface Flight {
  from: CameraPose & { fov: number }
  to: CameraPose
  elapsed: number
  duration: number
  /** true 면 타깃 둘레 호(구면 보간), false 면 직선 */
  arc: boolean
  /** 타깃 기준 카메라 오프셋 (구면 좌표). 회전·고도·거리를 같이 보간해 도착 후 도는 일이 없게 한다 */
  fromOrbit: Spherical
  toOrbit: Spherical
}

const scratchOffset = new Vector3()

const scratchOrbit = new Spherical()

function orbitOf(pose: CameraPose) {
  return new Spherical().setFromVector3(scratchOffset.subVectors(pose.position, pose.target))
}

interface CameraClip {
  mixer: AnimationMixer
  action: AnimationAction
  duration: number
  node: PerspectiveCamera
  end: CameraPose | null
  /** 원래 끝 회전에서 목표 끝 회전으로 가는 보정 회전 */
  turn: Quaternion
  /** 원래 끝 화각 */
  rawFov: number
}

const scratchPos = new Vector3()

const scratchQuat = new Quaternion()

const scratchDir = new Vector3()

function findNamed(root: Object3D, name: string): Object3D | null {
  const lower = name.toLowerCase()

  const found: Object3D[] = []

  root.traverse((object) => {
    if (found.length === 0 && object.name.toLowerCase() === lower) found.push(object)
  })

  return found[0] ?? null
}

function findCamera(root: Object3D, name: string): PerspectiveCamera | null {
  const named = findNamed(root, name)

  if (!named) return null

  if (named instanceof PerspectiveCamera) return named

  const found: PerspectiveCamera[] = []

  named.traverse((object) => {
    if (found.length === 0 && object instanceof PerspectiveCamera) found.push(object)
  })

  return found[0] ?? null
}

function buildClip(root: Object3D, animations: AnimationClip[]): CameraClip | null {
  const clip = animations.find((item) => item.name === CLIP_NAME) ?? animations[0]

  if (!clip) return null

  const node = findCamera(root, MAIN_CAM)

  if (!node) return null

  const mixer = new AnimationMixer(root)

  const action = mixer.clipAction(clip)

  action.setLoop(LoopOnce, 1)

  action.clampWhenFinished = true

  action.play()

  mixer.update(clip.duration)

  root.updateMatrixWorld(true)

  const rawPos = node.getWorldPosition(new Vector3())

  const rawQuat = node.getWorldQuaternion(new Quaternion())

  const rawFov = node.fov

  action.stop()

  // 궤적 전체를 평행이동해서 끝 위치를 목표 위치에 맞춘다
  root.position.add(new Vector3().subVectors(INTRO_END_POSE.position, rawPos))

  root.updateMatrixWorld(true)

  const look = new Matrix4().lookAt(INTRO_END_POSE.position, INTRO_END_POSE.target, new Vector3(0, 1, 0))

  const endQuat = new Quaternion().setFromRotationMatrix(look)

  const turn = endQuat.multiply(rawQuat.invert())

  const end: CameraPose = { position: INTRO_END_POSE.position.clone(), target: INTRO_END_POSE.target.clone(), fov: INTRO_END_POSE.fov }

  return { mixer, action, duration: clip.duration, node, end, turn, rawFov }
}

const identity = new Quaternion()

const scratchTurn = new Quaternion()

/** 애니메이션 카메라의 월드 자세를 화면 카메라에 복사한다. 회전·화각 보정은 진행도에 맞춰 서서히 적용 */
function applyAnimated(clip: CameraClip, camera: PerspectiveCamera, target: Vector3) {
  const { node } = clip

  const raw = clip.duration > 0 ? Math.min(clip.action.time / clip.duration, 1) : 1

  const k = raw * raw * (3 - 2 * raw)

  node.getWorldPosition(scratchPos)

  node.getWorldQuaternion(scratchQuat)

  scratchTurn.slerpQuaternions(identity, clip.turn, k)

  scratchQuat.premultiply(scratchTurn)

  camera.position.copy(scratchPos)

  camera.quaternion.copy(scratchQuat)

  const fov = node.fov + ((clip.end?.fov ?? node.fov) - clip.rawFov) * k

  if (fov !== camera.fov) {
    camera.fov = fov

    camera.updateProjectionMatrix()
  }

  if (raw >= 1 && clip.end) {
    target.copy(clip.end.target)

    return
  }

  scratchDir.set(0, 0, -1).applyQuaternion(scratchQuat)

  const distance = scratchDir.y < -1e-3 ? -scratchPos.y / scratchDir.y : 50

  target.copy(scratchPos).addScaledVector(scratchDir, distance)
}

function placeCamera(camera: PerspectiveCamera, position: Vector3, fov: number) {
  camera.position.copy(position)

  camera.fov = fov

  camera.updateProjectionMatrix()
}

function sameView(a: MonitorViewState, b: MonitorViewState) {
  return a.view === b.view && a.robotId === b.robotId && a.scannerId === b.scannerId && a.angle === b.angle && a.angleNonce === b.angleNonce
}

interface Chase {
  id: string | null
  ready: boolean
  anchor: Vector3
  world: Vector3
  shift: Vector3
}

function createChase(): Chase {
  return { id: null, ready: false, anchor: new Vector3(), world: new Vector3(), shift: new Vector3() }
}

function stopChase(chase: Chase, flight: { current: Flight | null }, cancelFlight: boolean) {
  chase.id = null

  chase.ready = false

  if (cancelFlight) flight.current = null
}

/** 로봇 추적 기준 관절: hand03, 팔 관절이 움직이는 대로 위치만 따라간다 (회전은 따라가지 않음) */
const ROBOT_TRACK_NODE = 'hand03'

/** 추적 기준점: 로봇은 hand02 (없으면 로봇 원점), 나머지는 장비 원점 */
function trackPoint(id: string, object: Object3D) {
  if (!id.startsWith('robot-')) return object

  return object.getObjectByName(ROBOT_TRACK_NODE) ?? object
}

/** 따라가는 장비가 움직인 만큼 카메라 · 비행 경로를 같이 옮긴다 */
function applyFollow(chase: Chase, scene: Object3D, camera: PerspectiveCamera, orbit: { target: Vector3; update: () => void }, flight: Flight | null) {
  const object = chase.id ? scene.getObjectByName(chase.id) : null

  if (!object) return

  trackPoint(chase.id!, object).getWorldPosition(chase.world)

  if (!chase.ready) {
    chase.anchor.copy(chase.world)

    chase.ready = true

    return
  }

  chase.shift.subVectors(chase.world, chase.anchor)

  if (chase.shift.lengthSq() === 0) return

  chase.anchor.copy(chase.world)

  if (flight) {
    flight.from.position.add(chase.shift)

    flight.to.position.add(chase.shift)

    flight.from.target.add(chase.shift)

    flight.to.target.add(chase.shift)

    return
  }

  camera.position.add(chase.shift)

  orbit.target.add(chase.shift)

  orbit.update()
}

function goalPose(state: MonitorViewState, main: CameraPose | null, robotCam: CameraPose | null, scene: Object3D) {
  if (state.view === 'main') return main

  if (state.view === 'warehouse') return warehouseCameraPose(main?.fov)

  if (state.view === 'scan') {
    const scanner = scene.getObjectByName(state.scannerId)

    return scanner ? scanCameraPose(scanner, state.angle, robotCam?.fov ?? main?.fov) : main
  }

  if (!robotCam) return main

  const reference = scene.getObjectByName(DEFAULT_ROBOT_ID)

  const robot = scene.getObjectByName(state.robotId)

  if (!reference || !robot) return robotCam

  return robotCameraPose(robotCam, reference, robot, state.angle)
}

/**
 * 카메라: 처음에는 main_camera.glb 의 main_camAction 을 한 번 재생한다.
 * 클립이 끝나면 마지막 프레임이 메인 홈이 되고 OrbitControls 가 열린다.
 * 이후 화면 상태가 바뀌면(레일 탭, 로봇 선택, 시점 버튼) 목표 시점으로 보간.
 * follow 는 장비 이동량만큼 카메라와 타깃을 같이 옮긴다. 팬 또는 Esc 로 해제. 그 외 Esc 는 메인으로.
 */
export default function GlbCameraRig() {
  const { scene: glb } = useGLTF(FACTORY_GLB_URL)

  const cameraGltf = useGLTF(cameraUrl)

  const get = useThree((state) => state.get)

  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)

  const flight = useRef<Flight | null>(null)

  const placed = useRef(false)

  const intro = useRef<'idle' | 'play' | 'done'>('idle')

  const chase = useMemo(() => createChase(), [])

  const state = useMonitorState()

  const seenView = useRef(state)

  const clip = useMemo(() => buildClip(cameraGltf.scene, cameraGltf.animations), [cameraGltf])

  const clipRef = useRef(clip)

  clipRef.current = clip

  const poses = useMemo(
    () => ({ main: clip?.end ?? glbCameraPose(glb, MAIN_CAM), robot: glbCameraPose(glb, ROBOT_CAM) }),
    [glb, clip],
  )

  const finishIntro = useCallback(() => {
    if (intro.current !== 'play') return

    intro.current = 'done'

    clipRef.current?.action.stop()

    const { camera } = get()

    const orbit = controls.current

    if (camera instanceof PerspectiveCamera && orbit) {
      camera.up.set(0, 1, 0)

      orbit.enabled = true

      orbit.update()
    }

    cameraArrival.getState().arrive()
  }, [get])

  const fly = useCallback(
    (goal: CameraPose, duration = DURATION, arc = false) => {
      if (intro.current === 'play') finishIntro()

      const { camera } = get()

      const orbit = controls.current

      if (!(camera instanceof PerspectiveCamera) || !orbit) return

      flight.current = {
        from: { position: camera.position.clone(), target: orbit.target.clone(), fov: camera.fov },
        to: goal,
        elapsed: 0,
        duration,
        arc,
        fromOrbit: orbitOf({ position: camera.position, target: orbit.target }),
        toOrbit: orbitOf(goal),
      }

      // 방위각은 짧은 쪽으로 돈다
      const { fromOrbit, toOrbit } = flight.current

      const turn = Math.atan2(Math.sin(toOrbit.theta - fromOrbit.theta), Math.cos(toOrbit.theta - fromOrbit.theta))

      toOrbit.theta = fromOrbit.theta + turn
    },
    [get, finishIntro],
  )

  const warm = useSceneWarm()

  useLayoutEffect(() => {
    if (!warm) return

    const { camera, scene } = get()

    const orbit = controls.current

    if (!(camera instanceof PerspectiveCamera) || !orbit) return

    if (!placed.current) {
      placed.current = true

      seenView.current = state

      if (clip) {
        intro.current = 'play'

        orbit.enabled = false

        clip.action.reset()

        clip.action.play()

        clip.mixer.update(0)

        applyAnimated(clip, camera, orbit.target)

        return
      }

      intro.current = 'done'

      orbit.enabled = true

      cameraArrival.getState().arrive()

      if (poses.main) {
        placeCamera(camera, poses.main.position, poses.main.fov ?? camera.fov)

        orbit.target.copy(poses.main.target)

        orbit.update()
      }

      return
    }

    if (intro.current === 'play') {
      if (sameView(seenView.current, state)) return

      seenView.current = state

      stopChase(chase, flight, false)

      const goal = goalPose(state, poses.main, poses.robot, scene)

      if (goal) fly(goal)

      return
    }

    const prev = seenView.current

    if (!sameView(prev, state)) {
      seenView.current = state

      stopChase(chase, flight, false)
    } else if (prev.free !== state.free) {
      // 직접 조작으로 시점 버튼만 풀린 경우: 카메라는 그대로 둔다
      seenView.current = state

      return
    }

    const goal = goalPose(state, poses.main, poses.robot, scene)

    if (!goal) return

    const angleOnly = prev.view === state.view && prev.robotId === state.robotId && prev.scannerId === state.scannerId && (prev.angle !== state.angle || prev.angleNonce !== state.angleNonce)

    if (angleOnly) fly(goal, ANGLE_DURATION, true)
    else fly(goal)
  }, [warm, get, poses, state, fly, clip, chase])

  useEffect(() => {
    return () => {
      clipRef.current?.mixer.stopAllAction()
    }
  }, [])

  useEffect(() => {
    const onCommand = (command: CameraCommand) => {
      const { camera, scene } = get()

      const orbit = controls.current

      if (!orbit) return

      if (command.kind === 'follow') {
        const object = scene.getObjectByName(command.id)

        if (!object || !(camera instanceof PerspectiveCamera)) return

        chase.id = command.id

        chase.ready = false

        fly(focusPose(object, camera.position, orbit.target), FOLLOW_DURATION)

        return
      }

      if (command.kind !== 'zoom') stopChase(chase, flight, false)

      if (command.kind === 'zoom') {
        fly(zoomPose(camera.position, orbit.target, command.factor), ZOOM_DURATION)

        return
      }

      if (command.kind === 'home') {
        if (poses.main) fly(poses.main)

        return
      }

      const id = command.kind === 'focus' ? command.id : uiStore.getState().selectedId

      const object = id ? scene.getObjectByName(id) : null

      if (object) {
        fly(focusPose(object, camera.position, orbit.target), command.kind === 'focus' && command.fast ? FOCUS_KEY_DURATION : DURATION)

        return
      }

      const goal = goalPose(monitorView.getState(), poses.main, poses.robot, scene)

      if (goal) fly(goal)
    }

    return cameraBus.on(onCommand)
  }, [get, poses, fly, chase])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (event.target instanceof HTMLInputElement) return

      if (chase.id) {
        stopChase(chase, flight, true)

        return
      }

      if (uiStore.getState().selectedId) uiStore.getState().select(null)
      else monitorView.getState().set('main')
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [chase])

  useEffect(() => {
    // F 키: 선택한 오브젝트로 포커싱 (입력 중이거나 조합 키면 무시)
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'f' && event.key !== 'F') return

      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return

      const field = event.target

      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || (field instanceof HTMLElement && field.isContentEditable)) return

      const id = uiStore.getState().selectedId

      if (id) cameraBus.request({ kind: 'focus', id, fast: true })
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) return

    // 개발용: P 키로 현재 카메라 자세를 콘솔에 출력
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'p' && event.key !== 'P') return

      const { camera } = get()

      const orbit = controls.current

      if (!(camera instanceof PerspectiveCamera) || !orbit) return

      const r = (v: number) => Math.round(v * 1000) / 1000

      const pose = { position: camera.position.toArray().map(r), target: orbit.target.toArray().map(r), fov: r(camera.fov) }

      console.log('[camera pose]', JSON.stringify(pose))
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [get])

  const point = useMemo(() => new Vector3(), [])

  useEffect(() => {
    const { gl } = get()

    const onPointerDown = (event: PointerEvent) => {
      if (!chase.id) return

      const modified = event.ctrlKey || event.metaKey || event.shiftKey

      const pan = (event.button === 2 && !modified) || (event.button === 0 && modified) || (event.pointerType === 'touch' && !event.isPrimary)

      if (!pan) return

      stopChase(chase, flight, true)
    }

    gl.domElement.addEventListener('pointerdown', onPointerDown)

    return () => gl.domElement.removeEventListener('pointerdown', onPointerDown)
  }, [get, chase])

  useFrame(({ camera, scene }, delta) => {
    const orbit = controls.current

    if (!orbit || !(camera instanceof PerspectiveCamera)) return

    const playing = clipRef.current

    if (intro.current === 'play' && playing) {
      orbit.enabled = false

      playing.mixer.update(Math.min(delta, CLIP_STEP))

      applyAnimated(playing, camera, orbit.target)

      const finished = playing.action.time >= playing.duration - 1e-4

      if (finished) {
        finishIntro()

        const now = monitorView.getState()

        if (!sameView(seenView.current, now)) {
          seenView.current = now

          const goal = goalPose(now, poses.main, poses.robot, scene)

          if (goal) fly(goal)
        }
      } else {
        return
      }
    }

    applyFollow(chase, scene, camera, orbit, flight.current)

    const active = flight.current

    if (!active) return

    active.elapsed = Math.min(active.elapsed + delta, active.duration)

    const k = ease(active.elapsed / active.duration)

    orbit.target.lerpVectors(active.from.target, active.to.target, k)

    if (active.arc) {
      // 시점 전환: 타깃 둘레로 보간해 탑뷰로 갈 때 내려다보며 돌면서 도착한다
      const { fromOrbit, toOrbit } = active

      scratchOrbit.set(fromOrbit.radius + (toOrbit.radius - fromOrbit.radius) * k, fromOrbit.phi + (toOrbit.phi - fromOrbit.phi) * k, fromOrbit.theta + (toOrbit.theta - fromOrbit.theta) * k)

      point.setFromSpherical(scratchOrbit).add(orbit.target)
    } else {
      point.lerpVectors(active.from.position, active.to.position, k)
    }

    if (active.elapsed >= active.duration) point.copy(active.to.position)

    placeCamera(camera, point, active.from.fov + ((active.to.fov ?? active.from.fov) - active.from.fov) * k)

    orbit.update()

    if (active.elapsed >= active.duration) flight.current = null
  })

  return <OrbitControls ref={controls} makeDefault enableDamping={false} maxDistance={MAX_ZOOM_OUT_DISTANCE} onStart={() => monitorView.getState().release()} />
}
