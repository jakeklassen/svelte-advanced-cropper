/** A node in a component / hook hierarchy diagram. */
export interface HierarchyNode {
	title: string;
	kind: 'hook' | 'component' | 'replaceable';
	/** Docs path, e.g. `/docs/components/Cropper`. Omit when the item has no page. */
	to?: string;
	/** A short annotation, e.g. the prop that replaces this component. */
	note?: string;
	children?: HierarchyNode[];
}
