export interface Series {
  id: string;
  slug: string;
  name: string;
  description?: string;
  /** null = pillar-free series; string = foreign key to Pillar.id */
  pillarId: string | null;
  /** Denormalized count of posts in this series. */
  postCount: number;
  isActive: boolean;
  /** Unix milliseconds. */
  createdAt: number;
  /** Unix milliseconds. */
  updatedAt: number;
}
