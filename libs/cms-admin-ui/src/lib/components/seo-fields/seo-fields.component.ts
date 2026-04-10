import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div [formGroup]="group()" class="flex flex-col gap-4">
      <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Meta Title</mat-label>
        <input matInput formControlName="metaTitle" placeholder="Defaults to post title" />
      </mat-form-field>

      <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Meta Description</mat-label>
        <textarea matInput rows="3" formControlName="metaDescription" placeholder="Defaults to excerpt"></textarea>
      </mat-form-field>

      <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
        <mat-label>OG Image URL</mat-label>
        <input
          matInput
          type="url"
          formControlName="ogImageUrl"
          placeholder="https://example.com/og-image.png"
        />
      </mat-form-field>

      <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Canonical URL</mat-label>
        <input
          matInput
          type="url"
          formControlName="canonicalUrl"
          placeholder="https://example.com/blog/my-post"
        />
      </mat-form-field>
    </div>
  `,
})
export class SeoFieldsComponent {
  readonly group = input.required<SeoFieldsFormGroup>();
}
