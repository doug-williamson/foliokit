import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { CollectionPaths, FIREBASE_STORAGE } from '@foliokit/cms-core';
import type { LinksLink, LinksPageConfig } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

const PLATFORM_OPTIONS: LinksLink['platform'][] = [
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

@Component({
  selector: 'admin-links-editor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    DragDropModule,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
      .drag-handle {
        cursor: grab;
        touch-action: none;
      }
      .drag-handle:active { cursor: grabbing; }
      .cdk-drag-preview {
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        border-radius: 8px;
        opacity: 0.95;
      }
      .cdk-drag-placeholder { opacity: 0.3; }
      .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
      .drop-zone { border: 2px dashed color-mix(in srgb, currentColor 25%, transparent); border-radius: 8px; }
      .drop-zone.drag-over {
        border-color: var(--mat-sys-primary);
        background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      }
    `,
  ],
  template: `
    @if (linksConfig(); as cfg) {
      <div class="flex flex-col gap-6 p-4">
        <!-- Title -->
        <mat-form-field class="w-full">
          <mat-label>Title</mat-label>
          <input
            matInput
            [value]="cfg.title ?? ''"
            (input)="updateField('title', $any($event.target).value)"
            placeholder="Links"
          />
        </mat-form-field>

        <!-- Avatar upload (light + dark) -->
        <div class="flex flex-col gap-2">
          <span class="text-sm font-semibold">Avatar</span>
          <p class="text-xs opacity-50 -mt-1">Dark avatar is optional — shown when dark mode is active.</p>
          <div class="grid grid-cols-2 gap-6 justify-items-center items-start">
            <!-- Light mode -->
            <div class="flex flex-col items-center gap-1">
              @if (cfg.avatarUrl) {
                <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group">
                  <img [src]="cfg.avatarUrl" [alt]="cfg.avatarAlt || 'Avatar'" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                       style="background: rgba(0,0,0,0.5)">
                    <button mat-icon-button style="color:white" title="Replace" (click)="isBrowser && avatarInput.click()">
                      <mat-icon svgIcon="swap_horiz" />
                    </button>
                    <button mat-icon-button style="color:white" title="Remove" (click)="onDeleteAvatar(cfg)">
                      <mat-icon svgIcon="delete" />
                    </button>
                  </div>
                </div>
              } @else {
                <div
                  class="w-24 h-24 shrink-0 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed gap-1"
                  style="border-color: color-mix(in srgb, currentColor 25%, transparent)"
                  role="button"
                  tabindex="0"
                  (click)="isBrowser && avatarInput.click()"
                  (keydown.enter)="isBrowser && avatarInput.click()"
                >
                  <mat-icon class="opacity-40" svgIcon="upload" />
                  <span class="text-xs opacity-40">Upload</span>
                </div>
              }
              <span class="text-xs opacity-50 leading-none">Light</span>
            </div>
            <!-- Dark mode -->
            <div class="flex flex-col items-center gap-1">
              @if (cfg.avatarUrlDark) {
                <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group" style="background: #1a1a1a">
                  <img [src]="cfg.avatarUrlDark" [alt]="cfg.avatarAlt || 'Dark mode avatar'" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                       style="background: rgba(0,0,0,0.5)">
                    <button mat-icon-button style="color:white" title="Replace" (click)="isBrowser && avatarDarkInput.click()">
                      <mat-icon svgIcon="swap_horiz" />
                    </button>
                    <button mat-icon-button style="color:white" title="Remove" (click)="onDeleteAvatarDark(cfg)">
                      <mat-icon svgIcon="delete" />
                    </button>
                  </div>
                </div>
              } @else {
                <div
                  class="w-24 h-24 shrink-0 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed gap-1"
                  style="border-color: color-mix(in srgb, currentColor 25%, transparent)"
                  role="button"
                  tabindex="0"
                  (click)="isBrowser && avatarDarkInput.click()"
                  (keydown.enter)="isBrowser && avatarDarkInput.click()"
                >
                  <mat-icon class="opacity-40" svgIcon="upload" />
                  <span class="text-xs opacity-40">Upload</span>
                </div>
              }
              <span class="text-xs opacity-50 leading-none">Dark</span>
            </div>
          </div>
          <input #avatarInput type="file" accept="image/*" class="hidden"
                 (change)="onAvatarSelected($any($event.target).files)" />
          <input #avatarDarkInput type="file" accept="image/*" class="hidden"
                 (change)="onAvatarDarkSelected($any($event.target).files)" />
          @if (avatarUploading() || avatarDarkUploading()) {
            <mat-progress-bar mode="determinate" [value]="avatarUploading() ? avatarProgress() : avatarDarkProgress()" class="max-w-[13rem]" />
          }
          @if (avatarError()) {
            <p class="text-xs text-red-500">{{ avatarError() }}</p>
          }
          @if (avatarDarkError()) {
            <p class="text-xs text-red-500">{{ avatarDarkError() }}</p>
          }
        </div>

        <!-- Headline -->
        <mat-form-field class="w-full">
          <mat-label>Headline</mat-label>
          <input
            matInput
            [value]="cfg.headline ?? ''"
            (input)="updateField('headline', $any($event.target).value)"
            placeholder="Your name or tagline"
          />
        </mat-form-field>

        <!-- Bio -->
        <mat-form-field class="w-full">
          <mat-label>Bio</mat-label>
          <textarea
            matInput
            rows="3"
            [value]="cfg.bio ?? ''"
            (input)="updateField('bio', $any($event.target).value)"
            placeholder="Short bio shown below your headline"
          ></textarea>
        </mat-form-field>

        <!-- Link list -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Links</span>
            <button mat-stroked-button (click)="addLink(cfg.links ?? [])">
              <mat-icon svgIcon="add" />
              Add Link
            </button>
          </div>

          <div
            cdkDropList
            (cdkDropListDropped)="onDrop($event, cfg.links ?? [])"
            class="flex flex-col gap-2"
          >
            @for (link of cfg.links ?? []; track link.id) {
              <div
                cdkDrag
                class="flex flex-col gap-3 p-3 rounded-lg"
                style="background: color-mix(in srgb, currentColor 5%, transparent); border: 1px solid color-mix(in srgb, currentColor 10%, transparent)"
              >
                <!-- Drag handle row -->
                <div class="flex items-center gap-2">
                  <mat-icon cdkDragHandle class="drag-handle opacity-40 shrink-0" style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem" svgIcon="drag_indicator" />
                  <span class="flex-1 text-sm font-medium truncate">{{ link.label || '(untitled)' }}</span>
                  <mat-slide-toggle
                    [checked]="!!link.highlighted"
                    (change)="updateLink(cfg.links ?? [], link.id, 'highlighted', $event.checked)"
                    class="shrink-0"
                    matTooltip="Highlighted"
                  />
                  <button mat-icon-button (click)="deleteLink(cfg.links ?? [], link.id)" title="Delete link">
                    <mat-icon svgIcon="delete" />
                  </button>
                </div>

                <!-- Label + URL -->
                <div class="flex gap-3">
                  <mat-form-field class="flex-1">
                    <mat-label>Label</mat-label>
                    <input
                      matInput
                      [value]="link.label"
                      (input)="updateLink(cfg.links ?? [], link.id, 'label', $any($event.target).value)"
                      placeholder="My Website"
                    />
                  </mat-form-field>
                  <mat-form-field class="flex-1">
                    <mat-label>URL</mat-label>
                    <input
                      matInput
                      type="url"
                      [value]="link.url"
                      (input)="updateLink(cfg.links ?? [], link.id, 'url', $any($event.target).value)"
                      placeholder="https://example.com"
                    />
                  </mat-form-field>
                </div>

                <!-- Platform -->
                <mat-form-field class="w-full">
                  <mat-label>Platform</mat-label>
                  <mat-select
                    [value]="link.platform ?? null"
                    (selectionChange)="updateLink(cfg.links ?? [], link.id, 'platform', $event.value)"
                  >
                    <mat-option [value]="null">— none —</mat-option>
                    @for (p of platformOptions; track p) {
                      <mat-option [value]="p">{{ p }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }

            @if (!(cfg.links ?? []).length) {
              <div class="flex items-center justify-center py-8 opacity-40 text-sm">
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
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  @ViewChild('avatarDarkInput') avatarDarkInput!: ElementRef<HTMLInputElement>;

  readonly store = inject(SiteConfigEditorStore);
  private readonly storage = inject(FIREBASE_STORAGE)!;
  private readonly paths = inject(CollectionPaths);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly platformOptions = PLATFORM_OPTIONS;

  readonly linksConfig = () => this.store.config()?.pages?.links;

  readonly avatarUploading = signal(false);
  readonly avatarProgress = signal(0);
  readonly avatarError = signal<string | null>(null);
  private avatarStoragePath = signal<string | null>(null);

  readonly avatarDarkUploading = signal(false);
  readonly avatarDarkProgress = signal(0);
  readonly avatarDarkError = signal<string | null>(null);
  private avatarDarkStoragePath = signal<string | null>(null);

  private flush(partial: Partial<Omit<LinksPageConfig, 'enabled'>>): void {
    const current = this.store.config()?.pages?.links;
    if (!current) return;
    this.store.updateLinks({ ...current, ...partial });
  }

  updateField(field: keyof Omit<LinksPageConfig, 'enabled' | 'links'>, value: string | undefined): void {
    this.flush({ [field]: value || undefined });
  }

  onAvatarSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.uploadAvatar(files[0]);
    if (this.avatarInput?.nativeElement) {
      this.avatarInput.nativeElement.value = '';
    }
  }

  onDeleteAvatar(cfg: LinksPageConfig): void {
    if (!window.confirm('Remove avatar?')) return;
    const path = this.avatarStoragePath();
    const clear = () => {
      this.flush({ avatarUrl: undefined, avatarAlt: undefined });
      this.avatarStoragePath.set(null);
    };
    if (path) {
      deleteObject(ref(this.storage, path)).then(clear, clear);
    } else {
      clear();
    }
  }

  onAvatarDarkSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.uploadAvatarDark(files[0]);
    if (this.avatarDarkInput?.nativeElement) {
      this.avatarDarkInput.nativeElement.value = '';
    }
  }

  onDeleteAvatarDark(cfg: LinksPageConfig): void {
    if (!window.confirm('Remove dark mode avatar?')) return;
    const path = this.avatarDarkStoragePath();
    const clear = () => {
      this.flush({ avatarUrlDark: undefined });
      this.avatarDarkStoragePath.set(null);
    };
    if (path) {
      deleteObject(ref(this.storage, path)).then(clear, clear);
    } else {
      clear();
    }
  }

  addLink(links: LinksLink[]): void {
    const newLink: LinksLink = {
      id: crypto.randomUUID(),
      label: '',
      url: '',
      order: links.length,
    };
    this.flush({ links: [...links, newLink] });
  }

  deleteLink(links: LinksLink[], id: string): void {
    const updated = links
      .filter((l) => l.id !== id)
      .map((l, i) => ({ ...l, order: i }));
    this.flush({ links: updated });
  }

  updateLink<K extends keyof LinksLink>(
    links: LinksLink[],
    id: string,
    field: K,
    value: LinksLink[K],
  ): void {
    const updated = links.map((l) =>
      l.id === id ? { ...l, [field]: value } : l,
    );
    this.flush({ links: updated });
  }

  onDrop(event: CdkDragDrop<LinksLink[]>, links: LinksLink[]): void {
    const reordered = [...links];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    const withOrder = reordered.map((l, i) => ({ ...l, order: i }));
    this.flush({ links: withOrder });
  }

  private uploadAvatar(file: File): void {
    const previous = this.avatarStoragePath();
    const storagePath = this.paths.storagePath(`site-config/links/avatar/${file.name}`);

    if (previous) {
      deleteObject(ref(this.storage, previous)).catch(() => undefined);
    }

    const fileRef = ref(this.storage, storagePath);
    this.avatarUploading.set(true);
    this.avatarProgress.set(0);
    this.avatarError.set(null);

    const task = uploadBytesResumable(fileRef, file);
    task.on(
      'state_changed',
      (snapshot) => {
        this.avatarProgress.set(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        this.avatarUploading.set(false);
        this.avatarError.set(error.message);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          this.flush({ avatarUrl: downloadUrl, avatarAlt: file.name });
          this.avatarStoragePath.set(storagePath);
          this.avatarUploading.set(false);
        });
      },
    );
  }

  private uploadAvatarDark(file: File): void {
    const previous = this.avatarDarkStoragePath();
    const storagePath = this.paths.storagePath(`site-config/links/avatar-dark/${file.name}`);

    if (previous) {
      deleteObject(ref(this.storage, previous)).catch(() => undefined);
    }

    const fileRef = ref(this.storage, storagePath);
    this.avatarDarkUploading.set(true);
    this.avatarDarkProgress.set(0);
    this.avatarDarkError.set(null);

    const task = uploadBytesResumable(fileRef, file);
    task.on(
      'state_changed',
      (snapshot) => {
        this.avatarDarkProgress.set(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        this.avatarDarkUploading.set(false);
        this.avatarDarkError.set(error.message);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          this.flush({ avatarUrlDark: downloadUrl });
          this.avatarDarkStoragePath.set(storagePath);
          this.avatarDarkUploading.set(false);
        });
      },
    );
  }
}
