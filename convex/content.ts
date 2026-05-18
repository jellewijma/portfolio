import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const magicLinkDurationMs = 15 * 60 * 1000;

const categoryValidator = v.union(v.literal("car"), v.literal("landscape"), v.literal("street"));

async function sha256(value: string) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function requireSession(ctx: any, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .unique();

    if (!session || session.expiresAt < Date.now()) {
        throw new Error("Unauthorized");
    }
}

async function imageUrl(ctx: any, storageId?: string, fallbackUrl?: string) {
    if (storageId) {
        return await ctx.storage.getUrl(storageId);
    }

    return fallbackUrl || "";
}

export const requestMagicLink = mutationGeneric({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            throw new Error("ADMIN_EMAIL is not configured in Convex environment variables.");
        }

        const email = args.email.trim().toLowerCase();
        if (email !== adminEmail.trim().toLowerCase()) {
            return { sent: false };
        }

        const now = Date.now();
        const linkToken = crypto.randomUUID() + crypto.randomUUID();
        await ctx.db.insert("magicLinks", {
            tokenHash: await sha256(linkToken),
            email,
            createdAt: now,
            expiresAt: now + magicLinkDurationMs,
        });

        return { sent: true, email, token: linkToken, expiresAt: now + magicLinkDurationMs };
    },
});

export const verifyMagicLink = mutationGeneric({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const tokenHash = await sha256(args.token);
        const magicLink = await ctx.db
            .query("magicLinks")
            .withIndex("by_token_hash", (q: any) => q.eq("tokenHash", tokenHash))
            .unique();

        if (!magicLink || magicLink.usedAt || magicLink.expiresAt < Date.now()) {
            throw new Error("This sign-in link is invalid or expired.");
        }

        const now = Date.now();
        await ctx.db.patch(magicLink._id, { usedAt: now });

        const token = crypto.randomUUID();
        await ctx.db.insert("sessions", {
            token,
            createdAt: now,
            expiresAt: now + sessionDurationMs,
        });

        return { token, expiresAt: now + sessionDurationMs };
    },
});

export const validateSession = queryGeneric({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", (q: any) => q.eq("token", args.token))
            .unique();

        return Boolean(session && session.expiresAt >= Date.now());
    },
});

export const logout = mutationGeneric({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", (q: any) => q.eq("token", args.token))
            .unique();

        if (session) {
            await ctx.db.delete(session._id);
        }

        return { ok: true };
    },
});

export const listPublicContent = queryGeneric({
    args: {},
    handler: async (ctx) => {
        const photos = await ctx.db
            .query("photos")
            .withIndex("by_published_order", (q: any) => q.eq("published", true))
            .order("asc")
            .collect();
        const projects = await ctx.db
            .query("projects")
            .withIndex("by_published_order", (q: any) => q.eq("published", true))
            .order("asc")
            .collect();

        return {
            photos: await Promise.all(
                photos.map(async (photo: any) => ({
                    id: photo._id,
                    title: photo.title,
                    category: photo.category,
                    alt: photo.alt,
                    imageUrl: await imageUrl(ctx, photo.storageId, photo.imageUrl),
                    order: photo.order,
                }))
            ),
            projects: await Promise.all(
                projects.map(async (project: any) => ({
                    id: project._id,
                    title: project.title,
                    description: project.description,
                    url: project.url,
                    imageUrl: await imageUrl(ctx, project.imageStorageId, project.imageUrl),
                    imageAlt: project.imageAlt,
                    featured: project.featured,
                    order: project.order,
                }))
            ),
        };
    },
});

export const listAdminContent = queryGeneric({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        await requireSession(ctx, args.token);

        const photos = await ctx.db.query("photos").collect();
        const projects = await ctx.db.query("projects").collect();

        return {
            photos: await Promise.all(
                photos.map(async (photo: any) => ({
                    id: photo._id,
                    title: photo.title,
                    category: photo.category,
                    alt: photo.alt,
                    imageUrl: await imageUrl(ctx, photo.storageId, photo.imageUrl),
                    order: photo.order,
                    published: photo.published,
                }))
            ),
            projects: await Promise.all(
                projects.map(async (project: any) => ({
                    id: project._id,
                    title: project.title,
                    description: project.description,
                    url: project.url,
                    imageUrl: await imageUrl(ctx, project.imageStorageId, project.imageUrl),
                    imageAlt: project.imageAlt,
                    featured: project.featured,
                    order: project.order,
                    published: project.published,
                }))
            ),
        };
    },
});

export const createUploadUrl = mutationGeneric({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        await requireSession(ctx, args.token);

        return await ctx.storage.generateUploadUrl();
    },
});

export const savePhoto = mutationGeneric({
    args: {
        token: v.string(),
        id: v.optional(v.id("photos")),
        title: v.string(),
        category: categoryValidator,
        alt: v.string(),
        storageId: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        order: v.number(),
        published: v.boolean(),
    },
    handler: async (ctx, args) => {
        await requireSession(ctx, args.token);

        const now = Date.now();
        const fields: any = {
            title: args.title,
            category: args.category,
            alt: args.alt,
            order: args.order,
            published: args.published,
            updatedAt: now,
        };

        if (args.storageId) fields.storageId = args.storageId;
        if (args.imageUrl) fields.imageUrl = args.imageUrl;

        if (args.id) {
            await ctx.db.patch(args.id, fields);
            return { id: args.id };
        }

        const id = await ctx.db.insert("photos", { ...fields, createdAt: now });
        return { id };
    },
});

export const deletePhoto = mutationGeneric({
    args: { token: v.string(), id: v.id("photos") },
    handler: async (ctx, args) => {
        await requireSession(ctx, args.token);
        const photo = await ctx.db.get(args.id);

        if (photo?.storageId) {
            await ctx.storage.delete(photo.storageId);
        }

        await ctx.db.delete(args.id);
        return { ok: true };
    },
});

export const saveProject = mutationGeneric({
    args: {
        token: v.string(),
        id: v.optional(v.id("projects")),
        title: v.string(),
        description: v.string(),
        url: v.string(),
        imageStorageId: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        imageAlt: v.string(),
        featured: v.boolean(),
        order: v.number(),
        published: v.boolean(),
    },
    handler: async (ctx, args) => {
        await requireSession(ctx, args.token);

        const now = Date.now();
        const fields: any = {
            title: args.title,
            description: args.description,
            url: args.url,
            imageAlt: args.imageAlt,
            featured: args.featured,
            order: args.order,
            published: args.published,
            updatedAt: now,
        };

        if (args.imageStorageId) fields.imageStorageId = args.imageStorageId;
        if (args.imageUrl) fields.imageUrl = args.imageUrl;

        if (args.id) {
            await ctx.db.patch(args.id, fields);
            return { id: args.id };
        }

        const id = await ctx.db.insert("projects", { ...fields, createdAt: now });
        return { id };
    },
});

export const deleteProject = mutationGeneric({
    args: { token: v.string(), id: v.id("projects") },
    handler: async (ctx, args) => {
        await requireSession(ctx, args.token);
        const project = await ctx.db.get(args.id);

        if (project?.imageStorageId) {
            await ctx.storage.delete(project.imageStorageId);
        }

        await ctx.db.delete(args.id);
        return { ok: true };
    },
});
