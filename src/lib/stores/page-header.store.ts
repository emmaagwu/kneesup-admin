import { writable } from 'svelte/store';

interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
}

interface PageHeaderState {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  actions: PageHeaderAction[];
}

const defaults: PageHeaderState = {
  title: 'Dashboard',
  breadcrumbs: [],
  actions: []
};

export const pageHeader = writable<PageHeaderState>(defaults);

export function setPageHeader(state: Partial<PageHeaderState>) {
  pageHeader.set({ ...defaults, ...state });
}
