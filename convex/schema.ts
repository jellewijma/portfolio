import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    sessions: defineTable({
        token: v.string(),
        expiresAt: v.number(),
        createdAt: v.number(),
    }).index("by_token", ["token"]),
    photos: defineTable({
        title: v.string(),
        category: v.union(v.literal("car"), v.literal("landscape"), v.literal("street")),
        alt: v.string(),
        storageId: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        order: v.number(),
        published: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_published_order", ["published", "order"]),
    projects: defineTable({
        title: v.string(),
        description: v.string(),
        url: v.string(),
        imageStorageId: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        imageAlt: v.string(),
        featured: v.boolean(),
        order: v.number(),
        published: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_published_order", ["published", "order"]),
});
