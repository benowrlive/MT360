import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Create the user with hashed password
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: "therapist", // default role
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sign-up failed" },
      { status: 500 },
    );
  }
}
