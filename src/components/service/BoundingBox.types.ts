import type { ClassValue } from 'svelte/elements'
import type {
  CardinalDirection,
  HorizontalCardinalDirection,
  MoveDirections,
  VerticalCardinalDirection,
} from 'advanced-cropper'

export interface HandlerProps {
  defaultClassName?: ClassValue
  hoverClassName?: ClassValue
  wrapperClassName?: ClassValue
  horizontalPosition?: HorizontalCardinalDirection | null
  verticalPosition?: VerticalCardinalDirection | null
  disabled?: boolean
  onMove?: (shift: MoveDirections, event: MouseEvent | TouchEvent) => void
  onMoveEnd?: () => void
}

export interface LineProps {
  defaultClassName?: ClassValue
  hoverClassName?: ClassValue
  wrapperClassName?: ClassValue
  position?: CardinalDirection
  disabled?: boolean
  onMove?: (shift: MoveDirections, event: MouseEvent | TouchEvent) => void
  onMoveEnd?: () => void
}
