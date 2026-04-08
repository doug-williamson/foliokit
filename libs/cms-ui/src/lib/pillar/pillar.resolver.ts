import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { take } from 'rxjs/operators';
import { map } from 'rxjs';
import { PillarService } from '@foliokit/cms-core';
import type { Pillar } from '@foliokit/cms-core';

const PILLARS_ALL_KEY = makeStateKey<Pillar[]>('pillars-all');

export function createPillarsResolver(): ResolveFn<Pillar[]> {
  return () => {
    const transferState = inject(TransferState);
    const platformId = inject(PLATFORM_ID);

    if (transferState.hasKey(PILLARS_ALL_KEY)) {
      const pillars = transferState.get(PILLARS_ALL_KEY, []);
      transferState.remove(PILLARS_ALL_KEY);
      return pillars;
    }

    if (!isPlatformBrowser(platformId)) {
      return [];
    }

    return inject(PillarService).getAll().pipe(take(1));
  };
}

export function createPillarDetailResolver(): ResolveFn<Pillar | null> {
  return (route) => {
    const slug = route.paramMap.get('slug') ?? '';
    const transferState = inject(TransferState);
    const platformId = inject(PLATFORM_ID);
    const stateKey = makeStateKey<Pillar | null>(`pillar-detail:${slug}`);

    if (transferState.hasKey(stateKey)) {
      const pillar = transferState.get(stateKey, null);
      transferState.remove(stateKey);
      return pillar;
    }

    if (!isPlatformBrowser(platformId)) {
      return null;
    }

    return inject(PillarService).getAll().pipe(
      take(1),
      map((list) => list.find((p) => p.slug === slug) ?? null),
    );
  };
}
