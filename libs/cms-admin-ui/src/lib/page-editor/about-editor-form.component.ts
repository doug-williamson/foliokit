import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * @deprecated AboutPage has been superseded by AboutPageConfig embedded in SiteConfig.
 * Manage the About page via Admin → Site Config → About tab.
 */
@Component({
  selector: 'admin-about-editor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <!-- AboutEditorFormComponent is deprecated: AboutPage has been superseded by
         AboutPageConfig in SiteConfig. Edit the About page via Admin → Site Config → About. -->
    <p class="p-8 text-center opacity-40 text-sm">
      The About page is now managed under Site Config → About tab.
    </p>
  `,
})
export class AboutEditorFormComponent {}
