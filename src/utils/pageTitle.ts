import { APP_NAME, PAGE_TITLE_PREFIX } from '@/constants/app'

/** Browser tab title: `NX HRMS | Dashboard` */
export function formatPageTitle(pageTitle: string): string {
  if (!pageTitle || pageTitle === APP_NAME) return PAGE_TITLE_PREFIX
  return `${PAGE_TITLE_PREFIX} | ${pageTitle}`
}
