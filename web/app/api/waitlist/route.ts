import { NextRequest, NextResponse } from "next/server";

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

    console.log(
      "WAITLIST:",
      JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        useCase: useCase.trim(),
        timestamp: new Date().toISOString(),
      })
    );

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
