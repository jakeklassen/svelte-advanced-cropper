/** A node in a component / context / snippet hierarchy diagram. */
export interface HierarchyNode {
	title: string;
	kind: 'component' | 'context' | 'snippet';
	/** Docs path, e.g. `/docs/components/Cropper`. Omit when the item has no page. */
	to?: string;
	/** A short annotation, e.g. the snippet that renders this layer. */
	note?: string;
	children?: HierarchyNode[];
}
