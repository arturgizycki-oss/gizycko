import { NextResponse } from "next/server";
import { getObject } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const object = await getObject(key.join("/"));

  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(object.data), {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Length": String(object.data.byteLength),
    },
  });
}
