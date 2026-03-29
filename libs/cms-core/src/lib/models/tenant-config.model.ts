export interface TenantConfig {
  tenantId: string;
  subdomain: string;
  customDomain: string | null;
  ownerEmail: string;
  displayName: string;
  createdAt: import('@firebase/firestore').Timestamp;
  updatedAt: import('@firebase/firestore').Timestamp;
}
