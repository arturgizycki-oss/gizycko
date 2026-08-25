import { NextResponse } from "next/server";
import { statObject, streamObject } from "@/lib/storage";

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
  const name = key.join("/");

  // statObject returns null both for a missing file and for a key trying to
  // climb out of the storage root.
  const object = await statObject(name);
  if (!object) return new NextResponse("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": object.contentType,
    "Cache-Control": "private, max-age=31536000, immutable",
    // Audio and video players need this to seek rather than re-download.
    "Accept-Ranges": "bytes",
  };

  const range = parseRange(request.headers.get("range"), object.size);

  if (range) {
    return new NextResponse(await streamObject(name, range), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${range.start}-${range.end}/${object.size}`,
        "Content-Length": String(range.end - range.start + 1),
      },
    });
  }

  return new NextResponse(await streamObject(name), {
    headers: { ...headers, "Content-Length": String(object.size) },
  });
}

/** Players send HEAD first to learn the size before they start streaming. */
export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;

  const object = await statObject(key.join("/"));
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(null, {
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
