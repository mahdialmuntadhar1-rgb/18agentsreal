import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

type JWTPayload = {
  exp?: number;
  email?: string;
  sub?: string;
  user_metadata?: { email?: string };
  app_metadata?: { role?: string };
};

const DEFAULT_ALLOWED_EMAILS = [
  "mahdi@iraqcompass.iq",
  "admin@iraqcompass.iq",
];

const DEFAULT_ALLOWED_ORIGINS = [
  "https://iraq-compass.pages.dev",
  "https://iraqcompass.iq",
  "http://localhost:5173",
  "http://localhost:3000",
];

const PROTECTED_ROUTES = [
  "/api/agent/launch",
  "/api/agent/stop",
  "/api/agent/reset",
  "/api/export",
  "/api/admin",
];

const API_KEY_ROUTES = ["/api/internal/"];
const PUBLIC_ROUTES = ["/api/health", "/health", "/api/public/", "/favicon.ico"];

const rateLimitMap = new Map<string, number>();

function getAllowedEmails() {
  const configured = process.env.ALLOWED_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_ALLOWED_EMAILS;
}

function getAllowedOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function getCorsHeaders(req: Request) {
  const origin = req.header("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

function applyCorsHeaders(res: Response, corsHeaders: Record<string, string>) {
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
}

function jsonResponse(
  res: Response,
  status: number,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>
) {
  applyCorsHeaders(res, corsHeaders);
  res.status(status).json(body);
}

function unauthorizedResponse(res: Response, reason: string, corsHeaders: Record<string, string>) {
  jsonResponse(
    res,
    401,
    {
      error: "Unauthorized",
      reason,
      timestamp: new Date().toISOString(),
      hint: "This Command Center is private. Access is restricted.",
    },
    corsHeaders
  );
}

function rateLimitResponse(res: Response, corsHeaders: Record<string, string>) {
  jsonResponse(
    res,
    429,
    {
      error: "Too Many Requests",
      reason: "Rate limit exceeded. Try again in 60 seconds.",
    },
    { ...corsHeaders, "Retry-After": "60" }
  );
}

function isPublic(path: string) {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

function isInternal(path: string) {
  return API_KEY_ROUTES.some((route) => path.startsWith(route));
}

function isProtected(path: string) {
  return PROTECTED_ROUTES.some((route) => path.startsWith(route));
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const rateLimitPerMinute = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 30);
  const key = `${ip}:${Math.floor(now / windowMs)}`;

  const count = (rateLimitMap.get(key) ?? 0) + 1;
  rateLimitMap.set(key, count);

  if (rateLimitMap.size > 10000) {
    const cutoff = now - windowMs * 2;
    for (const [oldKey] of rateLimitMap) {
      const ts = Number.parseInt(oldKey.split(":")[1], 10) * windowMs;
      if (ts < cutoff) {
        rateLimitMap.delete(oldKey);
      }
    }
  }

  return count > rateLimitPerMinute;
}

function base64UrlToBuffer(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = normalized.length % 4;
  const padded = paddingLength === 0 ? normalized : normalized + "=".repeat(4 - paddingLength);
  return Buffer.from(padded, "base64");
}

function verifySupabaseJWT(token: string, jwtSecret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false as const, error: "Invalid JWT format" };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  try {
    const payload = JSON.parse(base64UrlToBuffer(payloadB64).toString("utf8")) as JWTPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false as const, error: "Token expired" };
    }

    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac("sha256", jwtSecret)
      .update(data)
      .digest("base64url");
    const providedSignature = Buffer.from(signatureB64);

    if (
      providedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(providedSignature, Buffer.from(expectedSignature))
    ) {
      return { valid: false as const, error: "Invalid signature" };
    }

    return { valid: true as const, payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token";
    return { valid: false as const, error: message };
  }
}

function extractClientIp(req: Request) {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) {
    const [firstIp] = forwarded.split(",");
    return firstIp.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function securityMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    const corsHeaders = getCorsHeaders(req);
    applyCorsHeaders(res, corsHeaders);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    const clientIp = extractClientIp(req);
    if (isRateLimited(clientIp)) {
      console.warn(`[RATE_LIMIT] IP blocked: ${clientIp}`);
      rateLimitResponse(res, corsHeaders);
      return;
    }

    if (isPublic(path) || !path.startsWith("/api")) {
      next();
      return;
    }

    if (isInternal(path)) {
      const providedKey = req.header("x-api-key");
      const expectedKey = process.env.INTERNAL_API_KEY;
      if (!providedKey || !expectedKey || providedKey !== expectedKey) {
        console.warn(`[INTERNAL_AUTH_FAIL] Path: ${path}, IP: ${clientIp}`);
        unauthorizedResponse(res, "Invalid internal API key", corsHeaders);
        return;
      }

      next();
      return;
    }

    if (!isProtected(path)) {
      next();
      return;
    }

    const authHeader = req.header("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.warn(`[NO_TOKEN] Path: ${path}, IP: ${clientIp}`);
      unauthorizedResponse(res, "No authorization token provided", corsHeaders);
      return;
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error("[CONFIG_ERROR] SUPABASE_JWT_SECRET not set.");
      jsonResponse(res, 500, { error: "Server misconfiguration" }, corsHeaders);
      return;
    }

    const verification = verifySupabaseJWT(token, jwtSecret);
    if (!verification.valid) {
      console.warn(`[INVALID_JWT] Path: ${path}, IP: ${clientIp}, Error: ${verification.error}`);
      unauthorizedResponse(res, `Invalid token: ${verification.error}`, corsHeaders);
      return;
    }

    const payload = verification.payload;
    const userEmail = payload.email ?? payload.user_metadata?.email ?? "";
    const allowedEmails = getAllowedEmails();
    if (!allowedEmails.includes(userEmail.toLowerCase())) {
      console.warn(`[EMAIL_BLOCKED] Email: ${userEmail || "unknown"}, Path: ${path}`);
      unauthorizedResponse(
        res,
        `Access denied. Your account (${userEmail || "unknown"}) is not authorized for this Command Center.`,
        corsHeaders
      );
      return;
    }

    req.headers["x-authenticated-email"] = userEmail;
    req.headers["x-authenticated-user-id"] = payload.sub ?? "";
    req.headers["x-auth-role"] = payload.app_metadata?.role ?? "user";
    console.info(`[ACCESS_GRANTED] Email: ${userEmail}, Path: ${path}`);
    next();
  };
}
