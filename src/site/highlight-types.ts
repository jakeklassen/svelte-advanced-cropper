export interface HighlightedCode {
	style: string;
	lines: { content: string; style: string; offset: number }[][];
}

export interface HighlightedSource {
	code: string;
	highlighted: HighlightedCode;
}
