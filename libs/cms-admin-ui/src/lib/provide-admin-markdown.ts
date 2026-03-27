import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideMarkdown } from 'ngx-markdown';

/**
 * Registers the `ngx-markdown` providers required by the FolioKit admin
 * markdown preview editor.
 *
 * This is a thin wrapper around `provideMarkdown()` from `ngx-markdown`.
 * Calling it directly is equivalent to calling `provideMarkdown()` yourself.
 *
 * **You do not need this function if you use {@link provideAdminKit}.**
 * `provideAdminKit()` already calls `provideMarkdown()` internally unless
 * you pass `{ markdown: false }`. Only use `provideAdminMarkdown()` when
 * composing providers manually without `provideAdminKit()` — for example,
 * if you need explicit control over the markdown configuration.
 *
 * @returns An `EnvironmentProviders` token suitable for
 *   `ApplicationConfig.providers`.
 *
 * @example
 * ```ts
 * // app.config.ts — manual composition without provideAdminKit()
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideAdminMarkdown(),
 *     // ... other providers
 *   ],
 * };
 * ```
 */
export function provideAdminMarkdown(): EnvironmentProviders {
  return makeEnvironmentProviders(provideMarkdown());
}
