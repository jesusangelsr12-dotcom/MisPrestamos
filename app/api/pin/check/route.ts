import { NextResponse } from "next/server";
import { pinExists } from "@/lib/db/queries";

export async function GET() {
  try {
    const hasPin = await pinExists();
    return NextResponse.json({ hasPin });
  } catch {
    return NextResponse.json(
      { error: "Error al verificar PIN" },
      { status: 500 }
    );
  }
}
