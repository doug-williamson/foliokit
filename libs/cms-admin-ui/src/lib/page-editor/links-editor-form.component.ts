import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  RhombusButtonComponent,
  RhombusInputComponent,
  RhombusSelectComponent,
  RhombusSwitchComponent,
  RhombusTextareaComponent,
  RhombusTooltipDirective,
  type SelectOption,
} from '@rhombuskit/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import type { LinksLink, SocialPlatform } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

const PLATFORM_OPTIONS: SocialPlatform[] = [
  'twitter',
  'instagram',
  'github',
  'linkedin',
  'youtube',
  'tiktok',
  'facebook',
  'email',
  'website',
];

interface LinkRowValue {
  id: string;
  label: string;
  url: string;
  platform: string;
  highlighted: boolean;
}

@Component({
  selector: 'admin-links-editor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    RhombusButtonComponent,
    RhombusInputComponent,
    RhombusSelectComponent,
    RhombusSwitchComponent,
    RhombusTextareaComponent,
    RhombusTooltipDirective,
    DragDropModule,
  ],
  styles: [
    `
      :host {
        display: block;
      }
      .drag-handle {
        cursor: grab;
        touch-action: none;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .cdk-drag-preview {
        box-shadow: var(--shadow-md);
        border-radius: 8px;
        opacity: 0.95;
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
    @if (store.config()) {
      <div class="flex flex-col gap-6">
        <rhombus-input
          label="Title"
          placeholder="Links"
          [control]="asFc(linksForm.get('title'))"
        />

        <rhombus-input
          label="Headline"
          placeholder="Your name or tagline"
          [control]="asFc(linksForm.get('headline'))"
        />

        <rhombus-textarea
          label="Bio"
          placeholder="Short bio shown below your headline"
          [rows]="4"
          [control]="asFc(linksForm.get('bio'))"
        />

        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Links</span>
            <rhombus-button
              appearance="outlined"
              variant="secondary"
              (click)="addLink()"
            >
              <mat-icon svgIcon="add" />
              Add Link
            </rhombus-button>
          </div>

          <div
            cdkDropList
            (cdkDropListDropped)="onDrop($event)"
            class="flex flex-col gap-2"
          >
            @for (group of linksArray.controls; track linkId(group)) {
              <div
                cdkDrag
                class="flex flex-col gap-3 p-3 rounded-lg"
                style="background: color-mix(in srgb, currentColor 5%, transparent); border: 1px solid color-mix(in srgb, currentColor 10%, transparent)"
              >
                <div class="flex items-center gap-2">
                  <mat-icon
                    cdkDragHandle
                    class="drag-handle opacity-40 shrink-0"
                    style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem"
                    svgIcon="drag_indicator"
                  />
                  <span class="flex-1 text-sm font-medium truncate">{{
                    asFc(group.get('label')).value || '(untitled)'
                  }}</span>
                  <rhombus-switch
                    class="shrink-0"
                    rhombusTooltip="Highlighted"
                    [control]="asFc(group.get('highlighted'))"
                  />
                  <button
                    mat-icon-button
                    (click)="removeLink($index)"
                    rhombusTooltip="Delete link"
                  >
                    <mat-icon svgIcon="delete" />
                  </button>
                </div>

                <div class="flex gap-3">
                  <rhombus-input
                    class="flex-1"
                    label="Label"
                    placeholder="My Website"
                    [control]="asFc(group.get('label'))"
                  />
                  <rhombus-input
                    class="flex-1"
                    label="URL"
                    type="url"
                    placeholder="https://example.com"
                    [control]="asFc(group.get('url'))"
                  />
                </div>

                <rhombus-select
                  label="Platform"
                  [options]="platformOptions"
                  [control]="asFc(group.get('platform'))"
                />
              </div>
            }

            @if (!linksArray.length) {
              <div
                class="flex items-center justify-center py-8 opacity-40 text-sm"
              >
                No links yet. Add one above.
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class LinksEditorFormComponent {
  readonly store = inject(SiteConfigEditorStore);
  private readonly fb = inject(FormBuilder);

  protected readonly platformOptions: SelectOption[] = [
    { value: '', label: '— none —' },
    ...PLATFORM_OPTIONS.map((p) => ({
      value: p as string,
      label: p as string,
    })),
  ];

  protected readonly linksForm = this.fb.group({
    title: this.fb.control('', { nonNullable: true }),
    headline: this.fb.control('', { nonNullable: true }),
    bio: this.fb.control('', { nonNullable: true }),
    links: this.fb.array<FormGroup>([]),
  });

  get linksArray(): FormArray {
    return this.linksForm.get('links') as FormArray;
  }

  /** Narrow an `AbstractControl` to `FormControl` for RhombusKit's `[control]` input. */
  protected asFc(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  /** Stable @for trackBy: a row's identity is its persisted link id. */
  protected linkId(control: AbstractControl): string {
    return (control as FormGroup).get('id')!.value as string;
  }

  constructor() {
    // Store → form. The parent (links-page-editor) owns load + discard, so the
    // form must re-hydrate whenever `store.config()` changes, not just once.
    // A per-field value-diff (and id-keyed structural reconcile) propagates
    // external resets into the form while leaving in-progress edits untouched —
    // the setValue(emitEvent:false) never re-fires the form→store path below.
    effect(() => {
      const cfg = this.store.config()?.pages?.links;
      this.syncControl(
        this.asFc(this.linksForm.get('title')),
        cfg?.title ?? '',
      );
      this.syncControl(
        this.asFc(this.linksForm.get('headline')),
        cfg?.headline ?? '',
      );
      this.syncControl(this.asFc(this.linksForm.get('bio')), cfg?.bio ?? '');
      this.reconcileLinksArray(cfg?.links ?? []);
    });

    // Form → store. Structural ops (add/remove/drag) mutate the form with
    // emitEvent:false and call flush() explicitly, so this only fires on real
    // field edits.
    this.linksForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.flush());
  }

  addLink(): void {
    this.linksArray.push(
      this.makeLinkGroup({
        id: crypto.randomUUID(),
        label: '',
        url: '',
        order: this.linksArray.length,
      }),
      { emitEvent: false },
    );
    this.flush();
  }

  removeLink(index: number): void {
    this.linksArray.removeAt(index, { emitEvent: false });
    this.flush();
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const control = this.linksArray.at(event.previousIndex);
    this.linksArray.removeAt(event.previousIndex, { emitEvent: false });
    this.linksArray.insert(event.currentIndex, control, { emitEvent: false });
    this.flush();
  }

  /** Build a row FormGroup; `order` is recomputed from index on flush. */
  private makeLinkGroup(link: LinksLink): FormGroup {
    return this.fb.group({
      id: this.fb.control(link.id, { nonNullable: true }),
      label: this.fb.control(link.label ?? '', { nonNullable: true }),
      url: this.fb.control(link.url ?? '', { nonNullable: true }),
      platform: this.fb.control<string>(link.platform ?? '', {
        nonNullable: true,
      }),
      highlighted: this.fb.control(!!link.highlighted, { nonNullable: true }),
    });
  }

  /** Patch a control from the store without re-emitting to the store. */
  private syncControl<T>(control: FormControl<T>, want: T): void {
    if (control.value !== want) control.setValue(want, { emitEvent: false });
  }

  /**
   * Reconcile the links FormArray with the store's array. Rebuilds (reusing
   * existing row groups by id) only when the id sequence differs — i.e. on
   * load, discard, or an external reorder — then value-diffs each row's fields.
   */
  private reconcileLinksArray(storeLinks: LinksLink[]): void {
    const arr = this.linksArray;
    const existing = new Map<string, FormGroup>();
    for (const control of arr.controls) {
      const group = control as FormGroup;
      existing.set(group.get('id')!.value as string, group);
    }

    const sameStructure =
      storeLinks.length === arr.length &&
      storeLinks.every(
        (l, i) => (arr.at(i) as FormGroup).get('id')!.value === l.id,
      );

    if (!sameStructure) {
      arr.clear({ emitEvent: false });
      for (const link of storeLinks) {
        const group = existing.get(link.id) ?? this.makeLinkGroup(link);
        arr.push(group, { emitEvent: false });
      }
    }

    storeLinks.forEach((link, i) => {
      const group = arr.at(i) as FormGroup;
      this.syncControl(this.asFc(group.get('label')), link.label ?? '');
      this.syncControl(this.asFc(group.get('url')), link.url ?? '');
      this.syncControl(this.asFc(group.get('platform')), link.platform ?? '');
      this.syncControl(this.asFc(group.get('highlighted')), !!link.highlighted);
    });
  }

  /** Write the whole links config back, preserving untouched fields (seo, icon, avatar*). */
  private flush(): void {
    const current = this.store.config()?.pages?.links;
    if (!current) return;
    const v = this.linksForm.getRawValue();
    const rows = v.links as unknown as LinkRowValue[];
    const originalById = new Map(
      (current.links ?? []).map((l) => [l.id, l] as const),
    );
    const links: LinksLink[] = rows.map((row, i) => ({
      ...(originalById.get(row.id) ?? {}),
      id: row.id,
      label: row.label ?? '',
      url: row.url ?? '',
      platform: row.platform ? (row.platform as SocialPlatform) : undefined,
      highlighted: row.highlighted || undefined,
      order: i,
    }));
    this.store.updateLinks({
      ...current,
      title: v.title || undefined,
      headline: v.headline || undefined,
      bio: v.bio || undefined,
      links,
    });
  }
}
