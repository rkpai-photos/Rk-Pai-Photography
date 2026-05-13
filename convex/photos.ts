import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------
// Reads (`list`, `getBySlug`) are public — the site is public.
// Writes require a signed-in Convex Auth user whose email is on the
// `ADMIN_EMAILS` allow-list (a comma-separated Convex env var, e.g.
// `npx convex env set ADMIN_EMAILS "you@example.com"`). Being authenticated is
// necessary but NOT sufficient — the email check is the actual gate, so a stray
// signed-up account can't touch photos.
async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) {
    throw new Error(
      "ADMIN_EMAILS is not configured on the Convex deployment. Run: npx convex env set ADMIN_EMAILS <your-email>",
    );
  }

  const user = await ctx.db.get(userId);
  const email = (user as Doc<"users"> | null)?.email?.toLowerCase();
  if (!email || !allow.includes(email)) throw new Error("Not authorized");
}

// ---------------------------------------------------------------------------
// Public-facing photo shape: storage ids resolved to URLs so the frontend never
// has to think about Convex storage.
// ---------------------------------------------------------------------------
type PublicPhoto = Omit<Doc<"photos">, "imageId"> & { imageUrl: string | null };

async function toPublic(ctx: QueryCtx, doc: Doc<"photos">): Promise<PublicPhoto> {
  const { imageId, ...rest } = doc;
  return { ...rest, imageUrl: await ctx.storage.getUrl(imageId) };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// Replaces fetchFromGoogleSheet() / fetchPhotos(): every photo, ascending by `order`.
// A portfolio's photo set is conceptually bounded; `.collect()` is the intended
// behavior here (we render the whole gallery).
export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("photos").withIndex("by_order").collect();
    return Promise.all(docs.map((d) => toPublic(ctx, d)));
  },
});

// Replaces the `photos.find(p => p.id === params.id)` in /stories/[id].
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const doc = await ctx.db
      .query("photos")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    return doc ? toPublic(ctx, doc) : null;
  },
});

// ---------------------------------------------------------------------------
// Mutations (admin only)
// ---------------------------------------------------------------------------

// Step 1 of an upload: the client POSTs the file bytes to the returned URL,
// gets back a storageId, then calls `create` (or `update`) with it.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    alt: v.string(),
    width: v.number(),
    height: v.number(),
    story: v.string(),
    imageId: v.id("_storage"),
    imageType: v.string(),
    location: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const existing = await ctx.db
      .query("photos")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`A photo with slug "${args.slug}" already exists`);

    let order = args.order;
    if (order === undefined) {
      const last = await ctx.db.query("photos").withIndex("by_order").order("desc").first();
      order = last ? last.order + 1 : 0;
    }

    return await ctx.db.insert("photos", {
      slug: args.slug,
      alt: args.alt,
      width: args.width,
      height: args.height,
      story: args.story,
      imageId: args.imageId,
      imageType: args.imageType,
      location: args.location,
      createdAt: args.createdAt ?? new Date().toISOString(),
      order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("photos"),
    slug: v.optional(v.string()),
    alt: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    story: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    imageType: v.optional(v.string()),
    location: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const { id, ...patch } = args;

    const current = await ctx.db.get(id);
    if (!current) throw new Error("Photo not found");

    if (patch.slug && patch.slug !== current.slug) {
      const clash = await ctx.db
        .query("photos")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug!))
        .unique();
      if (clash) throw new Error(`A photo with slug "${patch.slug}" already exists`);
    }

    // Strip undefined keys so we don't overwrite required fields with `undefined`.
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) clean[k] = val;
    }

    // If the image is being replaced, drop the old file so storage doesn't leak.
    if (patch.imageId && patch.imageId !== current.imageId) {
      await ctx.storage.delete(current.imageId);
    }

    await ctx.db.patch(id, clean as Partial<Doc<"photos">>);
  },
});

export const remove = mutation({
  args: { id: v.id("photos") },
  handler: async (ctx, { id }) => {
    await assertAdmin(ctx);
    const doc = await ctx.db.get(id);
    if (!doc) return;
    await ctx.storage.delete(doc.imageId);
    await ctx.db.delete(id);
  },
});

// Reorder helper for the admin UI (pass the full ordered list of photo ids).
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("photos")) },
  handler: async (ctx, { orderedIds }) => {
    await assertAdmin(ctx);
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i });
    }
  },
});
