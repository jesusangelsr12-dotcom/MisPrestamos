import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = createClient();

  const { data, error } = await supabase
    .from("pin_auth")
    .select("hashed_pin")
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "PIN no configurado" },
      { status: 404 }
    );
  }

  const isValid = await bcrypt.compare(parsed.data.pin, data.hashed_pin);

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
