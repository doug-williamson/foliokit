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
import type { Pillar } from '@foliokit/cms-core';

export interface PillarFormDialogData {
  pillar?: Pillar;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Component({
  selector: 'folio-pillar-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.pillar ? 'Edit Pillar' : 'New Pillar' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2" style="min-width: 320px">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Deep Dives" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Slug</mat-label>
          <input matInput formControlName="slug" placeholder="e.g. deep-dives" />
          @if (form.get('slug')?.hasError('required') && form.get('slug')?.touched) {
            <mat-error>Slug is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Optional description"
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="submit()">
        {{ data.pillar ? 'Save' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class PillarFormComponent implements OnInit {
  protected readonly data = inject<PillarFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PillarFormComponent>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    if (this.data.pillar) {
      this.form.patchValue({
        name: this.data.pillar.name,
        slug: this.data.pillar.slug,
        description: this.data.pillar.description ?? '',
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
    const { name, slug, description } = this.form.getRawValue();
    const result: Omit<Pillar, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name!,
      slug: slug!,
      description: description || undefined,
    };
    this.dialogRef.close(result);
  }
}
