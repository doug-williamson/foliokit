export interface Pillar {
  id: string;
  slug: string;
  name: string;
  description?: string;
  /** Unix milliseconds. */
  createdAt: number;
  /** Unix milliseconds. */
  updatedAt: number;
}
