import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { PerspectiveCamera, Vector3, type Object3D } from 'three'

import { FACTORY_GLB_URL } from '@/features/template'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { cameraBus, type CameraCommand } from '@/shared/stores/cameraBus'
import { DEFAULT_ROBOT_ID, monitorView, useMonitorState, type MonitorViewState } from '@/shared/stores/useMonitorViewStore'
import { uiStore } from '@/shared/stores/useUiStore'

import { focusPose, zoomPose } from '../lib/focusPose'
import { glbCameraPose, type CameraPose } from '../lib/glbCameraPose'
import { robotCameraPose } from '../lib/robotCameraPose'
import { scanCameraPose } from '../lib/scanCameraPose'
import { warehouseCameraPose } from '../lib/warehouseCameraPose'

/** factory.glb 카메라 노드 (대소문자 무시) */
const MAIN_CAM = 'main_cam'

const ROBOT_CAM = 'robot_cam'

const DURATION = 1.4

const ZOOM_DURATION = 0.35

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)

interface Flight {
  from: CameraPose & { fov: number }
  to: CameraPose
  elapsed: number
  duration: number
}

function placeCamera(camera: PerspectiveCamera, position: Vector3, fov: number) {
  camera.position.copy(position)

  camera.fov = fov

  camera.updateProjectionMatrix()
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
 * 카메라: 시작은 항상 main_cam 위치/fov. 화면 상태가 바뀌면(레일 탭, 로봇 선택, 시점 버튼)
 * 목표 시점으로 위치 + OrbitControls 타깃 + fov 를 부드럽게 보간.
 * follow 는 장비 이동량만큼 카메라와 타깃을 같이 옮긴다. 팬 또는 Esc 로 해제. 그 외 Esc 는 메인으로.
 */
export default function GlbCameraRig() {
  const { scene: glb } = useGLTF(FACTORY_GLB_URL)

  const get = useThree((state) => state.get)

  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)

  const flight = useRef<Flight | null>(null)

  const placed = useRef(false)

  const chase = useMemo(createChase, [])

  const state = useMonitorState()

  const seenView = useRef(state)

  const fly = useCallback(
    (goal: CameraPose, duration = DURATION) => {
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
    [get],
  )

  const poses = useMemo(() => ({ main: glbCameraPose(glb, MAIN_CAM), robot: glbCameraPose(glb, ROBOT_CAM) }), [glb])

  useLayoutEffect(() => {
    const { camera, scene } = get()

    const orbit = controls.current

    if (!(camera instanceof PerspectiveCamera) || !orbit) return

    if (!placed.current && poses.main) {
      placed.current = true

      placeCamera(camera, poses.main.position, poses.main.fov ?? camera.fov)

      orbit.target.copy(poses.main.target)

      orbit.update()
    }

    if (seenView.current !== state) {
      seenView.current = state

      stopChase(chase, flight, false)
    }

    const goal = goalPose(state, poses.main, poses.robot, scene)

    if (!goal) return

    fly(goal)
  }, [get, poses, state, fly])

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
  }, [get, poses, fly])

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
  }, [])

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
  }, [get])

  useFrame(({ camera, scene }, delta) => {
    const orbit = controls.current

    if (!orbit || !(camera instanceof PerspectiveCamera)) return

    applyFollow(chase, scene, camera, orbit, flight.current)

    const active = flight.current

    if (!active) return

    active.elapsed = Math.min(active.elapsed + delta, active.duration)

    const k = ease(active.elapsed / active.duration)

    placeCamera(
      camera,
      point.lerpVectors(active.from.position, active.to.position, k),
      active.from.fov + ((active.to.fov ?? active.from.fov) - active.from.fov) * k,
    )

    orbit.target.lerpVectors(active.from.target, active.to.target, k)

    orbit.update()

    if (active.elapsed >= active.duration) flight.current = null
  })

  return <OrbitControls ref={controls} makeDefault enableDamping={false} />
}
