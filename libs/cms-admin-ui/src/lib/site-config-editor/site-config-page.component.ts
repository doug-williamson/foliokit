import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthorService, NavItem } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from './site-config-editor.store';

/**
 * Site configuration editor with General, Navigation (drag-drop), and SEO tabs.
 *
 * `SiteConfigEditorStore` must be provided at the route level (already wired
 * in `adminRoutes`). The component calls `store.load()` on init and keeps
 * three reactive forms in sync with the store via `valueChanges` subscriptions.
 */
@Component({
  selector: 'folio-site-config-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .mat-mdc-tab-body-content {
        height: 100%;
        overflow-y: auto;
      }
      .drag-handle {
        cursor: grab;
        touch-action: none;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }
      .cdk-drag-placeholder {
        opacity: 0.3;
      }
      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
           style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <h1 class="flex-1 text-xl font-semibold">Site Configuration</h1>
        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        }
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <!-- Tabs -->
        <mat-tab-group
          class="flex flex-col flex-1 overflow-hidden"
          animationDuration="0"
          (selectedTabChange)="onTabChange()"
        >
          <!-- ── General ── -->
          <mat-tab label="General">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <form [formGroup]="generalForm" class="flex flex-col gap-5">
                <mat-form-field appearance="outline">
                  <mat-label>Site Name</mat-label>
                  <input matInput formControlName="siteName" placeholder="My Blog" />
                  @if (generalForm.get('siteName')?.hasError('required') && generalForm.get('siteName')?.touched) {
                    <mat-error>Site name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Site URL</mat-label>
                  <input matInput formControlName="siteUrl" placeholder="https://example.com" />
                  @if (generalForm.get('siteUrl')?.hasError('required') && generalForm.get('siteUrl')?.touched) {
                    <mat-error>Site URL is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Default Author</mat-label>
                  <mat-select formControlName="defaultAuthorId">
                    <mat-option [value]="null">— None —</mat-option>
                    @for (author of authors(); track author.id) {
                      <mat-option [value]="author.id">{{ author.displayName }}</mat-option>
                    }
                  </mat-select>
                  @if (!authors().length) {
                    <mat-hint>
                      No authors yet.
                      <a routerLink="/authors/new" class="underline">Create one</a>
                    </mat-hint>
                  }
                </mat-form-field>
              </form>
            </div>
          </mat-tab>

          <!-- ── Navigation ── -->
          <mat-tab label="Navigation">
            <div class="flex flex-col gap-4 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold">Nav Items</span>
                <button mat-stroked-button type="button" (click)="addNavItem()">
                  <mat-icon>add</mat-icon>
                  Add Nav Item
                </button>
              </div>

              <div
                cdkDropList
                (cdkDropListDropped)="onNavDrop($event)"
                class="flex flex-col gap-2"
              >
                @for (ctrl of navItemsArray.controls; track $index) {
                  <div
                    cdkDrag
                    [formGroup]="asFormGroup(ctrl)"
                    class="flex flex-col gap-2 p-3 rounded-lg border"
                    style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)"
                  >
                    <!-- Row 1: drag handle + label + url -->
                    <div class="flex items-start gap-2">
                      <mat-icon cdkDragHandle class="drag-handle opacity-40 mt-3 shrink-0">drag_indicator</mat-icon>

                      <mat-form-field appearance="outline" class="flex-1 min-w-0">
                        <mat-label>Label</mat-label>
                        <input matInput formControlName="label" placeholder="Home" />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="flex-1 min-w-0">
                        <mat-label>URL / Route</mat-label>
                        <input matInput formControlName="url" placeholder="/home" />
                      </mat-form-field>
                    </div>

                    <!-- Row 2: icon + external toggle + delete -->
                    <div class="flex items-start gap-2 pl-8">
                      <mat-form-field appearance="outline" class="flex-1 min-w-0" style="max-width: 140px">
                        <mat-label>Icon</mat-label>
                        <input matInput formControlName="icon" placeholder="home" />
                      </mat-form-field>

                      <mat-slide-toggle
                        formControlName="external"
                        class="shrink-0 mt-3"
                        matTooltip="External link"
                      />

                      <button
                        mat-icon-button
                        type="button"
                        class="shrink-0 mt-1"
                        matTooltip="Remove"
                        (click)="removeNavItem($index)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }

                @if (!navItemsArray.length) {
                  <p class="text-sm opacity-50 text-center py-8">
                    No nav items yet. Add one to get started.
                  </p>
                }
              </div>
            </div>
          </mat-tab>

          <!-- ── SEO ── -->
          <mat-tab label="SEO">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <form [formGroup]="seoForm" class="flex flex-col gap-5">
                <mat-form-field appearance="outline">
                  <mat-label>Meta Title</mat-label>
                  <input matInput formControlName="title" placeholder="My Awesome Blog" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Meta Description</mat-label>
                  <textarea matInput formControlName="description" rows="3"
                            placeholder="A brief description of your site…"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>OG Image URL</mat-label>
                  <input matInput formControlName="ogImage" placeholder="https://…/og.jpg" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Canonical URL</mat-label>
                  <input matInput formControlName="canonicalUrl" placeholder="https://example.com" />
                </mat-form-field>
              </form>
            </div>
          </mat-tab>

        </mat-tab-group>

        <!-- Sticky footer: save / discard -->
        @if (store.isDirty()) {
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-6 py-3 border-t shrink-0"
               style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)">
            <span class="text-sm opacity-60 sm:flex-1">You have unsaved changes.</span>
            <div class="flex justify-end gap-2">
              <button mat-stroked-button [disabled]="store.isSaving()" (click)="onDiscard()">
                Discard
              </button>
              <button mat-flat-button [disabled]="hasInvalidForms() || store.isSaving()" (click)="onSave()">
                Save Changes
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class SiteConfigPageComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly authorService = inject(AuthorService);
  private readonly fb = inject(FormBuilder);

  protected readonly authors = toSignal(this.authorService.getAll(), { initialValue: [] });

  // ── Forms ──────────────────────────────────────────────────────────────────

  protected readonly generalForm: FormGroup = this.fb.group({
    siteName: ['', Validators.required],
    siteUrl: ['', Validators.required],
    defaultAuthorId: [null as string | null],
  });

  protected readonly navForm: FormGroup = this.fb.group({
    navItems: this.fb.array([]),
  });

  protected readonly seoForm: FormGroup = this.fb.group({
    title: [''],
    description: [''],
    ogImage: [''],
    canonicalUrl: [''],
  });

  get navItemsArray(): FormArray {
    return this.navForm.get('navItems') as FormArray;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.store.load();

    const pollInterval = setInterval(() => {
      const config = this.store.config();
      if (!config) return;
      clearInterval(pollInterval);
      this.populateForms(config);
      this.watchForms();
    }, 50);
  }

  // ── Tab change: flush current form to store ─────────────────────────────

  protected onTabChange(): void {
    this.flushFormsToStore();
  }

  // ── Nav drag-drop ──────────────────────────────────────────────────────────

  protected onNavDrop(event: CdkDragDrop<FormGroup[]>): void {
    const controls = this.navItemsArray.controls;
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    this.navItemsArray.setValue(controls.map((c) => c.value));
    this.flushNavToStore();
  }

  protected addNavItem(): void {
    this.navItemsArray.push(
      this.fb.group({ label: [''], url: [''], icon: [''], external: [false] }),
    );
  }

  protected removeNavItem(index: number): void {
    this.navItemsArray.removeAt(index);
    this.flushNavToStore();
  }

  // ── Save / discard ─────────────────────────────────────────────────────────

  protected hasInvalidForms(): boolean {
    return this.generalForm.invalid || this.seoForm.invalid;
  }

  protected onSave(): void {
    this.flushFormsToStore();
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    const config = this.store.config();
    if (config) this.populateForms(config);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  protected asFormGroup(ctrl: unknown): FormGroup {
    return ctrl as FormGroup;
  }

  private populateForms(config: ReturnType<typeof this.store.config>): void {
    if (!config) return;

    this.generalForm.patchValue({
      siteName: config.siteName ?? '',
      siteUrl: config.siteUrl ?? '',
      defaultAuthorId: config.defaultAuthorId ?? null,
    }, { emitEvent: false });

    this.navItemsArray.clear({ emitEvent: false });
    for (const item of config.nav ?? []) {
      this.navItemsArray.push(
        this.fb.group({
          label: [item.label ?? ''],
          url: [item.url ?? ''],
          icon: [item.icon ?? ''],
          external: [item.external ?? false],
        }),
        { emitEvent: false },
      );
    }

    this.seoForm.patchValue({
      title: config.defaultSeo?.title ?? '',
      description: config.defaultSeo?.description ?? '',
      ogImage: config.defaultSeo?.ogImage ?? '',
      canonicalUrl: config.defaultSeo?.canonicalUrl ?? '',
    }, { emitEvent: false });
  }

  private watchForms(): void {
    this.generalForm.valueChanges.subscribe((val) => {
      this.store.updateField('siteName', val.siteName ?? '');
      this.store.updateField('siteUrl', val.siteUrl ?? '');
      this.store.updateField('defaultAuthorId', val.defaultAuthorId ?? undefined);
    });

    this.navItemsArray.valueChanges.subscribe(() => this.flushNavToStore());

    this.seoForm.valueChanges.subscribe((val) => {
      this.store.updateField('defaultSeo', {
        title: val.title || undefined,
        description: val.description || undefined,
        ogImage: val.ogImage || undefined,
        canonicalUrl: val.canonicalUrl || undefined,
      });
    });
  }

  private flushNavToStore(): void {
    const items: NavItem[] = this.navItemsArray.value.map(
      (v: { label: string; url: string; icon: string; external: boolean }) => ({
        label: v.label,
        url: v.url,
        icon: v.icon || undefined,
        external: v.external || undefined,
      }),
    );
    this.store.updateNav(items);
  }

  private flushFormsToStore(): void {
    this.flushNavToStore();
  }
}
