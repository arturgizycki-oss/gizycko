import { NextResponse } from "next/server";
import { getObject } from "@/lib/storage";

/** Parse a single "bytes=start-end" range. Anything odd is ignored. */
function parseRange(header: string | null, size: number) {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  let start: number;
  let end: number;

  if (rawStart === "") {
    // Suffix form: the last N bytes.
    const suffix = Number(rawEnd);
    if (suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start >= size) return null;

  return { start, end };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const object = await getObject(key.join("/"));

  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  const size = object.data.byteLength;
  const range = parseRange(request.headers.get("range"), size);

  const headers: Record<string, string> = {
    "Content-Type": object.contentType,
    "Cache-Control": "private, max-age=31536000, immutable",
    // Audio players need this to seek rather than re-download from the start.
    "Accept-Ranges": "bytes",
  };

  if (range) {
    const slice = object.data.subarray(range.start, range.end + 1);
    return new NextResponse(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(slice.byteLength),
      },
    });
  }

  return new NextResponse(new Uint8Array(object.data), {
    headers: { ...headers, "Content-Length": String(size) },
  });
}
