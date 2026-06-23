"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone, Plus, Search, ChevronLeft, ChevronRight,
  Calendar, ClipboardCheck, AlertCircle,
} from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getCampaignStats, listCampaigns } from "@/services/campaign.service";
import type { CampaignListItem, CampaignStats, CampaignStatus } from "@/types/campaign.types";

const STATUS_COLORS: Record<CampaignStatus, string> = {
  Draft: "#6B7280",
  Published: "#2EA8FF",
  Active: "#22C55E",
  Completed: "#D4A63A",
  Archived: "#4B5563",
};

const STATUS_BG: Record<CampaignStatus, string> = {
  Draft: "rgba(107,114,128,0.12)",
  Published: "rgba(46,168,255,0.12)",
  Active: "rgba(34,197,94,0.12)",
  Completed: "rgba(212,166,58,0.12)",
  Archived: "rgba(75,85,99,0.12)",
};

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Draft", value: "Draft" },
  { label: "Published", value: "Published" },
  { label: "Active", value: "Active" },
  { label: "Completed", value: "Completed" },
  { label: "Archived", value: "Archived" },
];

export function OrgCampaignsView() {
  const { accessToken } = useOrgAuthStore();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        listCampaigns(accessToken, { page, page_size: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined }),
        getCampaignStats(accessToken),
      ]);
      setCampaigns(res.items);
      setTotal(res.total);
      setStats(s);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Assessment Campaigns</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {total} total campaign{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => router.push("/org/assessment-campaigns/create")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)", color: "#000" }}
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {([
            { label: "Draft", value: stats.draft, color: STATUS_COLORS.Draft },
            { label: "Published", value: stats.published, color: STATUS_COLORS.Published },
            { label: "Active", value: stats.active, color: STATUS_COLORS.Active },
            { label: "Completed", value: stats.completed, color: STATUS_COLORS.Completed },
            { label: "Archived", value: stats.archived, color: STATUS_COLORS.Archived },
          ] as const).map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3 text-center cursor-pointer transition-all"
                 style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}
                 onClick={() => { setStatusFilter(label); setPage(1); }}>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text" placeholder="Search campaigns..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
            style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value}
                    onClick={() => { setStatusFilter(f.value); setPage(1); }}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={statusFilter === f.value
                      ? { background: "rgba(212,166,58,0.15)", color: "#D4A63A" }
                      : { color: "rgba(255,255,255,0.4)" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Campaign", "Assessment", "Schedule", "Candidates", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium tracking-wider uppercase"
                    style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Megaphone className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No campaigns yet</p>
                  <button onClick={() => router.push("/org/assessment-campaigns/create")}
                          className="mt-3 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(212,166,58,0.1)", color: "#D4A63A" }}>
                    Create your first campaign
                  </button>
                </td>
              </tr>
            ) : campaigns.map(c => (
              <tr key={c.uuid} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => router.push(`/org/assessment-campaigns/${c.uuid}`)}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-white">{c.campaign_name}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{c.campaign_code}</p>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {c.assessment_name ?? <span style={{ color: "rgba(255,255,255,0.2)" }}>Not set</span>}
                </td>
                <td className="px-4 py-3">
                  {c.start_date ? (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(c.start_date).toLocaleDateString()} — {c.end_date ? new Date(c.end_date).toLocaleDateString() : "Open"}</span>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>No schedule</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    {c.assignment_count}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: STATUS_BG[c.status], color: STATUS_COLORS[c.status] }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[c.status] }} />
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                          style={{ color: "#2EA8FF", background: "rgba(46,168,255,0.08)" }}
                          onClick={e => { e.stopPropagation(); router.push(`/org/assessment-campaigns/${c.uuid}`); }}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Page {page} of {totalPages} — {total} campaigns
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded disabled:opacity-40"
                      style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded disabled:opacity-40"
                      style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
