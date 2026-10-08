import { createContext } from 'svelte';

export interface TabsContext {
	register(label: string): void;
	readonly active: string | undefined;
}

export const [getTabsContext, setTabsContext] = createContext<TabsContext>();
