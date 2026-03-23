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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { FIREBASE_STORAGE, PageService } from '@foliokit/cms-core';
import { PageEditorStore } from './page-editor.store';

@Component({
  selector: 'admin-page-editor-hero-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  styles: [
    `
      :host { display: block; }
      .drop-zone {
        border: 2px dashed color-mix(in srgb, currentColor 25%, transparent);
        border-radius: 8px;
        transition: border-color 0.15s, background 0.15s;
      }
      .drop-zone.drag-over {
        border-color: var(--mat-sys-primary);
        background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      }
      .image-wrapper { position: relative; }
      .image-wrapper:hover .hover-overlay { opacity: 1; }
      .hover-overlay { opacity: 0; transition: opacity 0.15s; }
    `,
  ],
  template: `
    <div class="flex flex-col gap-2">
      <span class="text-sm font-semibold">Hero Image</span>

      @if (heroImageUrl(); as url) {
        <div class="image-wrapper rounded-lg overflow-hidden">
          <div class="aspect-video w-full relative">
            <img [src]="url" [alt]="heroImageAlt()" class="w-full h-full object-cover" />
            <div
              class="hover-overlay absolute inset-0 flex items-center justify-center gap-3"
              style="background: rgba(0,0,0,0.45)"
            >
              <button mat-icon-button style="color: white" title="Replace image" (click)="isBrowser && fileInput.click()">
                <mat-icon>swap_horiz</mat-icon>
              </button>
              <button mat-icon-button style="color: white" title="Remove image" (click)="onDelete()">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div
          class="drop-zone w-full flex flex-col items-center justify-center gap-2 py-10 cursor-pointer select-none"
          [class.drag-over]="isDragOver()"
          (click)="isBrowser && fileInput.click()"
          (dragover)="isBrowser && onDragOver($event)"
          (dragleave)="isBrowser && onDragLeave()"
          (drop)="isBrowser && onDrop($event)"
        >
          <mat-icon class="opacity-40" style="font-size: 2.5rem; width: 2.5rem; height: 2.5rem">
            upload_file
          </mat-icon>
          <span class="text-sm opacity-50">Upload hero image</span>
        </div>
      }

      <input
        #fileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onFileSelected($any($event.target).files)"
      />

      @if (uploading()) {
        <mat-progress-bar mode="determinate" [value]="uploadProgress()" />
      }
      @if (uploadError()) {
        <p class="text-sm text-red-500">{{ uploadError() }}</p>
      }
    </div>
  `,
})
export class PageEditorHeroImageComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly store = inject(PageEditorStore);
  private readonly storage = inject(FIREBASE_STORAGE)!;
  private readonly pageService = inject(PageService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly uploadError = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly storagePath = signal<string | null>(null);

  // Hero image was an AboutPage-only feature. AboutPage has been superseded by
  // AboutPageConfig in SiteConfig. These getters return empty values.
  get heroImageUrl() {
    return () => undefined as string | undefined;
  }

  get heroImageAlt() {
    return () => '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.upload(files[0]);
  }

  onFileSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.upload(files[0]);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onDelete(): void {
    if (!window.confirm('Remove hero image?')) return;
    const path = this.storagePath();
    const clear = () => {
      this.store.updateField('heroImageUrl', undefined);
      this.store.updateField('heroImageAlt', undefined);
      this.storagePath.set(null);
      this.uploadProgress.set(0);
    };
    if (path) {
      this.pageService.deleteStorageFile(path).subscribe({ next: clear, error: clear });
    } else {
      clear();
    }
  }

  private upload(file: File): void {
    const previousPath = this.storagePath();
    const pageId = this.store.page()?.id || this.store.tempPageId();
    const storagePath = `pages/${pageId}/hero/${file.name}`;

    if (previousPath) {
      this.pageService.deleteStorageFile(previousPath).subscribe();
    }

    const fileRef = ref(this.storage, storagePath);
    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);

    const task = uploadBytesResumable(fileRef, file);
    task.on(
      'state_changed',
      (snapshot) => {
        this.uploadProgress.set(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        this.uploading.set(false);
        this.uploadError.set(error.message);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          this.store.updateField('heroImageUrl', downloadUrl);
          this.store.updateField('heroImageAlt', file.name);
          this.storagePath.set(storagePath);
          this.uploading.set(false);
        });
      },
    );
  }
}
