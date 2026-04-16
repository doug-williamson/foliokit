import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'admin-image-upload-pair',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="flex flex-col gap-2">
      <span class="text-sm font-semibold">{{ label() }}</span>
      <p class="text-xs opacity-50 -mt-1">{{ subtitle() }}</p>
      <div class="grid grid-cols-2 gap-6 justify-items-center items-start">
        <!-- Light mode -->
        <div class="flex flex-col items-center gap-1">
          @if (lightUrl(); as url) {
            <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group">
              <img [src]="url" alt="Image (light)" class="w-full h-full object-cover" />
              <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   style="background: rgba(0,0,0,0.5)">
                <button mat-icon-button style="color:white" title="Replace" type="button"
                        (click)="lightInput.click()">
                  <mat-icon svgIcon="swap_horiz" />
                </button>
                <button mat-icon-button style="color:white" title="Remove" type="button"
                        (click)="lightRemoved.emit()">
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
              (click)="lightInput.click()"
              (keydown.enter)="lightInput.click()"
            >
              <mat-icon class="opacity-40" svgIcon="upload" />
              <span class="text-xs opacity-40">Upload</span>
            </div>
          }
          <span class="text-xs opacity-50 leading-none">Light</span>
        </div>
        <!-- Dark mode -->
        <div class="flex flex-col items-center gap-1">
          @if (darkUrl(); as url) {
            <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group"
                 style="background: var(--surface-2)">
              <img [src]="url" alt="Image (dark)" class="w-full h-full object-cover" />
              <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   style="background: rgba(0,0,0,0.5)">
                <button mat-icon-button style="color:white" title="Replace" type="button"
                        (click)="darkInput.click()">
                  <mat-icon svgIcon="swap_horiz" />
                </button>
                <button mat-icon-button style="color:white" title="Remove" type="button"
                        (click)="darkRemoved.emit()">
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
              (click)="darkInput.click()"
              (keydown.enter)="darkInput.click()"
            >
              <mat-icon class="opacity-40" svgIcon="upload" />
              <span class="text-xs opacity-40">Upload</span>
            </div>
          }
          <span class="text-xs opacity-50 leading-none">Dark</span>
        </div>
      </div>
      <input #lightInput type="file" accept="image/*" class="hidden"
             (change)="onLightFileChange($event)" />
      <input #darkInput type="file" accept="image/*" class="hidden"
             (change)="onDarkFileChange($event)" />
      @if (lightUploading()) {
        <mat-progress-bar mode="determinate" [value]="lightProgress()" class="max-w-[13rem]" />
      }
      @if (darkUploading()) {
        <mat-progress-bar mode="determinate" [value]="darkProgress()" class="max-w-[13rem]" />
      }
      @if (lightError()) {
        <p class="text-xs text-red-500">{{ lightError() }}</p>
      }
      @if (darkError()) {
        <p class="text-xs text-red-500">{{ darkError() }}</p>
      }
    </div>
  `,
})
export class ImageUploadPairComponent {
  @ViewChild('lightInput') private lightInput!: ElementRef<HTMLInputElement>;
  @ViewChild('darkInput') private darkInput!: ElementRef<HTMLInputElement>;

  readonly label = input.required<string>();
  /** Same copy on About and Links profile photo blocks. */
  readonly subtitle = input(
    'Dark photo is optional — shown when dark mode is active.',
  );
  readonly lightUrl = input<string | undefined>(undefined);
  readonly darkUrl = input<string | undefined>(undefined);
  readonly lightUploading = input(false);
  readonly darkUploading = input(false);
  readonly lightProgress = input(0);
  readonly darkProgress = input(0);
  readonly lightError = input<string | null>(null);
  readonly darkError = input<string | null>(null);

  readonly lightFileSelected = output<File>();
  readonly darkFileSelected = output<File>();
  readonly lightRemoved = output<void>();
  readonly darkRemoved = output<void>();

  protected onLightFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.lightFileSelected.emit(input.files[0]);
      input.value = '';
    }
  }

  protected onDarkFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.darkFileSelected.emit(input.files[0]);
      input.value = '';
    }
  }
}
