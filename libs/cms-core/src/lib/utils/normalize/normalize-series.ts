import type { Series } from '../../models/series.model';
import { normalizeTimestamp } from './normalize-timestamp';

export function normalizeSeries(raw: Record<string, unknown>): Series {
  return {
    id: (raw['id'] as string) ?? '',
    slug: (raw['slug'] as string) ?? '',
    name: (raw['name'] as string) ?? '',
    title: raw['title'] as string | undefined,
    description: raw['description'] as string | undefined,
    tenantId: raw['tenantId'] as string | undefined,
    postCount: typeof raw['postCount'] === 'number' ? raw['postCount'] : 0,
    isActive: raw['isActive'] === true,
    createdAt: normalizeTimestamp(raw['createdAt']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}
