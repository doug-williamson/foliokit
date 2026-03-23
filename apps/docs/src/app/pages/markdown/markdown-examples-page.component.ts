import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
import { MarkdownComponent } from '@foliokit/cms-markdown';

const DEMO_MARKDOWN = `# Getting Started with MarkdownComponent

Render **rich content** from *Firestore documents* using a single component.

\`\`\`typescript
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  standalone: true,
  imports: [MarkdownComponent],
  template: '<folio-markdown [content]="md" />',
})
export class MyComponent {
  readonly md = '# Hello World';
}
\`\`\`

> The MarkdownComponent wraps ngx-markdown and applies Tailwind
> prose classes, so your content looks great out of the box.

## Key Features

- Signal-based content input
- Automatic image URL resolution via embeddedMedia
- Tailwind typography styling
- Dark mode support with prose-invert
`;

const previewCode = `import { Component } from '@angular/core';
import { MarkdownComponent } from '@foliokit/cms-markdown';

const content = \`# Getting Started with MarkdownComponent

Render **rich content** from *Firestore documents* using a single component.

\\\`\\\`\\\`typescript
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  standalone: true,
  imports: [MarkdownComponent],
  template: '<folio-markdown [content]="md" />',
})
export class MyComponent {
  readonly md = '# Hello World';
}
\\\`\\\`\\\`

> The MarkdownComponent wraps ngx-markdown and applies Tailwind
> prose classes, so your content looks great out of the box.

## Key Features

- Signal-based content input
- Automatic image URL resolution via embeddedMedia
- Tailwind typography styling
- Dark mode support with prose-invert
\`;

@Component({
  standalone: true,
  imports: [MarkdownComponent],
  template: \`<folio-markdown [content]="content" />\`,
})
export class ExampleComponent {
  readonly content = content;
}`;

@Component({
  selector: 'docs-markdown-examples-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsPreviewComponent, MarkdownComponent],
  template: `
    <docs-page-header />

    <docs-preview [code]="previewCode">
      <folio-markdown [content]="demoMarkdown" />
    </docs-preview>
  `,
})
export class MarkdownExamplesPageComponent {
  protected readonly previewCode = previewCode;
  protected readonly demoMarkdown = DEMO_MARKDOWN;
}
