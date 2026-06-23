"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { Activity, ClipboardList, PlayCircle, CheckCircle, ShieldCheck, Server, Award } from "lucide-react";

interface ActivityItem {
  id: number;
  assignment_id: number;
  activity_type: string;
  activity_description: string | null;
  icon: string;
  created_at: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardList, PlayCircle, CheckCircle, ShieldCheck, Server, Award, Activity,
  FileCheck: ShieldCheck, Rocket: PlayCircle, CheckSquare: CheckCircle,
};

export function CandidateActivityView() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    setLoading(true);
    try {
      const res = await candidateService.getActivity(token, p);
      if (res.success && res.data) {
        const newItems = res.data.items;
        setItems((prev) => p === 1 ? newItems : [...prev, ...newItems]);
        setTotal(res.data.total);
      } else {
        setError("Failed to load activity");
      }
    } catch {
      setError("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(1); }, [load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  const hasMore = items.length < total;

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Activity</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Your assessment activity timeline</p>
        </div>

        {error && (
          <div style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 10, padding: 16, color: "#EF4444", fontSize: 14 }}>{error}</div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
            <Activity size={36} color="#374151" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: "#4B5563", marginBottom: 6 }}>No activity yet</div>
            <div style={{ fontSize: 13, color: "#374151" }}>Activity events will appear here as you progress through assessments.</div>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "#1E2430" }} />
            {items.map((item, i) => {
              const IconComp = ICON_MAP[item.icon] ?? Activity;
              return (
                <div key={item.id} style={{ position: "relative", marginBottom: i < items.length - 1 ? 20 : 0 }}>
                  <div style={{
                    position: "absolute", left: -28, top: 14, width: 28, height: 28, borderRadius: "50%",
                    background: "#1E2430", border: "2px solid #D4A63A30",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <IconComp size={12} color="#D4A63A" />
                  </div>
                  <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: "12px 16px", marginLeft: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F9FAFB" }}>{item.activity_type}</div>
                      <div style={{ fontSize: 11, color: "#4B5563", whiteSpace: "nowrap" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                    {item.activity_description && (
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{item.activity_description}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#6B7280", fontSize: 13 }}>Loading...</div>
        )}

        {hasMore && !loading && (
          <button onClick={loadMore}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #1E2430", background: "transparent", color: "#6B7280", fontSize: 13, cursor: "pointer" }}>
            Load more
          </button>
        )}
      </div>
    </CandidatePortalLayout>
  );
}
