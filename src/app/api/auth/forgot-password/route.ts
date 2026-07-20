import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Always return OK (don't leak whether the email exists)
    const genericOk = NextResponse.json({ ok: true, message: "If an account with that email exists, a reset link has been sent." });

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return genericOk;

    // Generate a reset token (random 32-byte hex) + 1 hour expiry
    const crypto = await import("node:crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Build the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/?reset=${resetToken}`;

    // Send the email (or log to console if no email provider configured)
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return genericOk;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send reset email" },
      { status: 500 },
    );
  }
}
