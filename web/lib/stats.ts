import { createClient } from "@supabase/supabase-js";

export type IndexStats = {
  agents: number;
  likelyAgents: number;
  transactions: number;
  latestBlock: number;
  updatedAt: string;
};

// Last verified production figures. Used when Supabase is unreachable so the
// section degrades to stale-but-plausible rather than collapsing to zeros.
export const FALLBACK_STATS: IndexStats = {
  agents: 56192,
  likelyAgents: 11533,
  transactions: 497707,
  latestBlock: 48790834,
  updatedAt: "2026-07-24T00:00:00.000Z",
};

export async function fetchIndexStats(): Promise<IndexStats> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Stats error: Supabase env vars not set");
    return FALLBACK_STATS;
  }

  try {
    const supabase = createClient(url, key);

    // head:true returns only the count, so no row data crosses the wire —
    // important on the ~500k-row transactions table.
    const [agents, likely, txns, block] = await Promise.all([
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .eq("is_agent_likely", true),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase
        .from("raw_transactions")
        .select("block_number")
        .order("block_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      agents: agents.count ?? FALLBACK_STATS.agents,
      likelyAgents: likely.count ?? FALLBACK_STATS.likelyAgents,
      transactions: txns.count ?? FALLBACK_STATS.transactions,
      latestBlock: block.data?.block_number ?? FALLBACK_STATS.latestBlock,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Stats fetch error:", err);
    return FALLBACK_STATS;
  }
}
