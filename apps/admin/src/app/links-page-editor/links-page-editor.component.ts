import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LinksEditorFormComponent } from '@foliokit/cms-admin-ui';
import { SiteConfigEditorStore } from '@foliokit/cms-admin-ui';

@Component({
  selector: 'admin-links-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, LinksEditorFormComponent],
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
      <!-- Toolbar -->
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="flex-1 text-xl font-semibold">Links Page</h1>

        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        }
      </div>

      <!-- Body -->
      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <admin-links-editor-form class="flex-1 min-h-0" />
      }

      <!-- Sticky footer -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-6 py-3 border-t shrink-0"
           style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)">
        @if (store.isDirty()) {
          <span class="text-sm opacity-60 sm:flex-1">You have unsaved changes.</span>
        } @else {
          <span class="hidden sm:block sm:flex-1"></span>
        }
        <div class="flex justify-end gap-2">
          <button mat-stroked-button [disabled]="!store.isDirty() || store.isSaving()" (click)="store.discard()">
            Cancel
          </button>
          <button mat-flat-button [disabled]="!store.isDirty() || store.isSaving()" (click)="store.save()">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LinksPageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);

  readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1024px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  ngOnInit(): void {
    this.store.load();
  }
}
