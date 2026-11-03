import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { AnimationMixer, LoopOnce, PerspectiveCamera, Quaternion, Vector3, type AnimationAction, type AnimationClip, type Object3D } from 'three'

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

const DURATION = 1.4

const ZOOM_DURATION = 0.35

/** 한 프레임에 클립이 통째로 건너뛰지 않게 하는 상한(초) */
const CLIP_STEP = 0.05

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)

interface Flight {
  from: CameraPose & { fov: number }
  to: CameraPose
  elapsed: number
  duration: number
}

interface CameraClip {
  mixer: AnimationMixer
  action: AnimationAction
  duration: number
  node: PerspectiveCamera
  end: CameraPose | null
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

/** 클립을 time 에 맞춘 뒤 시선이 바닥과 만나는 포즈를 읽는다. 끝 프레임은 클램프해야 마지막 키가 남는다 */
function poseAt(root: Object3D, clip: AnimationClip, time: number): CameraPose | null {
  const mixer = new AnimationMixer(root)

  const action = mixer.clipAction(clip)

  action.setLoop(LoopOnce, 1)

  action.clampWhenFinished = true

  action.play()

  mixer.update(time)

  root.updateMatrixWorld(true)

  const pose = glbCameraPose(root, MAIN_CAM)

  mixer.stopAllAction()

  mixer.uncacheRoot(root)

  return pose
}

function buildClip(root: Object3D, animations: AnimationClip[]): CameraClip | null {
  const clip = animations.find((item) => item.name === CLIP_NAME) ?? animations[0]

  if (!clip) return null

  const node = findCamera(root, MAIN_CAM)

  if (!node) return null

  const end = poseAt(root, clip, clip.duration)

  const mixer = new AnimationMixer(root)

  const action = mixer.clipAction(clip)

  action.setLoop(LoopOnce, 1)

  action.clampWhenFinished = true

  return { mixer, action, duration: clip.duration, node, end }
}

/** 애니메이션 카메라의 월드 자세를 화면 카메라에 복사하고, 궤도 타깃은 시선이 바닥과 만나는 점으로 둔다 */
function applyAnimated(node: PerspectiveCamera, camera: PerspectiveCamera, target: Vector3) {
  node.getWorldPosition(scratchPos)

  node.getWorldQuaternion(scratchQuat)

  camera.position.copy(scratchPos)

  camera.quaternion.copy(scratchQuat)

  if (node.fov !== camera.fov) {
    camera.fov = node.fov

    camera.updateProjectionMatrix()
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
  return a.view === b.view && a.robotId === b.robotId && a.scannerId === b.scannerId && a.angle === b.angle
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

/** 따라가는 장비가 움직인 만큼 카메라 · 비행 경로를 같이 옮긴다 */
function applyFollow(chase: Chase, scene: Object3D, camera: PerspectiveCamera, orbit: { target: Vector3; update: () => void }, flight: Flight | null) {
  const object = chase.id ? scene.getObjectByName(chase.id) : null

  if (!object) return

  object.getWorldPosition(chase.world)

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
    (goal: CameraPose, duration = DURATION) => {
      if (intro.current === 'play') finishIntro()

      const { camera } = get()

      const orbit = controls.current

      if (!(camera instanceof PerspectiveCamera) || !orbit) return

      flight.current = {
        from: { position: camera.position.clone(), target: orbit.target.clone(), fov: camera.fov },
        to: goal,
        elapsed: 0,
        duration,
      }
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

        applyAnimated(clip.node, camera, orbit.target)

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

    if (!sameView(seenView.current, state)) {
      seenView.current = state

      stopChase(chase, flight, false)
    }

    const goal = goalPose(state, poses.main, poses.robot, scene)

    if (!goal) return

    fly(goal)
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

        fly(focusPose(object, camera.position, orbit.target))

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
        fly(focusPose(object, camera.position, orbit.target))

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

      applyAnimated(playing.node, camera, orbit.target)

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

    placeCamera(camera, point.lerpVectors(active.from.position, active.to.position, k), active.from.fov + ((active.to.fov ?? active.from.fov) - active.from.fov) * k)

    orbit.target.lerpVectors(active.from.target, active.to.target, k)

    orbit.update()

    if (active.elapsed >= active.duration) flight.current = null
  })

  return <OrbitControls ref={controls} makeDefault enableDamping={false} />
}
