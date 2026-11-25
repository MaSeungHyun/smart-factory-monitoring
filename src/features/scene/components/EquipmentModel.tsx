import type { SceneEquipment } from '@/shared/types'

import AmrModel from './models/AmrModel'
import ConveyorModel from './models/ConveyorModel'
import DockModel from './models/DockModel'
import PalletModel from './models/PalletModel'
import RackModel from './models/RackModel'
import RailModel from './models/RailModel'
import RobotModel from './models/RobotModel'
import ScannerModel from './models/ScannerModel'
import TransferModel from './models/TransferModel'

/** 장비 종류 -> 모델. floor 는 factory.glb 셸(Enviroment prop)이, door 는 factory.glb 의 wall_door 가 원래 위치에 그리므로 표시하지 않는다 */
export default function EquipmentModel({ entity }: { entity: SceneEquipment }) {
  switch (entity.kind) {
    case 'robot':
      return <RobotModel entity={entity} />

    case 'amr':
      return <AmrModel entity={entity} />

    case 'conveyor':
      return <ConveyorModel entity={entity} />

    case 'scanner':
      return <ScannerModel />

    case 'rack':
      return <RackModel entity={entity} />

    case 'pallet':
      return <PalletModel />

    case 'rail':
      return <RailModel />

    case 'transfer':
      return <TransferModel />

    case 'door':
      return null

    case 'dock':
      return <DockModel entity={entity} />

    case 'floor':
      return null
  }
}
