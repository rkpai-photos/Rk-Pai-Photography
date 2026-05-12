import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Single table that replaces the old Google Sheet. One row per photo.
// `slug` is the public id used in the /stories/[slug] route (was the sheet's `id` column).
// `imageId` references a file in Convex File Storage (was the sheet's `image_url`).
export default defineSchema({
  photos: defineTable({
    slug: v.string(),
    alt: v.string(),
    width: v.number(),
    height: v.number(),
    story: v.string(),
    imageId: v.id("_storage"),
    imageType: v.string(), // e.g. "jpeg", "png" — informational, mirrors the old column
    location: v.optional(v.string()),
    createdAt: v.string(), // ISO string, kept as text to match the old data shape
    order: v.number(), // explicit sort key for the galleries (ascending)
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),
});
