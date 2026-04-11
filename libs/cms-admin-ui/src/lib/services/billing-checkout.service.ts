import { inject, Injectable } from '@angular/core';
import { AuthService, SITE_ID } from '@foliokit/cms-core';
import { FUNCTIONS_BASE_URL } from '../provide-admin-kit';

@Injectable({ providedIn: 'root' })
export class BillingCheckoutService {
  private readonly auth = inject(AuthService);
  private readonly siteId = inject(SITE_ID);
  private readonly functionsBaseUrl = inject(FUNCTIONS_BASE_URL);

  /**
   * Starts Stripe Checkout for the given plan. Returns the Checkout session URL.
   * @throws Error when unauthenticated, request fails, or response has no url.
   */
  async createCheckoutSession(plan: 'pro' | 'agency'): Promise<string> {
    const user = this.auth.user();
    if (!user) {
      throw new Error('You must be signed in to upgrade.');
    }
    const idToken = await user.getIdToken();
    const res = await fetch(`${this.functionsBaseUrl}/createCheckoutSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ tenantId: this.siteId, plan }),
    });

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    const data = body as { url?: string; error?: string } | null;
    if (data?.url) {
      return data.url;
    }

    const detail =
      typeof data?.error === 'string'
        ? data.error
        : !res.ok
          ? `HTTP ${res.status}`
          : 'missing_checkout_url';
    throw new Error(`Checkout failed (${detail}).`);
  }
}
