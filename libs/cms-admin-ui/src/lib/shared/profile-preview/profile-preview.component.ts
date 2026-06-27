import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RhombusAvatarComponent, RhombusButtonComponent } from '@rhombuskit/core';
import { SiteProfile } from '@foliokit/cms-core';

@Component({
  selector: 'folio-profile-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusAvatarComponent, RhombusButtonComponent],
  template: `
    <div class="flex flex-col items-center gap-2 py-3">
      <rhombus-avatar
        [src]="profile()?.photoUrl ?? null"
        [name]="profile()?.displayName ?? ''"
        size="lg"
      />
      @if (profile()?.displayName) {
        <span class="text-[13px] font-semibold leading-tight">{{ profile()!.displayName }}</span>
      } @else {
        <span class="text-[13px] opacity-40 leading-tight">No display name</span>
      }
      <rhombus-button appearance="text" size="sm" [routerLink]="settingsRoute()">
        Edit profile →
      </rhombus-button>
    </div>
  `,
})
export class ProfilePreviewComponent {
  readonly profile = input<SiteProfile | null>(null);
  readonly settingsRoute = input<string>('/settings');
}
