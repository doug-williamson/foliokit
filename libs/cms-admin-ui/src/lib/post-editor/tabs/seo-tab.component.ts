import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PostEditorStore } from '../post-editor.store';
import {
  SeoFieldsComponent,
  type SeoFieldsFormGroup,
} from '../../components/seo-fields/seo-fields.component';

@Component({
  selector: 'folio-seo-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SeoFieldsComponent],
  styles: [
    `
      :host {
        display: block;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    @if (store.post()) {
      <div class="p-4">
        <folio-seo-fields [group]="seoGroup" />
      </div>
    }
  `,
})
export class SeoTabComponent {
  readonly store = inject(PostEditorStore);

  readonly seoGroup: SeoFieldsFormGroup = new FormGroup({
    metaTitle: new FormControl<string | null>(null),
    metaDescription: new FormControl<string | null>(null),
    ogImageUrl: new FormControl<string | null>(null),
    canonicalUrl: new FormControl<string | null>(null),
  });

  private lastHydratedSeoKey: string | null = null;

  constructor() {
    effect(() => {
      const mode = this.store.mode();
      const post = this.store.post();
      const key = post
        ? `${mode}:${post.id}:${post.updatedAt}`
        : `${mode}:nopost`;
      if (this.lastHydratedSeoKey === key) return;
      this.lastHydratedSeoKey = key;
      if (!post) return;
      this.seoGroup.patchValue(
        {
          metaTitle: post.seo.title ?? null,
          metaDescription: post.seo.description ?? null,
          ogImageUrl: post.seo.ogImage ?? null,
          canonicalUrl: post.seo.canonicalUrl ?? null,
        },
        { emitEvent: false },
      );
    });

    this.seoGroup.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const post = this.store.post();
      if (!post) return;
      const v = this.seoGroup.getRawValue();
      this.store.updateField('seo', {
        ...post.seo,
        title: v.metaTitle ?? '',
        description: v.metaDescription ?? '',
        ogImage: v.ogImageUrl ?? '',
        canonicalUrl: v.canonicalUrl ?? '',
      });
    });
  }
}
