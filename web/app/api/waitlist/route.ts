import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const WAITLIST_PATH = path.join(process.cwd(), "waitlist.json");

interface WaitlistEntry {
  name: string;
  email: string;
  company: string;
  useCase: string;
  timestamp: string;
}

async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const data = await fs.readFile(WAITLIST_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await fs.writeFile(WAITLIST_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const entries = await readWaitlist();

    // Check for duplicate email
    if (entries.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { success: true, message: "Already on the list." },
        { status: 200 }
      );
    }

    const newEntry: WaitlistEntry = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      useCase: useCase.trim(),
      timestamp: new Date().toISOString(),
    };

    entries.push(newEntry);
    await writeWaitlist(entries);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
