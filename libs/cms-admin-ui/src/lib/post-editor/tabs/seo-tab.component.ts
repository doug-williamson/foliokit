import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PostEditorStore } from '../post-editor.store';

@Component({
  selector: 'folio-seo-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule],
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

        <!-- OG Image Override -->
        <mat-form-field class="w-full">
          <mat-label>OG Image Override</mat-label>
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
          <mat-hint>Leave blank to use the post thumbnail.</mat-hint>
        </mat-form-field>

        <!-- Advanced SEO -->
        <mat-expansion-panel class="!shadow-none !rounded-lg border border-black/10 dark:border-white/10">
          <mat-expansion-panel-header>
            <mat-panel-title class="text-sm font-medium">Advanced SEO</mat-panel-title>
          </mat-expansion-panel-header>

          <mat-form-field class="w-full mt-2">
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
            <mat-hint>
              Leave blank — canonical is set automatically to
              &#123;siteUrl&#125;/posts/&#123;slug&#125;. Only set this if republishing
              content from another URL.
            </mat-hint>
          </mat-form-field>
        </mat-expansion-panel>
      </div>
    }
  `,
})
export class SeoTabComponent {
  readonly store = inject(PostEditorStore);
}
