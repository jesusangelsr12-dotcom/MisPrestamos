import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pinExists, insertPin } from "@/lib/db/queries";

const setupSchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "PIN debe ser 6 dígitos" },
      { status: 400 }
    );
  }

  if (await pinExists()) {
    return NextResponse.json(
      { error: "PIN ya configurado" },
      { status: 409 }
    );
  }

  const hashedPin = await bcrypt.hash(parsed.data.pin, 12);

  try {
    await insertPin(hashedPin);
  } catch {
    return NextResponse.json(
      { error: "Error al guardar PIN" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("cuotas_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}
