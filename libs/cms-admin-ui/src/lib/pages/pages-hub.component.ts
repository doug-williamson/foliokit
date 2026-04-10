import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import { BlogPublishSettingsComponent } from '../page-editor/blog-publish-settings.component';

@Component({
  selector: 'cms-pages-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    BlogPublishSettingsComponent,
  ],
  template: `
    <div class="flex flex-col h-full min-h-0 overflow-y-auto">
      <header class="page-header flex items-center gap-3 px-4 sm:px-6 py-4 border-b shrink-0"
              style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <h1 class="page-heading flex-1">Configuration</h1>
      </header>

      @if (!store.config()) {
        <div class="flex flex-1 items-center justify-center p-8">
          <span class="text-sm opacity-50">Loading…</span>
        </div>
      } @else {
        <div class="flex flex-col gap-4 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
          <p class="text-sm opacity-60 m-0">
            Manage optional public pages and what appears under <strong>Pages</strong> and <strong>Publish</strong> in the admin sidebar.
          </p>

          <mat-card appearance="outlined" class="p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-base font-semibold m-0">Home (sidebar)</h2>
                <p class="text-sm opacity-70 m-0 mt-1">
                  Adds a <strong>Home</strong> item under Pages that opens the home hero editor.
                </p>
              </div>
              <mat-slide-toggle
                [checked]="navShortcutHome()"
                (change)="store.setAdminNavShortcut('home', $event.checked)"
                aria-label="Show Home in admin sidebar"
              />
            </div>
            <button
              mat-stroked-button
              type="button"
              class="self-start"
              (click)="router.navigate(['/pages/home'])"
            >
              Edit home hero
            </button>
          </mat-card>

          <mat-card appearance="outlined" class="p-4 flex flex-col gap-3">
            <folio-blog-publish-settings layout="hub" />
          </mat-card>

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
                aria-label="Enable About page on the public site"
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
                aria-label="Enable Links page on the public site"
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
  private readonly snackBar = inject(MatSnackBar);

  readonly aboutEnabled = computed(
    () => this.store.config()?.pages?.about?.enabled === true,
  );
  readonly linksEnabled = computed(
    () => this.store.config()?.pages?.links?.enabled === true,
  );

  readonly navShortcutHome = computed(
    () => this.store.config()?.adminNavShortcuts?.home === true,
  );

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store, this.snackBar);
  }

  ngOnInit(): void {
    this.store.load();
  }
}
