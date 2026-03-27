import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import type { LinksPageConfig } from '@foliokit/cms-core';
import { LINKS_CONFIG } from '../data/seed-config';

export const linksResolver: ResolveFn<LinksPageConfig> = () => of(LINKS_CONFIG);
