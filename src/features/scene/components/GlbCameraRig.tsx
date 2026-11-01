import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { PerspectiveCamera, Vector3, type Object3D } from 'three'

import { FACTORY_GLB_URL } from '@/features/template'
import { useMonitorState } from '@/shared/hooks/useMonitorView'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { cameraBus, type CameraCommand } from '@/shared/stores/cameraBus'
import { DEFAULT_ROBOT_ID, monitorView, type MonitorViewState } from '@/shared/stores/monitorView'
import { uiStore } from '@/shared/stores/uiStore'

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
 * 목표 시점으로 위치 + OrbitControls 타깃 + fov 를 부드럽게 보간. Esc 는 메인으로.
 */
export default function GlbCameraRig() {
  const { scene: glb } = useGLTF(FACTORY_GLB_URL)

  const get = useThree((state) => state.get)

  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)

  const flight = useRef<Flight | null>(null)

  const placed = useRef(false)

  const state = useMonitorState()

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

    const goal = goalPose(state, poses.main, poses.robot, scene)

    if (!goal) return

    fly(goal)
  }, [get, poses, state, fly])

  useEffect(() => {
    const onCommand = (command: CameraCommand) => {
      const { camera, scene } = get()

      const orbit = controls.current

      if (!orbit) return

      if (command.kind === 'zoom') {
        fly(zoomPose(camera.position, orbit.target, command.factor), ZOOM_DURATION)

        return
      }

      if (command.kind === 'home') {
        if (poses.main) fly(poses.main)

        return
      }

      const id = command.kind === 'focus' ? command.id : uiStore.get().selectedId

      const object = id ? scene.getObjectByName(id) : null

      if (object) {
        fly(focusPose(object, camera.position, orbit.target))

        return
      }

      const goal = goalPose(monitorView.get(), poses.main, poses.robot, scene)

      if (goal) fly(goal)
    }

    return cameraBus.on(onCommand)
  }, [get, poses, fly])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (event.target instanceof HTMLInputElement) return

      if (uiStore.get().selectedId) uiStore.select(null)
      else monitorView.set('main')
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const point = useMemo(() => new Vector3(), [])

  useFrame(({ camera }, delta) => {
    const active = flight.current

    const orbit = controls.current

    if (!active || !orbit || !(camera instanceof PerspectiveCamera)) return

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
