import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PostEditorStore } from '@foliokit/cms-admin-ui';

@Component({
  selector: 'folio-seo-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
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
    @if (store.post(); as post) {
      <div class="flex flex-col gap-4 p-4">
        <!-- Meta Title -->
        <mat-form-field class="w-full">
          <mat-label>Meta Title</mat-label>
          <input
            matInput
            [value]="post.seo.title ?? ''"
            (input)="
              store.updateField('seo', {
                ...post.seo,
                title: $any($event.target).value,
              })
            "
            placeholder="Defaults to post title"
          />
          <mat-hint>Recommended: 50–60 characters</mat-hint>
        </mat-form-field>

        <!-- Meta Description -->
        <mat-form-field class="w-full">
          <mat-label>Meta Description</mat-label>
          <textarea
            matInput
            rows="3"
            [value]="post.seo.description ?? ''"
            (input)="
              store.updateField('seo', {
                ...post.seo,
                description: $any($event.target).value,
              })
            "
            placeholder="Defaults to excerpt"
          ></textarea>
          <mat-hint>Recommended: 150–160 characters</mat-hint>
        </mat-form-field>

        <!-- OG Image URL -->
        <mat-form-field class="w-full">
          <mat-label>OG Image URL</mat-label>
          <input
            matInput
            type="url"
            [value]="post.seo.ogImage ?? ''"
            (input)="
              store.updateField('seo', {
                ...post.seo,
                ogImage: $any($event.target).value,
              })
            "
            placeholder="https://example.com/og-image.png"
          />
        </mat-form-field>

        <!-- Canonical URL -->
        <mat-form-field class="w-full">
          <mat-label>Canonical URL</mat-label>
          <input
            matInput
            type="url"
            [value]="post.seo.canonicalUrl ?? ''"
            (input)="
              store.updateField('seo', {
                ...post.seo,
                canonicalUrl: $any($event.target).value,
              })
            "
            placeholder="https://example.com/blog/my-post"
          />
          <mat-hint>Leave blank to use the default post URL</mat-hint>
        </mat-form-field>
      </div>
    }
  `,
})
export class SeoTabComponent {
  readonly store = inject(PostEditorStore);
}
