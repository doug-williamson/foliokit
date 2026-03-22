import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { CdkPortalOutlet, ComponentPortal, PortalModule } from '@angular/cdk/portal';
import { DocsPreviewDefinition } from '../../models/docs-preview-definition.model';

@Component({
  selector: 'docs-preview-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortalModule],
  template: `<ng-template cdkPortalOutlet />`,
})
export class DocsPreviewHostComponent implements OnInit, OnDestroy {
  readonly preview = input.required<DocsPreviewDefinition>();

  private readonly injector = inject(Injector);

  @ViewChild(CdkPortalOutlet, { static: true })
  portalOutlet!: CdkPortalOutlet;

  ngOnInit(): void {
    const def = this.preview();
    const scopedInjector = def.providers?.length
      ? Injector.create({ providers: def.providers, parent: this.injector })
      : this.injector;

    const portal = new ComponentPortal(def.component, null, scopedInjector);
    this.portalOutlet.attach(portal);
  }

  ngOnDestroy(): void {
    if (this.portalOutlet.hasAttached()) {
      this.portalOutlet.detach();
    }
  }
}
