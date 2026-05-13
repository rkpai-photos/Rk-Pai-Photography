import type { Id } from "../../../../convex/_generated/dataModel";

/** Shape returned by `api.photos.list` — Doc<"photos"> with `imageId` resolved
 *  to `imageUrl` and the `_id` retained. */
export type PhotoRow = {
  _id: Id<"photos">;
  slug: string;
  alt: string;
  width: number;
  height: number;
  story: string;
  imageUrl: string | null;
  imageType: string;
  location?: string;
  createdAt: string;
  order: number;
};
