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
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';
import { FIREBASE_STORAGE } from '@foliokit/cms-core';
import { PageEditorStore } from './page-editor.store';
import { PageEditorEmbeddedMediaItemComponent } from './page-editor-embedded-media-item.component';

@Component({
  selector: 'admin-page-editor-embedded-media',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, PageEditorEmbeddedMediaItemComponent],
  styles: [`:host { display: block; }`],
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">Embedded Media</span>
        <button mat-stroked-button [disabled]="uploading()" (click)="isBrowser && fileInput.click()">
          <mat-icon>upload</mat-icon>
          Upload Image
        </button>
      </div>

      <input
        #fileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onFileSelected($any($event.target).files)"
      />

      @if (uploading()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (uploadError()) {
        <p class="text-sm text-red-500">{{ uploadError() }}</p>
      }

      @if (entries().length > 0) {
        <div class="grid grid-cols-2 gap-3">
          @for (item of entries(); track item.token) {
            <admin-page-editor-embedded-media-item [entry]="item" [token]="item.token" />
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
export class PageEditorEmbeddedMediaComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly store = inject(PageEditorStore);
  private readonly storage = inject(FIREBASE_STORAGE)!;
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  // Embedded media is no longer supported for page types — AboutPage was
  // superseded by AboutPageConfig in SiteConfig.
  readonly entries = computed<EmbeddedMediaEntry[]>(() => []);

  onFileSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.upload(files[0]);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private upload(file: File): void {
    const pageId = this.store.page()?.id || this.store.tempPageId();
    const storagePath = `pages/${pageId}/media/${file.name}`;
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
        getDownloadURL(task.snapshot.ref).then(() => {
          this.uploading.set(false);
        });
      },
    );
  }
}
