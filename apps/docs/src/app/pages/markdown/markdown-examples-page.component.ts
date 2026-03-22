import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
import { MarkdownComponent } from '@foliokit/cms-markdown';

const DEMO_MARKDOWN = `# MarkdownComponent Demo

This is a **bold** statement and this is *italic* text.

## Code Block

\`\`\`typescript
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  imports: [MarkdownComponent],
  template: \`<folio-markdown [content]="md" />\`,
})
export class MyPage {
  readonly md = '# Hello';
}
\`\`\`

## Blockquote

> FolioKit is a headless Angular CMS toolkit built on Firebase,
> Material 3, and Nx. It gives you the building blocks — you bring the content.

## Unordered List

- Angular 21 with standalone components
- Firebase Firestore and Storage
- Material 3 design tokens
- Tailwind CSS utilities

## Inline Code

Use \`input.required<string>()\` for required signal inputs in Angular 17+.
`;

const previewCode = `import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  imports: [MarkdownComponent],
  template: \`<folio-markdown [content]="content" />\`,
})
export class MyPageComponent {
  readonly content = \`
# Heading

Paragraph with **bold** and *italic* text.

\\\`\\\`\\\`typescript
const x = 42;
\\\`\\\`\\\`

> A blockquote for emphasis.
  \`;
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
