import { NextResponse } from "next/server";
import { fetchIndexStats } from "@/lib/stats";

// Indexing progress changes slowly and the count queries are expensive at
// ~500k rows, so the result is cached for 24h. The first request after
// expiry refreshes it; everyone else is served the cached payload.
export const revalidate = 86400;

export async function GET() {
  const stats = await fetchIndexStats();
  return NextResponse.json(stats);
}
