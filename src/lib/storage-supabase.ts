import { contentTypeFor, type StoredObject } from "./storage-types";

/**
 * Supabase Storage over its REST API.
 *
 * Called with the service role key, which bypasses row-level security, so the
 * bucket itself stays private and nothing is reachable without going through
 * this application first. That key must never reach the browser: everything
 * here runs on the server.
 *
 * Plain fetch rather than the Supabase SDK. Four calls do not justify a
 * dependency, and it keeps the serverless bundle small.
 */

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

  if (!url || !key) {
    throw new Error(
      "STORAGE_DRIVER=supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return { base: `${url.replace(/\/+$/, "")}/storage/v1`, key, bucket };
}

/** Percent-encode each segment, leaving the slashes that shape the path. */
function encodeKey(key: string): string {
  return key.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function objectUrl(key: string): string {
  const { base, bucket } = config();
  return `${base}/object/${bucket}/${encodeKey(key)}`;
}

/*
 * Both headers, deliberately.
 *
 * Supabase's newer keys (sb_secret_...) are not JWTs, and Storage rejects them
 * in Authorization alone with "Invalid Compact JWS". It accepts them as
 * apikey. The older service_role keys are JWTs and work either way, so sending
 * both covers a project of either vintage.
 */
function authHeader(): Record<string, string> {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  const response = await fetch(objectUrl(key), {
    method: "POST",
    headers: {
      ...authHeader(),
      "Content-Type": contentTypeFor(key),
      // Re-uploading the same key replaces it rather than failing.
      "x-upsert": "true",
      "Cache-Control": "31536000",
    },
    body: new Uint8Array(data),
  });

  if (!response.ok) {
    throw new Error(
      `Upload failed (${response.status}): ${await response.text()}`,
    );
  }
}

export async function statObject(key: string): Promise<StoredObject | null> {
  const response = await fetch(objectUrl(key), {
    method: "HEAD",
    headers: authHeader(),
  });

  if (!response.ok) return null;

  const size = Number(response.headers.get("content-length"));
  if (!Number.isFinite(size)) return null;

  return {
    size,
    // Trust our own extension over whatever the bucket recorded.
    contentType: contentTypeFor(key),
  };
}

export async function streamObject(
  key: string,
  range?: { start: number; end: number },
): Promise<ReadableStream<Uint8Array>> {
  const headers: Record<string, string> = authHeader();
  if (range) headers.Range = `bytes=${range.start}-${range.end}`;

  const response = await fetch(objectUrl(key), { headers });

  if (!response.ok || !response.body) {
    throw new Error(`Read failed (${response.status}) for ${key}`);
  }

  return response.body;
}

export async function deleteObject(key: string): Promise<void> {
  const response = await fetch(objectUrl(key), {
    method: "DELETE",
    headers: authHeader(),
  });

  // 404 means somebody already removed it; deleting stays idempotent.
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Delete failed (${response.status}): ${await response.text()}`,
    );
  }
}

/**
 * A one-shot URL the browser can upload to directly.
 *
 * Serverless request bodies are capped at a few megabytes, so a thirty-megabyte
 * video cannot travel through a Server Action. The server decides the key and
 * signs permission for it; the bytes go straight from the browser to the
 * bucket and never touch the application.
 */
export async function signedUploadUrl(
  key: string,
): Promise<{ url: string; token: string }> {
  const { base, bucket } = config();

  const response = await fetch(
    `${base}/object/upload/sign/${bucket}/${encodeKey(key)}`,
    { method: "POST", headers: authHeader() },
  );

  if (!response.ok) {
    throw new Error(
      `Could not sign an upload (${response.status}): ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { url?: string; token?: string };
  if (!body.url || !body.token) {
    throw new Error("Supabase returned no upload URL");
  }

  // The response gives a path such as "/object/upload/sign/media/<key>?token=",
  // sometimes already carrying the API prefix. Join without doubling it.
  const path = body.url.replace(/^\/storage\/v1/, "");
  return { url: `${base}${path}`, token: body.token };
}
