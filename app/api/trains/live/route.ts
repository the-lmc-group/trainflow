import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { NextResponse } from "next/server";

export async function GET() {
  const storeData = getSiriData();

  if (!storeData || !storeData.data) {
    return NextResponse.json([]);
  }

  const interpolated = interpolate(storeData.data, new Date());

  return NextResponse.json(interpolated);
}
