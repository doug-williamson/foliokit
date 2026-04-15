export interface Series {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description?: string;
  tenantId?: string;
  /** Denormalized count of posts in this series. */
  postCount: number;
  isActive: boolean;
  /** Unix milliseconds. */
  createdAt: number;
  /** Unix milliseconds. */
  updatedAt: number;
}
