import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import {
  AboutEditorFormComponent,
  LinksEditorFormComponent,
  PageEditorStore,
} from '@foliokit/cms-admin-ui';

@Component({
  selector: 'admin-page-editor-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    AboutEditorFormComponent,
    LinksEditorFormComponent,
  ],
  styles: [
    `
      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .mat-mdc-tab-body-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Toolbar -->
      <div
        class="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <span class="flex-1 text-sm font-medium truncate opacity-80">
          {{ store.page()?.title || (store.page()?.type === 'links' ? 'Links Page' : 'About Page') }}
        </span>

        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        } @else if (!store.isDirty() && store.page()) {
          <span class="text-xs opacity-40">Saved</span>
        }

        <mat-chip-set>
          <mat-chip
            [highlighted]="store.page()?.status === 'published'"
            (click)="store.toggleStatus()"
            class="cursor-pointer"
          >
            {{ store.page()?.status === 'published' ? 'Published' : 'Draft' }}
          </mat-chip>
        </mat-chip-set>

        <button mat-stroked-button (click)="store.save()" [disabled]="store.isSaving()">
          Save
        </button>
      </div>

      <!-- Editor area -->
      <mat-tab-group
        class="flex flex-col flex-1 overflow-hidden"
        animationDuration="0"
      >
        <!-- Content tab: renders the correct form based on resolved page type -->
        <mat-tab label="Content">
          @if (store.page()?.type === 'about') {
            <admin-about-editor-form />
          } @else if (store.page()?.type === 'links') {
            <admin-links-editor-form />
          } @else {
            <div class="p-4 opacity-40 text-sm">Loading…</div>
          }
        </mat-tab>

        <!-- SEO tab -->
        <mat-tab label="SEO">
          @if (store.page(); as page) {
            <div class="flex flex-col gap-4 p-4">
              <mat-form-field class="w-full">
                <mat-label>Slug</mat-label>
                <input
                  matInput
                  [value]="page.slug"
                  (input)="store.updateField('slug', $any($event.target).value)"
                  placeholder="about"
                />
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Meta Title</mat-label>
                <input
                  matInput
                  [value]="page.seo.title ?? ''"
                  (input)="store.updateField('seo', { ...page.seo, title: $any($event.target).value })"
                  placeholder="Defaults to page title"
                />
                <mat-hint>Recommended: 50–60 characters</mat-hint>
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Meta Description</mat-label>
                <textarea
                  matInput
                  rows="3"
                  [value]="page.seo.description ?? ''"
                  (input)="store.updateField('seo', { ...page.seo, description: $any($event.target).value })"
                ></textarea>
                <mat-hint>Recommended: 150–160 characters</mat-hint>
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>OG Image URL</mat-label>
                <input
                  matInput
                  type="url"
                  [value]="page.seo.ogImage ?? ''"
                  (input)="store.updateField('seo', { ...page.seo, ogImage: $any($event.target).value })"
                  placeholder="https://example.com/og-image.png"
                />
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Canonical URL</mat-label>
                <input
                  matInput
                  type="url"
                  [value]="page.seo.canonicalUrl ?? ''"
                  (input)="store.updateField('seo', { ...page.seo, canonicalUrl: $any($event.target).value })"
                  placeholder="https://example.com/about"
                />
              </mat-form-field>
            </div>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class PageEditorShellComponent implements OnInit {
  readonly store = inject(PageEditorStore);
  readonly id = input<string | undefined>(undefined);
  /** Received via query param when navigating to /pages/new?pageType=linktree */
  readonly pageType = input<string | undefined>(undefined);

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.store.loadPage(id);
    } else {
      const type = this.pageType() === 'links' ? 'links' : 'about';
      this.store.initNew(type);
    }
  }
}
