import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { ThemeService } from '../theme.service';

export type ProfileAvatarSize = 'lg' | 'xl';

@Component({
  selector: 'folio-profile-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  template: `
    <div [class]="avatarClasses()">
      @if (resolvedSrc(); as src) {
        <img [src]="src" [alt]="alt()" />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }
    </div>
  `,
})
export class ProfileAvatarComponent {
  private readonly theme = inject(ThemeService);

  /** Primary image URL (light mode, or fallback when no dark variant). */
  readonly photoUrl = input<string | null | undefined>(undefined);
  /** Optional dark-mode image URL. */
  readonly photoUrlDark = input<string | null | undefined>(undefined);
  /** Alt text when an image is shown. */
  readonly alt = input<string>('');
  /** Text used to derive initials when no image URL resolves (e.g. headline). */
  readonly initialsFrom = input<string>('');

  readonly size = input<ProfileAvatarSize>('xl');

  protected readonly resolvedSrc = computed(() => {
    const light = this.photoUrl()?.trim() || null;
    const dark = this.photoUrlDark()?.trim() || null;
    if (this.theme.isDark() && dark) return dark;
    return light;
  });

  protected readonly initials = computed(() => {
    const source = this.initialsFrom().trim();
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  });

  protected readonly avatarClasses = computed(
    () => `avatar avatar--${this.size()}`,
  );
}
