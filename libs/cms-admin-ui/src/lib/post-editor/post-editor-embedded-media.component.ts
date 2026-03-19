import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { EmbeddedMediaEntry, FIREBASE_STORAGE } from '@foliokit/cms-core';
import { PostEditorStore } from './post-editor.store';
import { PostEditorEmbeddedMediaItemComponent } from './post-editor-embedded-media-item.component';

@Component({
  selector: 'folio-post-editor-embedded-media',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, PostEditorEmbeddedMediaItemComponent],
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  template: `
    <div class="flex flex-col gap-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">Embedded Media</span>
        <button
          mat-stroked-button
          [disabled]="uploading()"
          (click)="isBrowser && fileInput.click()"
        >
          <mat-icon>upload</mat-icon>
          Upload Image
        </button>
      </div>

      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onFileSelected($any($event.target).files)"
      />

      <!-- Upload progress -->
      @if (uploading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Upload error -->
      @if (uploadError()) {
        <p class="text-sm text-red-500">{{ uploadError() }}</p>
      }

      <!-- Media grid -->
      @if (entries().length > 0) {
        <div class="grid grid-cols-2 gap-3">
          @for (item of entries(); track item.token) {
            <folio-post-editor-embedded-media-item
              [entry]="item"
              [token]="item.token"
            />
          }
        </div>
      } @else {
        <div class="flex items-center justify-center py-8">
          <span class="text-sm opacity-40">No embedded media yet</span>
        </div>
      }
    </div>
  `,
})
export class PostEditorEmbeddedMediaComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly store = inject(PostEditorStore);
  private readonly storage = inject(FIREBASE_STORAGE);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly entries = computed<EmbeddedMediaEntry[]>(() => {
    const media = this.store.post()?.embeddedMedia ?? {};
    return Object.values(media) as EmbeddedMediaEntry[];
  });

  onFileSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.upload(files[0]);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private upload(file: File): void {
    const postId = this.store.post()?.id || this.store.tempPostId();
    const storagePath = `posts/${postId}/media/${file.name}`;
    const fileRef = ref(this.storage, storagePath);
    const token = crypto.randomUUID();

    this.uploading.set(true);
    this.uploadError.set(null);

    const task = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      null,
      (error) => {
        this.uploading.set(false);
        this.uploadError.set(error.message);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          const entry: EmbeddedMediaEntry = {
            token,
            storagePath,
            downloadUrl,
            alt: file.name,
            mimeType: file.type,
          };
          const currentMedia = this.store.post()?.embeddedMedia ?? {};
          this.store.updateField('embeddedMedia', {
            ...currentMedia,
            [token]: entry,
          });
          this.uploading.set(false);
        });
      },
    );
  }
}
