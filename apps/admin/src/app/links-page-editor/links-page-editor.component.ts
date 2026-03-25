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
import { MatTooltipModule } from '@angular/material/tooltip';
import { LinksEditorFormComponent, PageEditorStore } from '@foliokit/cms-admin-ui';

@Component({
  selector: 'admin-links-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, LinksEditorFormComponent],
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
        class="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <span class="flex-1 text-sm font-medium truncate opacity-80">
          {{ store.page()?.title || 'Links Page' }}
        </span>

        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        } @else if (!store.isDirty() && store.page()) {
          <span class="text-xs opacity-40">Saved</span>
        }

        @if (!isDesktop()) {
          <button mat-icon-button (click)="store.save()" [disabled]="store.isSaving()" matTooltip="Save">
            <mat-icon>save</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="store.toggleStatus()"
            [disabled]="!store.canPublish() || store.isSaving()"
            [matTooltip]="store.page()?.status === 'published' ? 'Unpublish' : 'Publish'"
          >
            <mat-icon>{{ store.page()?.status === 'published' ? 'unpublished' : 'publish' }}</mat-icon>
          </button>
        } @else {
          <button mat-stroked-button (click)="store.save()" [disabled]="store.isSaving()">
            Save
          </button>
          <button
            mat-flat-button
            (click)="store.toggleStatus()"
            [disabled]="!store.canPublish() || store.isSaving()"
          >
            {{ store.page()?.status === 'published' ? 'Unpublish' : 'Publish' }}
          </button>
        }
      </div>

      <!-- Body -->
      @if (!store.page()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <admin-links-editor-form class="flex-1 min-h-0" />
      }
    </div>
  `,
})
export class LinksPageEditorComponent implements OnInit {
  readonly store = inject(PageEditorStore);

  readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1024px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  ngOnInit(): void {
    this.store.loadPage('links');
  }
}
