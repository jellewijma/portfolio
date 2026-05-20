import { anyApi, httpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";

const http = httpRouter();

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });
}

function errorResponse(error: unknown, status = 400) {
    return json({ error: error instanceof Error ? error.message : "Request failed." }, status);
}

async function readJson(request: Request) {
    if (request.headers.get("content-length") === "0") {
        return {};
    }

    return await request.json();
}

function tokenFromRequest(request: Request) {
    const header = request.headers.get("authorization") || "";

    if (!header.startsWith("Bearer ")) {
        throw new Error("Missing Authorization bearer token.");
    }

    return header.slice("Bearer ".length);
}

function requiredEnv(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is not configured in Convex environment variables.`);
    }

    return value;
}

function magicLinkUrl(token: string) {
    const siteUrl = requiredEnv("ADMIN_SITE_URL").replace(/\/$/, "");
    return `${siteUrl}/admin.html?token=${encodeURIComponent(token)}`;
}

function magicLinkEmailHtml(link: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark light">
    <meta name="supported-color-schemes" content="dark light">
    <title>Your portfolio admin sign-in link</title>
</head>
<body style="margin:0; padding:0; background:#050505; color:#ffffff; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
        Use this one-time link to sign in to your portfolio admin. It expires in 15 minutes.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; background:#050505;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; max-width:640px; border:1px solid rgba(255,255,255,0.16); border-collapse:collapse; background:#000000;">
                    <tr>
                        <td style="padding:28px 28px 24px; border-bottom:1px solid rgba(255,255,255,0.16);">
                            <div style="font-size:16px; line-height:22px; font-weight:700; letter-spacing:0.08em; color:#ffffff;">JelleWijma</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 28px 28px;">
                            <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.26em; text-transform:uppercase; color:rgba(255,255,255,0.58);">
                                Portfolio admin
                            </div>
                            <h1 style="margin:18px 0 0; font-size:42px; line-height:44px; font-weight:700; letter-spacing:0; color:#ffffff;">
                                Sign in to manage your portfolio.
                            </h1>
                            <p style="margin:24px 0 0; max-width:480px; font-size:16px; line-height:26px; color:rgba(255,255,255,0.78);">
                                Use the secure one-time link below to open the admin panel for gallery photos and projects.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 36px;">
                            <a href="${link}" style="display:inline-block; border:1px solid #ffffff; padding:16px 22px; color:#ffffff; font-size:13px; line-height:16px; font-weight:700; letter-spacing:0.2em; text-decoration:none; text-transform:uppercase;">
                                Sign in
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 40px;">
                            <p style="margin:0; font-size:13px; line-height:22px; color:rgba(255,255,255,0.58);">
                                This link expires in 15 minutes and can only be used once. If you did not request it, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

async function sendMagicLinkEmail(email: string, link: string) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.MAGIC_LINK_FROM || "Portfolio Admin <onboarding@resend.dev>",
            to: email,
            subject: "Your portfolio admin sign-in link",
            html: magicLinkEmailHtml(link),
            text: `Use this link to sign in to your portfolio admin:\n\n${link}\n\nThis link expires in 15 minutes and can only be used once.`,
        }),
    });

    if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(details || "Failed to send sign-in email.");
    }
}

const optionsHandler = httpActionGeneric(async () => new Response(null, { status: 204, headers: corsHeaders }));

for (const path of [
    "/api/content",
    "/api/admin/content",
    "/api/login",
    "/api/login/verify",
    "/api/logout",
    "/api/upload-url",
    "/api/photos",
    "/api/photos/delete",
    "/api/home-images",
    "/api/projects",
    "/api/projects/delete",
]) {
    http.route({ path, method: "OPTIONS", handler: optionsHandler });
}

http.route({
    path: "/api/content",
    method: "GET",
    handler: httpActionGeneric(async (ctx) => {
        const content = await ctx.runQuery(anyApi.content.listPublicContent, {});
        return json(content);
    }),
});

http.route({
    path: "/api/admin/content",
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const content = await ctx.runQuery(anyApi.content.listAdminContent, {
                token: tokenFromRequest(request),
            });
            return json(content);
        } catch (error) {
            return errorResponse(error, 401);
        }
    }),
});

http.route({
    path: "/api/login",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const result = await ctx.runMutation(anyApi.content.requestMagicLink, { email: body.email || "" });

            if (result.sent) {
                await sendMagicLinkEmail(result.email, magicLinkUrl(result.token));
            }

            return json({ ok: true });
        } catch (error) {
            return errorResponse(error, 400);
        }
    }),
});

http.route({
    path: "/api/login/verify",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const session = await ctx.runMutation(anyApi.content.verifyMagicLink, { token: body.token || "" });
            return json(session);
        } catch (error) {
            return errorResponse(error, 401);
        }
    }),
});

http.route({
    path: "/api/logout",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const result = await ctx.runMutation(anyApi.content.logout, { token: tokenFromRequest(request) });
            return json(result);
        } catch (error) {
            return errorResponse(error, 401);
        }
    }),
});

http.route({
    path: "/api/upload-url",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const uploadUrl = await ctx.runMutation(anyApi.content.createUploadUrl, {
                token: tokenFromRequest(request),
            });
            return json({ uploadUrl });
        } catch (error) {
            return errorResponse(error, 401);
        }
    }),
});

http.route({
    path: "/api/photos",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const result = await ctx.runMutation(anyApi.content.savePhoto, {
                ...body,
                token: tokenFromRequest(request),
            });
            return json(result);
        } catch (error) {
            return errorResponse(error);
        }
    }),
});

http.route({
    path: "/api/photos/delete",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const result = await ctx.runMutation(anyApi.content.deletePhoto, {
                id: body.id,
                token: tokenFromRequest(request),
            });
            return json(result);
        } catch (error) {
            return errorResponse(error);
        }
    }),
});

http.route({
    path: "/api/home-images",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const result = await ctx.runMutation(anyApi.content.saveHomeImage, {
                ...body,
                token: tokenFromRequest(request),
            });
            return json(result);
        } catch (error) {
            return errorResponse(error);
        }
    }),
});

http.route({
    path: "/api/projects",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const result = await ctx.runMutation(anyApi.content.saveProject, {
                ...body,
                token: tokenFromRequest(request),
            });
            return json(result);
        } catch (error) {
            return errorResponse(error);
        }
    }),
});

http.route({
    path: "/api/projects/delete",
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
        try {
            const body = await readJson(request);
            const result = await ctx.runMutation(anyApi.content.deleteProject, {
                id: body.id,
                token: tokenFromRequest(request),
            });
            return json(result);
        } catch (error) {
            return errorResponse(error);
        }
    }),
});

export default http;
