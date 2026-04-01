export interface SignupFormValue {
  email: string;
  subdomain: string;
  displayName: string;
}

export type SubdomainAvailability =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'taken' }
  | { status: 'invalid' }
  | { status: 'reserved' }
  | { status: 'error' };

export interface ProvisionResult {
  tenantId: string;
  blogUrl: string;
}
