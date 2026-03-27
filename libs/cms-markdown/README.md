# @foliokit/cms-markdown

Markdown rendering component for Angular with embedded media token resolution.
Wraps `ngx-markdown` and adds support for replacing `![alt](token)` placeholders
with resolved Firebase Storage URLs at render time.

Part of the [FolioKit](https://github.com/doug-williamson/foliokit) ecosystem.

## Install

```bash
npm install @foliokit/cms-markdown
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@angular/common` | `^21.2.4` |
| `@angular/core` | `^21.2.4` |
| `@foliokit/cms-core` | `^1.0.0` |
| `ngx-markdown` | `^21.1.0` |

## Quick Start

```typescript
// In your component:
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [MarkdownComponent],
  template: `
    <folio-markdown
      [content]="post.content"
      [embeddedMedia]="post.embeddedMedia"
    />
  `,
})
export class PostComponent {
  post = { content: '## Hello\n\nWorld', embeddedMedia: {} };
}
```

**Important:** You must call `provideMarkdown()` from `ngx-markdown` in your
`app.config.ts` providers for the component to work:

```typescript
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMarkdown(),
    // ...
  ],
};
```

## API

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `string` | Yes | Markdown content to render |
| `embeddedMedia` | `Record<string, EmbeddedMediaEntry>` | No | Token-to-URL map for embedded images |

### Embedded Media

When post content contains `![alt](my-token)`, and `embeddedMedia` has a key
`my-token` with a `downloadUrl`, the component replaces the token with the
resolved URL before rendering. This enables storing media references in
Firestore without hardcoding URLs.

## Full Documentation

[foliokitcms.com/docs/components/markdown](https://foliokitcms.com/docs/components/markdown)
