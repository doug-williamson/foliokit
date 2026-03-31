import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SiteConfigService } from '@foliokit/cms-core';

/**
 * Redirects to /setup if the site has not completed initial setup.
 * Applied to the main shell routes so the user must finish onboarding first.
 */
export const setupGuard: CanActivateFn = async () => {
  const siteConfigService = inject(SiteConfigService);
  const router = inject(Router);

  const config = await firstValueFrom(siteConfigService.getDefaultSiteConfig());
  if (config && config.setupComplete) return true;

  return router.createUrlTree(['/setup']);
};

/**
 * Redirects away from /setup if setup is already complete.
 * Prevents users from seeing the wizard after finishing onboarding.
 */
export const setupCompleteGuard: CanActivateFn = async () => {
  const siteConfigService = inject(SiteConfigService);
  const router = inject(Router);

  const config = await firstValueFrom(siteConfigService.getDefaultSiteConfig());
  if (config && config.setupComplete) {
    return router.createUrlTree(['/posts']);
  }
  return true;
};
