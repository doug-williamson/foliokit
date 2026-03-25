import { Pipe, PipeTransform } from '@angular/core';
import type { Tag } from '../models/tag.model';

function humanizeSlug(slug: string): string {
  return slug
    .replace(/^tag-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

@Pipe({ name: 'tagLabel', standalone: true, pure: true })
export class TagLabelPipe implements PipeTransform {
  transform(tagId: string, lookup?: Map<string, Tag>): string {
    return lookup?.get(tagId)?.label ?? humanizeSlug(tagId);
  }
}
