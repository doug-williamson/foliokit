import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SiteProfile } from '@foliokit/cms-core';

@Component({
  selector: 'folio-profile-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="flex flex-col items-center gap-2 py-3">
      <div
        class="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style="background: #64748b"
      >
        @if (profile()?.photoUrl) {
          <img
            [src]="profile()!.photoUrl!"
            [alt]="profile()?.photoAlt ?? 'Profile photo'"
            class="w-full h-full object-cover"
          />
        }
      </div>
      @if (profile()?.displayName) {
        <span class="text-[13px] font-semibold leading-tight">{{ profile()!.displayName }}</span>
      } @else {
        <span class="text-[13px] opacity-40 leading-tight">No display name</span>
      }
      <a
        mat-button
        [routerLink]="settingsRoute()"
        class="!text-xs opacity-70"
      >Edit profile →</a>
    </div>
  `,
})
export class ProfilePreviewComponent {
  readonly profile = input<SiteProfile | null>(null);
  readonly settingsRoute = input<string>('/settings');
}
