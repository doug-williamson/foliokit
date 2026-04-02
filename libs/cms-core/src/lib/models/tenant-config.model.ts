export interface TenantConfig {
  tenantId: string;
  subdomain: string;
  customDomain: string | null;
  customDomainStatus?: 'unregistered' | 'registration_pending' | 'active' | 'failed';
  ownerEmail: string;
  displayName: string;
  createdAt: import('@firebase/firestore').Timestamp;
  updatedAt: import('@firebase/firestore').Timestamp;
}
