import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

@Component({
  selector: 'cms-pages-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="flex flex-col h-full min-h-0 overflow-y-auto">
      <header class="page-header flex items-center gap-3 px-4 sm:px-6 py-4 border-b shrink-0"
              style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <h1 class="page-heading flex-1">Pages</h1>
        @if (store.isSaving()) {
          <span class="admin-meta opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        }
      </header>

      @if (!store.config()) {
        <div class="flex flex-1 items-center justify-center p-8">
          <span class="text-sm opacity-50">Loading…</span>
        </div>
      } @else {
        <div class="flex flex-col gap-4 max-w-lg mx-auto w-full px-4 sm:px-6 py-6">
          <mat-card appearance="outlined" class="p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-base font-semibold m-0">About</h2>
                <p class="text-sm opacity-70 m-0 mt-1">
                  Profile and bio page on your public site.
                </p>
              </div>
              <mat-slide-toggle
                [checked]="aboutEnabled()"
                (change)="store.togglePageEnabled('about', $event.checked)"
                aria-label="Enable About page"
              />
            </div>
            <button
              mat-stroked-button
              type="button"
              class="self-start"
              [disabled]="!aboutEnabled()"
              (click)="router.navigate(['/pages/about'])"
            >
              Edit About
            </button>
          </mat-card>

          <mat-card appearance="outlined" class="p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-base font-semibold m-0">Links</h2>
                <p class="text-sm opacity-70 m-0 mt-1">
                  Link-in-bio style page on your public site.
                </p>
              </div>
              <mat-slide-toggle
                [checked]="linksEnabled()"
                (change)="store.togglePageEnabled('links', $event.checked)"
                aria-label="Enable Links page"
              />
            </div>
            <button
              mat-stroked-button
              type="button"
              class="self-start"
              [disabled]="!linksEnabled()"
              (click)="router.navigate(['/pages/links'])"
            >
              Edit Links
            </button>
          </mat-card>
        </div>
      }
    </div>
  `,
})
export class PagesHubComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  protected readonly router = inject(Router);

  readonly aboutEnabled = computed(
    () => this.store.config()?.pages?.about?.enabled === true,
  );
  readonly linksEnabled = computed(
    () => this.store.config()?.pages?.links?.enabled === true,
  );

  ngOnInit(): void {
    this.store.load();
  }
}
