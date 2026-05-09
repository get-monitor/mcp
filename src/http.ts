import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomBytes, createHash } from "node:crypto";
import { GetMonitorClient } from "./client/api-client.js";
import { createServer } from "./server.js";

const ISSUER = "https://mcp.getmonitor.io";

interface HttpAppOptions {
  apiUrl: string;
  appUrl: string;
}

// In-memory stores — replace with Redis in production
const tokenStore = new Map<
  string,
  { sessionToken: string; expiresAt: number }
>();
const pkceStore = new Map<
  string,
  { redirectUri: string; clientId: string; codeChallenge: string }
>();
const authCodeStore = new Map<
  string,
  { sessionToken: string; expiresAt: number; codeChallenge: string }
>();

function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function sha256base64url(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createHttpApp(opts: HttpAppOptions): express.Express {
  const app = express();
  app.use(express.json());

  // RFC 8414 Authorization Server Metadata
  app.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
  });

  // OAuth: redirect user to GetMonitor console login
  app.get("/authorize", (req, res) => {
    const { client_id, redirect_uri, state, code_challenge } =
      req.query as Record<string, string>;
    if (!redirect_uri || !state || !code_challenge) {
      res
        .status(400)
        .json({
          error: "invalid_request",
          error_description: "Missing required params",
        });
      return;
    }
    pkceStore.set(state, {
      redirectUri: redirect_uri,
      clientId: client_id ?? "unknown",
      codeChallenge: code_challenge,
    });
    const loginUrl = new URL(`${opts.appUrl}/login`);
    loginUrl.searchParams.set("mcp_callback", `${ISSUER}/callback`);
    loginUrl.searchParams.set("state", state);
    res.redirect(loginUrl.toString());
  });

  // OAuth: GetMonitor console redirects here after login with a session token
  app.get("/callback", (req, res) => {
    const { session_token, state } = req.query as Record<string, string>;
    const pkce = pkceStore.get(state ?? "");
    if (!pkce || !session_token) {
      res.status(400).json({ error: "invalid_request" });
      return;
    }
    pkceStore.delete(state);
    const code = generateToken(24);
    authCodeStore.set(code, {
      sessionToken: session_token,
      expiresAt: Date.now() + 60_000,
      codeChallenge: pkce.codeChallenge,
    });
    const redirect = new URL(pkce.redirectUri);
    redirect.searchParams.set("code", code);
    redirect.searchParams.set("state", state);
    res.redirect(redirect.toString());
  });

  // OAuth: Exchange auth code for MCP access token
  app.post("/token", (req, res) => {
    const { code, grant_type, code_verifier } = req.body as Record<
      string,
      string
    >;
    if (grant_type !== "authorization_code" || !code) {
      res.status(400).json({ error: "invalid_request" });
      return;
    }
    const entry = authCodeStore.get(code);
    if (!entry || Date.now() > entry.expiresAt) {
      authCodeStore.delete(code);
      res.status(400).json({ error: "invalid_grant" });
      return;
    }
    if (
      !code_verifier ||
      sha256base64url(code_verifier) !== entry.codeChallenge
    ) {
      authCodeStore.delete(code);
      res.status(400).json({ error: "invalid_grant" });
      return;
    }
    authCodeStore.delete(code);
    const accessToken = generateToken();
    tokenStore.set(accessToken, {
      sessionToken: entry.sessionToken,
      expiresAt: Date.now() + 86_400_000,
    });
    res.json({
      access_token: accessToken,
      token_type: "bearer",
      expires_in: 86400,
    });
  });

  // Middleware: validate MCP access token (in-memory only)
  function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({
          error: "unauthorized",
          error_description: "Bearer token required",
        });
      return;
    }
    const accessToken = auth.slice(7);
    const entry = tokenStore.get(accessToken);
    if (!entry || Date.now() > entry.expiresAt) {
      tokenStore.delete(accessToken);
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    (req as unknown as Record<string, unknown>).sessionToken =
      entry.sessionToken;
    next();
  }

  // MCP Streamable HTTP endpoint
  app.all("/mcp", requireAuth, async (req, res) => {
    const { StreamableHTTPServerTransport } =
      await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
    const sessionToken = (req as unknown as Record<string, unknown>)
      .sessionToken as string;
    const apiClient = new GetMonitorClient({
      baseUrl: opts.apiUrl,
      token: sessionToken,
    });
    const mcpServer = createServer(apiClient);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => generateToken(16),
    });
    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(
        req,
        res,
        req.method === "POST" ? req.body : undefined,
      );
    } finally {
      await mcpServer.close().catch(() => {});
    }
  });

  // Cleanup: evict expired entries from in-memory stores every hour
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of tokenStore)
      if (v.expiresAt < now) tokenStore.delete(k);
    for (const [k, v] of authCodeStore)
      if (v.expiresAt < now) authCodeStore.delete(k);
  }, 3_600_000);
  cleanupInterval.unref(); // don't block process exit

  return app;
}

// Run as server when executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const PORT = parseInt(process.env.PORT ?? "3002", 10);
  const app = createHttpApp({
    apiUrl: process.env.GETMONITOR_API_URL ?? "https://api.getmonitor.io",
    appUrl: process.env.GETMONITOR_APP_URL ?? "https://console.getmonitor.io",
  });
  app.listen(PORT, () =>
    console.log(`[GetMonitor MCP Full] HTTP server on :${PORT}`),
  );
}
