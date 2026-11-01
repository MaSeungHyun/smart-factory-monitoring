import { EquirectangularReflectionMapping, type DataTexture } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

type OnLoad = Parameters<EXRLoader['load']>[1]

/**
 * three 의 EXRLoader + 등장방형(equirect) 매핑 적용.
 * drei <Environment files> 는 three-stdlib 의 구버전 EXRLoader 를 써서 factory_hdr.exr 헤더를 못 읽는다.
 */
export class EquirectEXRLoader extends EXRLoader {
  load(url: string, onLoad?: OnLoad, onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void) {
    return super.load(
      url,
      (texture: DataTexture, texData: object) => {
        texture.mapping = EquirectangularReflectionMapping

        onLoad?.(texture, texData)
      },
      onProgress,
      onError,
    )
  }
}