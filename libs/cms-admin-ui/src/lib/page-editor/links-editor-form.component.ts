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
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { FIREBASE_STORAGE, PageService } from '@foliokit/cms-core';
import type { LinksLink } from '@foliokit/cms-core';
import { PageEditorStore } from './page-editor.store';

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
    @if (store.page(); as page) {
      @if (page.type === 'links') {
        <div class="flex flex-col gap-6 p-4">
          <!-- Title -->
          <mat-form-field class="w-full">
            <mat-label>Title</mat-label>
            <input
              matInput
              [value]="page.title"
              (input)="store.updateField('title', $any($event.target).value)"
              placeholder="Links"
            />
          </mat-form-field>

          <!-- Avatar upload -->
          <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold">Avatar</span>
            @if (avatarUploading()) {
              <mat-progress-bar mode="determinate" [value]="avatarProgress()" />
            }
            @if (avatarError()) {
              <p class="text-sm text-red-500">{{ avatarError() }}</p>
            }
            <div class="flex items-center gap-4">
              @if (page.avatarUrl) {
                <img
                  [src]="page.avatarUrl"
                  [alt]="page.avatarAlt || 'Avatar'"
                  class="w-16 h-16 rounded-full object-cover shrink-0"
                />
              } @else {
                <div class="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style="background: color-mix(in srgb, currentColor 10%, transparent)">
                  <mat-icon class="opacity-40">person</mat-icon>
                </div>
              }
              <button mat-stroked-button [disabled]="avatarUploading()" (click)="isBrowser && avatarInput.click()">
                {{ page.avatarUrl ? 'Replace' : 'Upload' }}
              </button>
              @if (page.avatarUrl) {
                <button mat-icon-button (click)="onDeleteAvatar()" title="Remove avatar">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>
            <input
              #avatarInput
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onAvatarSelected($any($event.target).files)"
            />
          </div>

          <!-- Headline -->
          <mat-form-field class="w-full">
            <mat-label>Headline</mat-label>
            <input
              matInput
              [value]="page.headline ?? ''"
              (input)="store.updateField('headline', $any($event.target).value)"
              placeholder="Your name or tagline"
            />
          </mat-form-field>

          <!-- Bio -->
          <mat-form-field class="w-full">
            <mat-label>Bio</mat-label>
            <textarea
              matInput
              rows="3"
              [value]="page.bio ?? ''"
              (input)="store.updateField('bio', $any($event.target).value)"
              placeholder="Short bio shown below your headline"
            ></textarea>
          </mat-form-field>

          <!-- Link list -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">Links</span>
              <button mat-stroked-button (click)="addLink(page.links)">
                <mat-icon>add</mat-icon>
                Add Link
              </button>
            </div>

            <div
              cdkDropList
              (cdkDropListDropped)="onDrop($event, page.links)"
              class="flex flex-col gap-2"
            >
              @for (link of page.links; track link.id) {
                <div
                  cdkDrag
                  class="flex flex-col gap-3 p-3 rounded-lg"
                  style="background: color-mix(in srgb, currentColor 5%, transparent); border: 1px solid color-mix(in srgb, currentColor 10%, transparent)"
                >
                  <!-- Drag handle row -->
                  <div class="flex items-center gap-2">
                    <mat-icon cdkDragHandle class="drag-handle opacity-40 shrink-0" style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem">
                      drag_indicator
                    </mat-icon>
                    <span class="flex-1 text-sm font-medium truncate">{{ link.label || '(untitled)' }}</span>
                    <mat-slide-toggle
                      [checked]="!!link.highlighted"
                      (change)="updateLink(page.links, link.id, 'highlighted', $event.checked)"
                      class="shrink-0"
                      matTooltip="Highlighted"
                    />
                    <button mat-icon-button (click)="deleteLink(page.links, link.id)" title="Delete link">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <!-- Label + URL -->
                  <div class="flex gap-3">
                    <mat-form-field class="flex-1">
                      <mat-label>Label</mat-label>
                      <input
                        matInput
                        [value]="link.label"
                        (input)="updateLink(page.links, link.id, 'label', $any($event.target).value)"
                        placeholder="My Website"
                      />
                    </mat-form-field>
                    <mat-form-field class="flex-1">
                      <mat-label>URL</mat-label>
                      <input
                        matInput
                        type="url"
                        [value]="link.url"
                        (input)="updateLink(page.links, link.id, 'url', $any($event.target).value)"
                        placeholder="https://example.com"
                      />
                    </mat-form-field>
                  </div>

                  <!-- Platform -->
                  <mat-form-field class="w-full">
                    <mat-label>Platform</mat-label>
                    <mat-select
                      [value]="link.platform ?? null"
                      (selectionChange)="updateLink(page.links, link.id, 'platform', $event.value)"
                    >
                      <mat-option [value]="null">— none —</mat-option>
                      @for (p of platformOptions; track p) {
                        <mat-option [value]="p">{{ p }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              }

              @if (!page.links.length) {
                <div class="flex items-center justify-center py-8 opacity-40 text-sm">
                  No links yet. Add one above.
                </div>
              }
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class LinksEditorFormComponent {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  readonly store = inject(PageEditorStore);
  private readonly storage = inject(FIREBASE_STORAGE)!;
  private readonly pageService = inject(PageService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly platformOptions = PLATFORM_OPTIONS;

  readonly avatarUploading = signal(false);
  readonly avatarProgress = signal(0);
  readonly avatarError = signal<string | null>(null);
  private avatarStoragePath = signal<string | null>(null);

  onAvatarSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.uploadAvatar(files[0]);
    if (this.avatarInput?.nativeElement) {
      this.avatarInput.nativeElement.value = '';
    }
  }

  onDeleteAvatar(): void {
    if (!window.confirm('Remove avatar?')) return;
    const path = this.avatarStoragePath();
    const clear = () => {
      this.store.updateField('avatarUrl', undefined);
      this.store.updateField('avatarAlt', undefined);
      this.avatarStoragePath.set(null);
    };
    if (path) {
      this.pageService.deleteStorageFile(path).subscribe({ next: clear, error: clear });
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
    this.store.updateField('links', [...links, newLink]);
  }

  deleteLink(links: LinksLink[], id: string): void {
    const updated = links
      .filter((l) => l.id !== id)
      .map((l, i) => ({ ...l, order: i }));
    this.store.updateField('links', updated);
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
    this.store.updateField('links', updated);
  }

  onDrop(event: CdkDragDrop<LinksLink[]>, links: LinksLink[]): void {
    const reordered = [...links];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    const withOrder = reordered.map((l, i) => ({ ...l, order: i }));
    this.store.updateField('links', withOrder);
  }

  private uploadAvatar(file: File): void {
    const previous = this.avatarStoragePath();
    const pageId = this.store.page()?.id || this.store.tempPageId();
    const storagePath = `pages/${pageId}/avatar/${file.name}`;

    if (previous) {
      this.pageService.deleteStorageFile(previous).subscribe();
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
          this.store.updateField('avatarUrl', downloadUrl);
          this.store.updateField('avatarAlt', file.name);
          this.avatarStoragePath.set(storagePath);
          this.avatarUploading.set(false);
        });
      },
    );
  }
}
