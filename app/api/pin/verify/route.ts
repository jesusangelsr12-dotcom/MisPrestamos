import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { fetchPin } from "@/lib/db/queries";

const verifySchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "PIN debe ser 6 dígitos" },
      { status: 400 }
    );
  }

  const pin = await fetchPin();

  if (!pin) {
    return NextResponse.json(
      { error: "PIN no configurado" },
      { status: 404 }
    );
  }

  const isValid = await bcrypt.compare(parsed.data.pin, pin.hashed_pin);

  if (!isValid) {
    return NextResponse.json(
      { error: "PIN incorrecto" },
      { status: 401 }
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
