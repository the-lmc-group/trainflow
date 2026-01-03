import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const targetUrl = `http://fr1.orionhost.xyz:5010/data/rails/${z}/${x}/${y}.pbf`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return new NextResponse("Tile not found", { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers(response.headers);

    // Ensure correct content type for PBF
    headers.set("Content-Type", "application/x-protobuf");
    // Add CORS headers just in case
    headers.set("Access-Control-Allow-Origin", "*");
    // Cache for a long time
    headers.set("Cache-Control", "public, max-age=86400");

    return new NextResponse(buffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching tile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
