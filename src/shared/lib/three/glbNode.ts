import { PropertyBinding, type Object3D } from 'three'

/**
 * glTF 이름으로 노드 찾기. GLTFLoader 는 이름을 정리하므로("rail.001" -> "rail001")
 * 원래 이름(userData.name)까지 함께 비교한다.
 */
export function findGlbNode(root: Object3D, name: string, rootChildrenOnly = false) {
  const clean = PropertyBinding.sanitizeNodeName(name)

  const hit = (object: Object3D) =>
    object.userData.name === name || object.name === name || object.name === clean

  if (rootChildrenOnly) return root.children.find(hit)

  let found: Object3D | undefined

  root.traverse((object) => {
    if (!found && hit(object)) found = object
  })

  return found
}

/** 복제한 서브트리에서 KHR_lights_punctual 조명 제거 (조명은 FactoryLighting 이 담당) */
export function stripLights(root: Object3D) {
  const lights: Object3D[] = []

  root.traverse((object) => {
    if ((object as Object3D & { isLight?: boolean }).isLight) lights.push(object)
  })

  lights.forEach((light) => light.removeFromParent())

  return root
}
