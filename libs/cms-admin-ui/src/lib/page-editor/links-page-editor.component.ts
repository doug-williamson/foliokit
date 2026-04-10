import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LinksEditorFormComponent } from './links-editor-form.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';

/**
 * Links page editor — wraps `LinksEditorFormComponent` with a toolbar,
 * loading spinner, and `folio-save-bar` for save/discard.
 *
 * `SiteConfigEditorStore` must be provided at the route level (already
 * wired in `adminRoutes`). The component calls `store.load()` on init.
 */
@Component({
  selector: 'folio-links-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LinksEditorFormComponent,
    SaveBarComponent,
  ],
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
      <!-- Toolbar -->
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">Links Page</h1>
      </div>

      <!-- Body -->
      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <admin-links-editor-form />
          </div>
        </div>
      }

      <folio-save-bar
        [isDirty]="store.isDirty()"
        [isSaving]="store.isSaving()"
        (saved)="store.save()"
        (discarded)="onDiscard()"
      />
    </div>
  `,
})
export class LinksPageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store, this.snackBar);
  }

  protected onDiscard(): void {
    this.store.discard();
  }

  ngOnInit(): void {
    this.store.load();
  }
}
