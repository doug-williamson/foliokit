import { resolveTenantFromAuth } from './resolve-tenant-from-auth';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_fs: unknown, path: string) => path),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn((...args: unknown[]) => args),
  limit: vi.fn((n: number) => n),
  getDocs: vi.fn(),
}));

import { getDocs } from 'firebase/firestore';

const mockGetDocs = vi.mocked(getDocs);

function createMockAuth(user: { email: string } | null) {
  return {
    authStateReady: vi.fn().mockResolvedValue(undefined),
    currentUser: user,
  } as any;
}

const mockFirestore = {} as any;

// ── Tests ───────────────────────────────────────────────────────────────────

describe('resolveTenantFromAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws "unauthenticated" when no user is signed in', async () => {
    const auth = createMockAuth(null);

    await expect(resolveTenantFromAuth(auth, mockFirestore)).rejects.toThrow(
      'unauthenticated',
    );
    expect(auth.authStateReady).toHaveBeenCalled();
  });

  it('returns the tenant ID when exactly one tenant matches', async () => {
    const auth = createMockAuth({ email: 'owner@example.com' });
    mockGetDocs.mockResolvedValue({
      empty: false,
      size: 1,
      docs: [{ id: 'my-tenant' }],
    } as any);

    const result = await resolveTenantFromAuth(auth, mockFirestore);
    expect(result).toBe('my-tenant');
  });

  it('throws "tenant_not_found" when no tenant matches the email', async () => {
    const auth = createMockAuth({ email: 'unknown@example.com' });
    mockGetDocs.mockResolvedValue({
      empty: true,
      size: 0,
      docs: [],
    } as any);

    await expect(resolveTenantFromAuth(auth, mockFirestore)).rejects.toThrow(
      'tenant_not_found',
    );
  });

  it('throws "tenant_ambiguous" when multiple tenants match', async () => {
    const auth = createMockAuth({ email: 'shared@example.com' });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({
      empty: false,
      size: 2,
      docs: [{ id: 'tenant-a' }, { id: 'tenant-b' }],
    } as any);

    await expect(resolveTenantFromAuth(auth, mockFirestore)).rejects.toThrow(
      'tenant_ambiguous',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('tenant-a'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('tenant-b'),
    );

    consoleSpy.mockRestore();
  });
});
