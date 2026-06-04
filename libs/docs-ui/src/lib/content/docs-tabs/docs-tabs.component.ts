import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RhombusCodeBlockComponent } from '@rhombuskit/core';

export interface DocsTab {
  label: string;
  content: string;
}

@Component({
  selector: 'docs-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, RhombusCodeBlockComponent],
  template: `
    <mat-tab-group>
      @for (tab of tabs(); track tab.label) {
        <mat-tab [label]="tab.label">
          <div class="pt-4">
            <rhombus-code-block [code]="tab.content" />
          </div>
        </mat-tab>
      }
    </mat-tab-group>
  `,
})
export class DocsTabsComponent {
  readonly tabs = input.required<DocsTab[]>();
}
