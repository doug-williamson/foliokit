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
import { FIREBASE_STORAGE, PostService } from '@foliokit/cms-core';
import { PostEditorStore } from './post-editor.store';

@Component({
  selector: 'folio-post-editor-cover-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  styles: [
    `
      :host {
        display: block;
      }
      .drop-zone {
        border: 2px dashed color-mix(in srgb, currentColor 25%, transparent);
        border-radius: 8px;
        transition: border-color 0.15s, background 0.15s;
      }
      .drop-zone.drag-over {
        border-color: var(--mat-sys-primary);
        background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      }
      .image-wrapper {
        position: relative;
      }
      .image-wrapper:hover .hover-overlay {
        opacity: 1;
      }
      .hover-overlay {
        opacity: 0;
        transition: opacity 0.15s;
      }
    `,
  ],
  template: `
    <div class="flex flex-col gap-2">
      <span class="text-sm font-semibold">Cover Image</span>

      @if (store.post()?.thumbnailUrl; as url) {
        <!-- Filled state -->
        <div class="image-wrapper rounded-lg overflow-hidden">
          <div class="aspect-video w-full relative">
            <img
              [src]="url"
              [alt]="store.post()?.thumbnailAlt ?? ''"
              class="w-full h-full object-cover"
            />
            <!-- Hover overlay -->
            <div
              class="hover-overlay absolute inset-0 flex items-center justify-center gap-3"
              style="background: rgba(0,0,0,0.45)"
            >
              <button
                mat-icon-button
                style="color: white"
                title="Replace image"
                (click)="isBrowser && fileInput.click()"
              >
                <mat-icon svgIcon="swap_horiz" />
              </button>
              <button
                mat-icon-button
                style="color: white"
                title="Delete image"
                (click)="onDeleteCover()"
              >
                <mat-icon svgIcon="delete" />
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty state -->
        <div
          class="drop-zone w-full flex flex-col items-center justify-center gap-2 py-10 cursor-pointer select-none"
          [class.drag-over]="isDragOver()"
          role="button" tabindex="0"
          (click)="isBrowser && fileInput.click()"
          (keydown.enter)="isBrowser && fileInput.click()"
          (dragover)="isBrowser && onDragOver($event)"
          (dragleave)="isBrowser && onDragLeave()"
          (drop)="isBrowser && onDrop($event)"
        >
          <mat-icon class="opacity-40" style="font-size: 2.5rem; width: 2.5rem; height: 2.5rem" svgIcon="upload_file" />
          <span class="text-sm opacity-50">Upload cover image</span>
        </div>
      }

      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onFileSelected($any($event.target).files)"
      />

      <!-- Progress bar -->
      @if (uploading()) {
        <mat-progress-bar mode="determinate" [value]="uploadProgress()" />
      }

      <!-- Error message -->
      @if (uploadError()) {
        <p class="text-sm text-red-500">{{ uploadError() }}</p>
      }
    </div>
  `,
})
export class PostEditorCoverImageComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly store = inject(PostEditorStore);
  private readonly storage = inject(FIREBASE_STORAGE)!;
  private readonly postService = inject(PostService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly uploadError = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly storagePath = signal<string | null>(null);

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
    if (files?.length) {
      this.upload(files[0]);
    }
  }

  onFileSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.upload(files[0]);
    // Reset so the same file can be re-selected after a delete
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onDeleteCover(): void {
    if (!window.confirm('Remove cover image?')) return;
    const path = this.storagePath();
    if (path) {
      this.postService.deleteStorageFile(path).subscribe({
        next: () => this.clearCover(),
        error: () => this.clearCover(),
      });
    } else {
      this.clearCover();
    }
  }

  private clearCover(): void {
    this.store.updateField('thumbnailUrl', '');
    this.store.updateField('thumbnailAlt', '');
    this.storagePath.set(null);
    this.uploadProgress.set(0);
  }

  private upload(file: File): void {
    const previousPath = this.storagePath();
    const postId = this.store.post()?.id || this.store.tempPostId();
    const storagePath = `posts/${postId}/cover/${file.name}`;

    if (previousPath) {
      this.postService.deleteStorageFile(previousPath).subscribe();
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
          this.store.updateField('thumbnailUrl', downloadUrl);
          this.store.updateField('thumbnailAlt', file.name);
          this.storagePath.set(storagePath);
          this.uploading.set(false);
        });
      },
    );
  }
}
