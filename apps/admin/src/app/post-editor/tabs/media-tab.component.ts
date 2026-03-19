import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'folio-media-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center h-full gap-3 opacity-40">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-12 h-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span class="text-sm font-medium">Media — coming soon</span>
    </div>
  `,
})
export class MediaTabComponent {}
