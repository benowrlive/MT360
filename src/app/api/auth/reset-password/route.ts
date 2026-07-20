import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as { token?: string; password?: string };

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find user by reset token + check expiry
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
    }

    // Update password + clear the reset token
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ ok: true, message: "Password reset successfully. You can now sign in." });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Password reset failed" },
      { status: 500 },
    );
  }
}
