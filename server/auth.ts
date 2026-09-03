import * as client from "openid-client";
import type { Configuration, TokenEndpointResponseHelpers } from "openid-client";
import { randomBytes } from "node:crypto";
import db, { ensureGenesisRow } from "./db.js";
import type { User, SessionUser } from "../shared/types.js";

let oidcConfig: Configuration | null = null;
let discoveryError: string | null = null;

const issuerUrl = process.env.OIDC_ISSUER;
const clientId = process.env.OIDC_CLIENT_ID;
const clientSecret = process.env.OIDC_CLIENT_SECRET;

export function getOidcConfig(): Configuration | null {
  return oidcConfig;
}

export function getDiscoveryError(): string | null {
  return discoveryError;
}

export async function initOidc(): Promise<void> {
  if (!issuerUrl || !clientId || !clientSecret) {
    discoveryError = "Missing OIDC configuration.";
    console.warn(
      "OIDC not configured — set OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, and either APP_URL or OIDC_REDIRECT_URL",
    );
    return;
  }

  try {
    oidcConfig = await client.discovery(
      new URL(issuerUrl),
      clientId,
      undefined,
      client.ClientSecretPost(clientSecret),
    );
    console.log(`OIDC client initialized for issuer: ${issuerUrl}`);
  } catch (err) {
    discoveryError = `OIDC discovery failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(discoveryError);
  }
}

interface StoredParams {
  state: string;
  nonce: string;
  codeVerifier: string;
}

const pendingStates = new Map<string, StoredParams>();

export async function generateAuthUrl(): Promise<string> {
  if (!oidcConfig) {
    throw new Error("OIDC client not initialized");
  }

  const state = client.randomState();
  const nonce = client.randomNonce();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

  const params: Record<string, string> = {
    scope: "openid profile email",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  };

  const appUrl = process.env.APP_URL;
  const redirectUri =
    appUrl ? `${appUrl.replace(/\/+$/, "")}/api/auth/callback`
    : process.env.OIDC_REDIRECT_URL;
  if (redirectUri) {
    params.redirect_uri = redirectUri;
  }

  const url = client.buildAuthorizationUrl(oidcConfig, params);

  pendingStates.set(state, { state, nonce, codeVerifier });
  return url.toString();
}

export function consumeState(state: string): StoredParams | undefined {
  const result = pendingStates.get(state);
  pendingStates.delete(state);
  return result;
}

export async function handleCallback(
  currentUrl: URL,
  stored: StoredParams,
): Promise<SessionUser> {
  if (!oidcConfig) {
    throw new Error("OIDC client not initialized");
  }

  const tokenSet = (await client.authorizationCodeGrant(
    oidcConfig,
    currentUrl,
    {
      expectedState: stored.state,
      expectedNonce: stored.nonce,
      pkceCodeVerifier: stored.codeVerifier,
    },
  )) as TokenEndpointResponseHelpers;

  const claims = tokenSet.claims();
  if (!claims) {
    throw new Error("No claims in ID token");
  }

  const sub = claims.sub;
  if (!sub) {
    throw new Error("No sub claim in ID token");
  }

  const email = (claims.email as string) ?? `${sub}@unknown`;
  const name = (claims.name as string) ?? email.split("@")[0] ?? sub;
  const picture = (claims.picture as string) ?? null;
  const preferredUsername = (claims.preferred_username as string) ?? null;
  let username: string;
  if (preferredUsername) {
    username = preferredUsername;
  } else {
    username = name.toLowerCase().replace(/\s+/g, "-");
  }

  const user = upsertUser(sub, email, name, username, picture);
  maybeBootstrapBricks(user);

  return { id: user.id, email: user.email };
}

export function upsertUser(
  sub: string,
  email: string,
  displayName: string,
  username: string,
  avatarUrl: string | null,
): User {
  const existing = db
    .prepare("SELECT id, email, display_name, username, avatar_url FROM users WHERE sub = ?")
    .get(sub) as
    | { id: number; email: string; display_name: string; username: string; avatar_url: string | null }
    | undefined;

  if (existing) {
    db.prepare(
      "UPDATE users SET email = ?, display_name = ?, username = ?, avatar_url = ? WHERE id = ?",
    ).run(email, displayName, username, avatarUrl, existing.id);
    return {
      id: existing.id,
      sub,
      email,
      displayName,
      username,
      avatarUrl,
      createdAt: 0,
    };
  }

  const now = Date.now();
  const result = db
    .prepare(
      "INSERT INTO users (sub, email, display_name, username, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(sub, email, displayName, username, avatarUrl, now);

  return {
    id: Number(result.lastInsertRowid),
    sub,
    email,
    displayName,
    username,
    avatarUrl,
    createdAt: now,
  };
}

export function maybeBootstrapBricks(user: User): void {
  const count = db
    .prepare("SELECT COUNT(*) as count FROM brick_state")
    .get() as { count: number };

  if (count.count > 0) return;

  const redOwner = process.env.OIDC_OWNER_RED;
  const blueOwner = process.env.OIDC_OWNER_BLUE;

  if (redOwner && redOwner === user.sub) {
    db.prepare(
      "INSERT INTO brick_state (color, holder_id, updated_at) VALUES (?, ?, ?)",
    ).run("red", user.id, Date.now());
    ensureGenesisRow("red", user.id);
    console.log(`Bootstrapped red brick → ${user.displayName} (${user.sub})`);
  }

  if (blueOwner && blueOwner === user.sub) {
    db.prepare(
      "INSERT INTO brick_state (color, holder_id, updated_at) VALUES (?, ?, ?)",
    ).run("blue", user.id, Date.now());
    ensureGenesisRow("blue", user.id);
    console.log(`Bootstrapped blue brick → ${user.displayName} (${user.sub})`);
  }
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET environment variable is required in production. Generate with: openssl rand -hex 32",
      );
    }
    console.warn("SESSION_SECRET not set — using random dev secret");
    return randomBytes(32).toString("hex");
  }
  return secret;
}

export interface DevTestUser {
  sub: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export const DEV_TEST_USERS: DevTestUser[] = [
  { sub: "dev:yann", email: "yann@example.com", displayName: "Yann", username: "yann", avatarUrl: null },
  { sub: "dev:anselme", email: "anselme@example.com", displayName: "Anselme", username: "anselme", avatarUrl: null },
  { sub: "dev:thomas", email: "thomas@example.com", displayName: "Thomas", username: "thomas", avatarUrl: null },
];

export function isDevLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.DEV_LOGIN !== "false";
}

export function seedDevUsers(): void {
  for (const user of DEV_TEST_USERS) {
    upsertUser(user.sub, user.email, user.displayName, user.username, user.avatarUrl);
  }
  console.log(`Seeded ${DEV_TEST_USERS.length} dev test users`);
}

export function bootstrapDevBricks(): void {
  const count = db
    .prepare("SELECT COUNT(*) as count FROM brick_state")
    .get() as { count: number };

  if (count.count > 0) return;

  const owners: Array<{ color: "red" | "blue"; username: string }> = [
    { color: "red", username: "yann" },
    { color: "blue", username: "thomas" },
  ];

  for (const owner of owners) {
    const devUser = DEV_TEST_USERS.find((u) => u.username === owner.username);
    if (!devUser) continue;
    const user = db
      .prepare("SELECT id FROM users WHERE sub = ?")
      .get(devUser.sub) as { id: number } | undefined;
    if (!user) continue;
    db.prepare(
      "INSERT INTO brick_state (color, holder_id, updated_at) VALUES (?, ?, ?)",
    ).run(owner.color, user.id, Date.now());
    ensureGenesisRow(owner.color, user.id);
    console.log(`Bootstrapped ${owner.color} brick → ${devUser.displayName}`);
  }
}

export function getDevTestUsers(): Array<{ username: string; displayName: string }> {
  return DEV_TEST_USERS.map((u) => ({ username: u.username, displayName: u.displayName }));
}

export function findDevTestUser(username: string): DevTestUser | undefined {
  return DEV_TEST_USERS.find((u) => u.username === username);
}

export interface AuthMeResponse {
  user: {
    id: number;
    email: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  users: Array<{ id: number; displayName: string; username: string; avatarUrl: string | null }>;
}

export function getAuthMe(userId: number): AuthMeResponse {
  const currentUser = db
    .prepare("SELECT id, email, display_name, username, avatar_url FROM users WHERE id = ?")
    .get(userId) as
    | { id: number; email: string; display_name: string; username: string; avatar_url: string | null }
    | undefined;

  if (!currentUser) {
    throw new Error("User not found");
  }

  const allUsers = db
    .prepare("SELECT id, display_name, username, avatar_url FROM users ORDER BY display_name")
    .all() as Array<{
    id: number;
    display_name: string;
    username: string;
    avatar_url: string | null;
  }>;

  return {
    user: {
      id: currentUser.id,
      email: currentUser.email,
      displayName: currentUser.display_name,
      username: currentUser.username,
      avatarUrl: currentUser.avatar_url,
    },
    users: allUsers.map((u) => ({
      id: u.id,
      displayName: u.display_name,
      username: u.username,
      avatarUrl: u.avatar_url,
    })),
  };
}