import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent } from '@foliokit/docs-ui';

const createWorkspace = `npx create-nx-workspace@latest my-app --preset=angular-monorepo --nxCloud=skip`;

const addAngular = `nx g @nx/angular:app apps/my-app \\
  --style=scss \\
  --ssr \\
  --standalone`;

const addFirebase = `nx g @nx/firebase:init`;

const firebaseMultiSite = `{
  "hosting": [
    {
      "site": "my-app-prod",
      "public": "dist/apps/my-app/browser",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "function": "ssrServer" }]
    }
  ],
  "functions": {
    "source": "dist/apps/my-app/server"
  }
}`;

@Component({
  selector: 'docs-getting-started-nx-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="create-workspace" class="mat-headline-small">Create Workspace</h2>
      <p class="mat-body-medium">Bootstrap a new Nx monorepo with Angular support:</p>
      <docs-code-block [code]="createWorkspace" language="bash" />
    </section>

    <section class="mt-8">
      <h2 id="add-angular" class="mat-headline-small">Add Angular</h2>
      <p class="mat-body-medium">Generate the Angular app inside the workspace:</p>
      <docs-code-block [code]="addAngular" language="bash" />
    </section>

    <section class="mt-8">
      <h2 id="add-firebase" class="mat-headline-small">Add Firebase</h2>
      <p class="mat-body-medium">Initialize Firebase in the Nx workspace:</p>
      <docs-code-block [code]="addFirebase" language="bash" />
      <p class="mat-body-medium mt-4">Configure multi-site hosting in <code>firebase.json</code>:</p>
      <docs-code-block [code]="firebaseMultiSite" language="json" />
    </section>
  `,
})
export class GettingStartedNxPageComponent {
  protected readonly createWorkspace = createWorkspace;
  protected readonly addAngular = addAngular;
  protected readonly addFirebase = addFirebase;
  protected readonly firebaseMultiSite = firebaseMultiSite;
}
