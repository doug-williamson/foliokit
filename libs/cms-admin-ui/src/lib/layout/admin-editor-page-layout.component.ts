import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Shared chrome for admin editor pages (toolbar title + scrollable body).
 *
 * For save/discard UX, use `folio-save-bar` at the page root and MatSnackBar
 * for completion feedback — see `wireSiteConfigSaveSnackbarFeedback` in
 * `site-config-save-snackbar.util.ts` for site-config stores.
 */
@Component({
  selector: 'folio-admin-editor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
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
    <div class="flex flex-col h-full overflow-hidden relative">
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">{{ title() }}</h1>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center flex-1">
          <span class="text-sm opacity-50">Loading…</span>
        </div>
      } @else {
        <div class="flex-1 overflow-hidden min-h-0">
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class AdminEditorPageLayoutComponent {
  title = input.required<string>();
  loading = input<boolean>(false);
}
