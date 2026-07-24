import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company = "", useCase = "" } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error("Waitlist error: Supabase env vars not set");
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key);
    const { error } = await supabase.from("waitlist").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim() || null,
      use_case: useCase.trim() || null,
      source: "homepage-form",
    });

    if (error && error.code !== "23505") {
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "You're on the list." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
