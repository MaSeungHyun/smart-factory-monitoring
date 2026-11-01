import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, Color, MeshBasicMaterial, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { useGraphics } from '@/shared/stores/useGraphicsStore'

import { BLOOM_LAYER } from '../constants/bloomLayer'

/** 블룸 패스에서 AMR 실루엣만 밝히기 위한 재질 */
const silhouette = new MeshBasicMaterial({ color: 0xffffff })

/** WebGL: 화면은 그대로 두고 AMR 실루엣의 빛만 더한다 */
export default function SceneBloom() {
  const enabled = useGraphics().amrBloom

  const gl = useThree((state) => state.gl)

  const scene = useThree((state) => state.scene)

  const camera = useThree((state) => state.camera)

  const size = useThree((state) => state.size)

  const webgl = gl instanceof WebGLRenderer ? gl : null

  const bloom = useMemo(() => {
    if (!webgl || !enabled) return null

    const composer = new EffectComposer(webgl)

    composer.renderToScreen = false

    composer.addPass(new RenderPass(scene, camera))

    const pass = new UnrealBloomPass(webgl.getSize(new Vector2()), 0.45, 0.65, 0)

    composer.addPass(pass)

    const glow = new MeshBasicMaterial({
      map: pass.renderTargetsHorizontal[0].texture,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    })

    return { composer, pass, quad: new FullScreenQuad(glow), glow }
  }, [webgl, scene, camera, enabled])

  useEffect(() => {
    return () => {
      bloom?.pass.dispose()

      bloom?.composer.dispose()

      bloom?.glow.dispose()

      bloom?.quad.dispose()
    }
  }, [bloom])

  useEffect(() => {
    if (!bloom || !webgl) return

    bloom.composer.setPixelRatio(webgl.getPixelRatio())

    bloom.composer.setSize(size.width, size.height)

    bloom.glow.map = bloom.pass.renderTargetsHorizontal[0].texture
  }, [bloom, webgl, size.width, size.height])

  useFrame(() => {
    if (!bloom || !webgl) return

    webgl.render(scene, camera)

    const mask = camera.layers.mask

    const background = scene.background

    const previousClear = new Color()

    webgl.getClearColor(previousClear)

    const previousAlpha = webgl.getClearAlpha()

    camera.layers.set(BLOOM_LAYER)

    scene.background = null

    scene.overrideMaterial = silhouette

    webgl.setClearColor(0x000000, 0)

    try {
      bloom.composer.render()
    } finally {
      camera.layers.mask = mask

      scene.background = background

      scene.overrideMaterial = null

      webgl.setClearColor(previousClear, previousAlpha)
    }

    const autoClear = webgl.autoClear

    webgl.autoClear = false

    webgl.setRenderTarget(null)

    bloom.quad.render(webgl)

    webgl.autoClear = autoClear
  }, bloom ? 1 : 0)

  return null
}
