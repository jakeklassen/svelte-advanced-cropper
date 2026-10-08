// Small rehype plugins for mdsvex. mdsvex 0.12 uses an older unified stack, so
// these walk the HAST tree by hand rather than pulling in visitor dependencies.

interface HastNode {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
	value?: string;
}

function walk(node: HastNode, visit: (node: HastNode) => void) {
	visit(node);
	for (const child of node.children ?? []) {
		walk(child, visit);
	}
}

function textOf(node: HastNode): string {
	if (node.type === 'text') {
		return node.value ?? '';
	}

	return (node.children ?? []).map(textOf).join('');
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-');
}

/** Prefixes root-relative links and images with the deploy base path (e.g. GitHub Pages). */
export function rehypeBasePath(base: string) {
	return () => (tree: HastNode) => {
		if (!base) {
			return;
		}

		walk(tree, (node) => {
			if (node.type !== 'element' || !node.properties) {
				return;
			}

			for (const attribute of ['href', 'src']) {
				const value = node.properties[attribute];
				if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
					node.properties[attribute] = base + value;
				}
			}
		});
	};
}

/**
 * Gives h2-h4 headings a unique id, for anchors (h2/h3 also feed the table of contents). Repeated
 * headings get GitHub-style suffixes: `implementation`, `implementation-1`, ...
 */
export function rehypeHeadingIds() {
	return (tree: HastNode) => {
		const seen = new Map<string, number>();
		walk(tree, (node) => {
			if (node.type === 'element' && ['h2', 'h3', 'h4'].includes(node.tagName ?? '')) {
				node.properties ??= {};
				if (node.properties.id) {
					return;
				}

				const slug = slugify(textOf(node));
				const count = seen.get(slug) ?? 0;
				seen.set(slug, count + 1);
				node.properties.id = count ? `${slug}-${count}` : slug;
			}
		});
	};
}
