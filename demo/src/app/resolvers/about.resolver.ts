import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import type { AboutPageConfig } from '@foliokit/cms-core';
import { ABOUT_CONFIG } from '../data/seed-config';

export const aboutResolver: ResolveFn<AboutPageConfig> = () => of(ABOUT_CONFIG);
