import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { Pillar, Series } from '@foliokit/cms-core';

export interface SeriesFormDialogData {
  series?: Series;
  pillars: Pillar[];
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Component({
  selector: 'folio-series-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.series ? 'Edit Series' : 'New Series' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2" style="min-width: 360px">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Intro to Angular" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Slug</mat-label>
          <input matInput formControlName="slug" placeholder="e.g. intro-to-angular" />
          @if (form.get('slug')?.hasError('required') && form.get('slug')?.touched) {
            <mat-error>Slug is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="Optional"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Pillar</mat-label>
          <mat-select formControlName="pillarId">
            <mat-option [value]="null">No pillar (standalone)</mat-option>
            @for (p of data.pillars; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="flex items-center gap-3">
          <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="submit()">
        {{ data.series ? 'Save' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class SeriesFormComponent implements OnInit {
  protected readonly data = inject<SeriesFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SeriesFormComponent>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    pillarId: [null as string | null],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data.series) {
      this.form.patchValue({
        name: this.data.series.name,
        slug: this.data.series.slug,
        description: this.data.series.description ?? '',
        pillarId: this.data.series.pillarId,
        isActive: this.data.series.isActive,
      });
    }

    this.form.get('name')?.valueChanges.subscribe((name) => {
      if (this.form.get('slug')?.pristine) {
        this.form.get('slug')?.setValue(toSlug(name ?? ''), { emitEvent: false });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const { name, slug, description, pillarId, isActive } = this.form.getRawValue();
    const result: Omit<Series, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name!,
      slug: slug!,
      description: description || undefined,
      pillarId: pillarId ?? null,
      postCount: this.data.series?.postCount ?? 0,
      isActive: isActive ?? true,
    };
    this.dialogRef.close(result);
  }
}
