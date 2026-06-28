import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DocsPreviewDefinition } from '../../models/docs-preview-definition.model';
import { DocsPreviewHostComponent } from '../docs-preview-host/docs-preview-host.component';
import {
  RhombusButtonComponent,
  RhombusCodeBlockComponent,
  RhombusIconComponent,
} from '@rhombuskit/core';

type PreviewTab = 'preview' | 'code';

@Component({
  selector: 'docs-live-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonToggleModule,
    DocsPreviewHostComponent,
    RhombusButtonComponent,
    RhombusCodeBlockComponent,
    RhombusIconComponent,
  ],
  templateUrl: './docs-live-preview.component.html',
  styleUrl: './docs-live-preview.component.scss',
})
export class DocsLivePreviewComponent {
  readonly previews = input.required<DocsPreviewDefinition[]>();

  readonly activePreviewIndex = signal(0);
  readonly activeTab = signal<PreviewTab>('preview');
  readonly activeViewport = signal<number | null>(null);

  readonly activePreview = computed(() => this.previews()[this.activePreviewIndex()]);

  setPreview(index: number): void {
    this.activePreviewIndex.set(index);
    this.activeViewport.set(null);
  }

  setTab(tab: PreviewTab): void {
    this.activeTab.set(tab);
  }

  setViewport(width: number | null): void {
    this.activeViewport.set(width);
  }
}
