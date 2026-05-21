import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomBytes, createHash } from "node:crypto";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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
const mcpSessions = new Map<string, { transport: StreamableHTTPServerTransport }>();

function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function sha256base64url(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createHttpApp(opts: HttpAppOptions): express.Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // RFC 8414 Authorization Server Metadata
  app.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      registration_endpoint: `${ISSUER}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
  });

  // RFC 7591 Dynamic Client Registration
  app.post("/register", (req, res) => {
    const { redirect_uris, client_name, token_endpoint_auth_method } =
      req.body as Record<string, unknown>;
    if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      res.status(400).json({
        error: "invalid_client_metadata",
        error_description: "redirect_uris is required",
      });
      return;
    }
    const clientId = generateToken(16);
    res.status(201).json({
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris,
      client_name: client_name ?? "MCP Client",
      token_endpoint_auth_method: token_endpoint_auth_method ?? "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    });
  });

  // OAuth: redirect user to GetMonitor console login
  app.get("/authorize", (req, res) => {
    const { client_id, redirect_uri, state, code_challenge } =
      req.query as Record<string, string>;
    if (!redirect_uri || !state || !code_challenge) {
      res.status(400).json({
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

  // Middleware: validate MCP access token — supports both OAuth tokens (tokenStore)
  // and raw Better Auth session tokens (validated via API session check).
  async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({
        error: "unauthorized",
        error_description: "Bearer token required",
      });
      return;
    }
    const bearer = auth.slice(7);

    // Path 1: OAuth token from tokenStore (existing flow)
    const entry = tokenStore.get(bearer);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        (req as unknown as Record<string, unknown>).sessionToken = entry.sessionToken;
        return next();
      }
      tokenStore.delete(bearer); // evict stale entry eagerly
    }

    // Path 2: Raw Better Auth session token (AI service → MCP)
    try {
      const sessionResp = await fetch(`${opts.apiUrl}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${bearer}` },
      });
      if (sessionResp.ok) {
        (req as unknown as Record<string, unknown>).sessionToken = bearer;
        return next();
      }
    } catch {
      // fall through to 401
    }

    res.status(401).json({ error: "invalid_token", error_description: "Token expired or not found" });
  }

  // MCP Streamable HTTP endpoint
  app.all("/mcp", requireAuth, async (req, res) => {
    const { StreamableHTTPServerTransport } =
      await import("@modelcontextprotocol/sdk/server/streamableHttp.js");

    const incomingSessionId = req.headers["mcp-session-id"] as string | undefined;

    // Reuse existing session
    if (incomingSessionId && mcpSessions.has(incomingSessionId)) {
      const { transport } = mcpSessions.get(incomingSessionId)!;
      await transport.handleRequest(
        req,
        res,
        req.method === "POST" ? req.body : undefined,
      );
      return;
    }

    // New session
    const sessionToken = (req as unknown as Record<string, unknown>)
      .sessionToken as string;
    const tempClient = new GetMonitorClient({ baseUrl: opts.apiUrl, token: sessionToken });
    let organizationId: string | undefined;
    try {
      const orgs = await tempClient.get<Array<{ id: string }>>('/api/v1/organizations');
      organizationId = orgs[0]?.id;
    } catch {
      // proceed without org ID — tools scoped to explicit IDs still work
    }
    const apiClient = new GetMonitorClient({
      baseUrl: opts.apiUrl,
      token: sessionToken,
      organizationId,
    });
    const mcpServer = createServer(apiClient);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => generateToken(16),
    });
    transport.onclose = () => {
      if (transport.sessionId) mcpSessions.delete(transport.sessionId);
    };
    await mcpServer.connect(transport);
    await transport.handleRequest(
      req,
      res,
      req.method === "POST" ? req.body : undefined,
    );
    if (transport.sessionId) {
      mcpSessions.set(transport.sessionId, { transport });
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
  const PORT = parseInt(process.env.PORT ?? "3004", 10);
  const app = createHttpApp({
    apiUrl: process.env.GETMONITOR_API_URL ?? "https://api.getmonitor.io",
    appUrl: process.env.GETMONITOR_APP_URL ?? "https://console.getmonitor.io",
  });
  app.listen(PORT, () =>
    console.log(`[GetMonitor MCP Full] HTTP server on :${PORT}`),
  );
}
