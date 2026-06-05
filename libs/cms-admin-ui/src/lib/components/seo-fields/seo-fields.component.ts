import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RhombusInputComponent, RhombusTextareaComponent } from '@rhombuskit/core';
/**
 * Reactive group for the four `SeoFields` keys from `@foliokit/cms-core`.
 * Control values use `null` for empty; map to/from optional `string` on `SeoFields` when persisting.
 */
export type SeoFieldsFormGroup = FormGroup<{
  metaTitle: FormControl<string | null>;
  metaDescription: FormControl<string | null>;
  ogImageUrl: FormControl<string | null>;
  canonicalUrl: FormControl<string | null>;
}>;

@Component({
  selector: 'folio-seo-fields',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusInputComponent, RhombusTextareaComponent],
  template: `
    <div class="flex flex-col gap-4">
      <rhombus-input
        label="Meta Title"
        placeholder="Defaults to post title"
        [control]="group().controls.metaTitle"
      />

      <rhombus-textarea
        label="Meta Description"
        placeholder="Defaults to excerpt"
        [rows]="3"
        [control]="group().controls.metaDescription"
      />

      <rhombus-input
        label="OG Image URL"
        type="url"
        placeholder="https://example.com/og-image.png"
        [control]="group().controls.ogImageUrl"
      />

      <rhombus-input
        label="Canonical URL"
        type="url"
        placeholder="https://example.com/blog/my-post"
        [control]="group().controls.canonicalUrl"
      />
    </div>
  `,
})
export class SeoFieldsComponent {
  readonly group = input.required<SeoFieldsFormGroup>();
}
