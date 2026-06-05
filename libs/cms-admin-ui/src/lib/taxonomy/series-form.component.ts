import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Series } from '@foliokit/cms-core';
import {
  RhombusButtonComponent,
  RhombusDialogActionsDirective,
  RhombusDialogComponent,
  RhombusInputComponent,
  RhombusSwitchComponent,
  RhombusTextareaComponent,
} from '@rhombuskit/core';

export interface SeriesFormDialogData {
  series?: Series;
}

/** Result emitted when the series form is submitted. */
export type SeriesFormResult = Omit<Series, 'id' | 'createdAt' | 'updatedAt'>;

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
    RhombusButtonComponent,
    RhombusDialogActionsDirective,
    RhombusDialogComponent,
    RhombusInputComponent,
    RhombusSwitchComponent,
    RhombusTextareaComponent,
  ],
  template: `
    <rhombus-dialog [title]="data.series ? 'Edit Series' : 'New Series'">
      <form class="flex flex-col gap-4 pt-2" style="min-width: 360px" (submit)="$event.preventDefault()">
        <rhombus-input
          label="Name"
          placeholder="e.g. Intro to Angular"
          [control]="asFc(form.get('name'))"
        >
          <span rhombusError>Name is required</span>
        </rhombus-input>

        <rhombus-input
          label="Slug"
          placeholder="e.g. intro-to-angular"
          [control]="asFc(form.get('slug'))"
        >
          <span rhombusError>Slug is required</span>
        </rhombus-input>

        <rhombus-textarea
          label="Description"
          placeholder="Optional"
          [rows]="2"
          [control]="asFc(form.get('description'))"
        />

        <div class="flex items-center gap-3">
          <rhombus-switch label="Active" [control]="asFc(form.get('isActive'))" />
        </div>
      </form>

      <div rhombusDialogActions>
        <rhombus-button appearance="text" variant="secondary" (click)="dialogRef.close()">
          Cancel
        </rhombus-button>
        <rhombus-button [disabled]="form.invalid" (click)="submit()">
          {{ data.series ? 'Save' : 'Create' }}
        </rhombus-button>
      </div>
    </rhombus-dialog>
  `,
})
export class SeriesFormComponent implements OnInit {
  protected readonly data = inject<SeriesFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<SeriesFormComponent, SeriesFormResult>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    isActive: [true],
  });

  /** Narrow an `AbstractControl` to `FormControl` for RhombusKit's `[control]` input. */
  protected asFc(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  ngOnInit(): void {
    if (this.data.series) {
      this.form.patchValue({
        name: this.data.series.name,
        slug: this.data.series.slug,
        description: this.data.series.description ?? '',
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
    const { name, slug, description, isActive } = this.form.getRawValue();
    const result: SeriesFormResult = {
      name: name!,
      slug: slug!,
      description: description || undefined,
      postCount: this.data.series?.postCount ?? 0,
      isActive: isActive ?? true,
    };
    this.dialogRef.close(result);
  }
}
