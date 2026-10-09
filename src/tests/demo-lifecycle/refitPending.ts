// Plain bookkeeping for deferred imperative calls; no UI subscribes to this state.
export const pendingRefits: { completions: (() => void)[]; applied: number } = {
	completions: [],
	applied: 0
};
