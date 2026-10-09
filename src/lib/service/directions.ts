import type {
	OrdinalDirection,
	HorizontalCardinalDirection,
	VerticalCardinalDirection
} from 'advanced-cropper';

export function handlerDirections(position: OrdinalDirection): {
	horizontal: HorizontalCardinalDirection | null;
	vertical: VerticalCardinalDirection | null;
} {
	let horizontal: HorizontalCardinalDirection | null = null;
	let vertical: VerticalCardinalDirection | null = null;
	if (position.startsWith('east')) {
		horizontal = 'east';
	}

	if (position.startsWith('west')) {
		horizontal = 'west';
	}

	if (position.toLowerCase().endsWith('north')) {
		vertical = 'north';
	}

	if (position.toLowerCase().endsWith('south')) {
		vertical = 'south';
	}

	return { horizontal, vertical };
}
