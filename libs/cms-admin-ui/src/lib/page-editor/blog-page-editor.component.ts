import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { BlogPublishSettingsComponent } from './blog-publish-settings.component';

const PAGE_DESCRIPTION =
  'Configure the Publish section: enable posts, authors, and series in the admin, and open the posts list.';

@Component({
  selector: 'folio-blog-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, BlogPublishSettingsComponent],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">Publish</h1>
        @if (store.isSaving()) {
          <span class="admin-meta opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        }
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <folio-blog-publish-settings layout="page" />
          </div>
        </div>
      }
    </div>
  `,
})
export class BlogPageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    effect(() => {
      const c = this.store.config();
      if (!c) return;
      const site = c.siteName?.trim();
      const suffix = site && site.length > 0 ? site : 'Admin';
      this.title.setTitle(`Publish | ${suffix}`);
    });
  }

  ngOnInit(): void {
    this.store.load();
    this.title.setTitle('Publish');
    this.meta.updateTag({ name: 'description', content: PAGE_DESCRIPTION });
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
