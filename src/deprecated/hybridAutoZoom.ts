// Verbatim port from react-advanced-cropper's deprecated/hybridAutoZoom.ts.
// Pure function — no React deps to remove. Used only for the deprecated
// `autoZoom` prop on <Cropper>; emits a console warning at that call site
// and routes here.

import type { CoreSettings, CropperState, PostprocessAction, Size } from 'advanced-cropper'
import { copyState } from 'advanced-cropper/state'
import {
  applyMove,
  applyScale,
  coordinatesToPositionRestrictions,
  diff,
  fitToSizeRestrictions,
  getAreaPositionRestrictions,
  getAreaSizeRestrictions,
  getCenter,
  getPositionRestrictions,
  isInitializedState,
  mergePositionRestrictions,
  moveToPositionRestrictions,
  ratio,
} from 'advanced-cropper/service'

export function hybridStencilAutoZoomAlgorithm(
  state: CropperState,
  settings: CoreSettings,
): CropperState {
  if (!isInitializedState(state)) return state

  const result = copyState(state)

  const stencil: Size = { width: 0, height: 0 }
  if (ratio(result.boundary) > ratio(result.coordinates)) {
    stencil.height = result.boundary.height * 0.8
    stencil.width = stencil.height * ratio(result.coordinates)
  } else {
    stencil.width = result.boundary.width * 0.8
    stencil.height = stencil.width * ratio(result.coordinates)
  }

  result.visibleArea = applyScale(
    result.visibleArea,
    (result.coordinates.width * result.boundary.width) / (result.visibleArea.width * stencil.width),
  )

  const scale = fitToSizeRestrictions(result.visibleArea, getAreaSizeRestrictions(result, settings))
  result.visibleArea = applyScale(result.visibleArea, scale)

  if (scale !== 1) {
    stencil.height /= scale
    stencil.width /= scale
  }

  result.visibleArea = applyMove(
    result.visibleArea,
    diff(getCenter(result.coordinates), getCenter(result.visibleArea)),
  )

  result.visibleArea = moveToPositionRestrictions(
    result.visibleArea,
    getAreaPositionRestrictions(result, settings),
  )

  result.coordinates = moveToPositionRestrictions(
    result.coordinates,
    mergePositionRestrictions(
      coordinatesToPositionRestrictions(result.visibleArea),
      getPositionRestrictions(result, settings),
    ),
  )

  return result
}

export function hybridStencilAutoZoom(
  state: CropperState,
  settings: CoreSettings,
  action: PostprocessAction,
): CropperState {
  if (action.immediately) {
    return hybridStencilAutoZoomAlgorithm(state, settings)
  }
  return state
}
