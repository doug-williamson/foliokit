import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { RhombusButtonComponent, RhombusSwitchComponent } from '@rhombuskit/core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

/**
 * Shared Publish (blog) enablement UI for the Configuration hub card and
 * `/pages/blog` editor — single source for the toggle and “Open posts”.
 */
@Component({
  selector: 'folio-blog-publish-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusButtonComponent, RhombusSwitchComponent],
  template: `
    <div class="flex flex-col gap-3">
    @if (layout() === 'hub') {
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-base font-semibold m-0">Blog</h2>
          <p class="text-sm opacity-70 m-0 mt-1">
            Your posts feed — enables Posts, Authors, and Series in the admin sidebar.
          </p>
        </div>
        <rhombus-switch
          [checked]="blogPageEnabled()"
          (checkedChange)="store.togglePageEnabled('blog', $event)"
          aria-label="Enable Blog on the public site"
        />
      </div>
    } @else {
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm opacity-70 m-0 flex-1 min-w-0">
          Turns on Posts, Authors, and Series in the admin sidebar. Use the toggle to enable or disable the whole publish section.
        </p>
        <rhombus-switch
          class="shrink-0"
          [checked]="blogPageEnabled()"
          (checkedChange)="store.togglePageEnabled('blog', $event)"
          aria-label="Enable Blog on the public site"
        />
      </div>
    }
    <div class="flex flex-wrap gap-2">
      @if (layout() === 'hub') {
        <rhombus-button appearance="filled" variant="secondary" type="button" (click)="router.navigate(['/pages/blog'])">
          Blog settings
        </rhombus-button>
      }
      <rhombus-button appearance="filled" variant="secondary" type="button" (click)="router.navigate(['/posts'])">Open posts</rhombus-button>
    </div>
    </div>
  `,
})
export class BlogPublishSettingsComponent {
  readonly store = inject(SiteConfigEditorStore);
  protected readonly router = inject(Router);

  /** `hub` = card on Configuration; `page` = full `/pages/blog` body. */
  readonly layout = input<'hub' | 'page'>('hub');

  protected readonly blogPageEnabled = computed(() =>
    this.store.config()?.pages?.blog?.enabled === true,
  );
}
