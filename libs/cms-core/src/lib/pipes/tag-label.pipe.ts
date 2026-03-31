import { Pipe, PipeTransform } from '@angular/core';
import type { Tag } from '../models/tag.model';

/**
 * Display label when the tag document is not loaded yet — avoids flashing raw Firestore ids.
 * Matches the fallback used by {@link TagLabelPipe}.
 */
export function tagIdFallbackLabel(tagId: string): string {
  return tagId
    .replace(/^tag-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

@Pipe({ name: 'tagLabel', standalone: true, pure: true })
export class TagLabelPipe implements PipeTransform {
  transform(tagId: string, lookup?: Map<string, Tag>): string {
    return lookup?.get(tagId)?.label ?? tagIdFallbackLabel(tagId);
  }
}
