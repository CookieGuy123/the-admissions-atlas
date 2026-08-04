import React, { useState } from "react";
import { Search, Bookmark, Award, ExternalLink, Plus, Sparkles, X, ArrowUpDown, RotateCcw, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import type { Internship, Scholarship, UserProfile } from "../../../types";

interface Props {
  internships: Internship[];
  setInternships: React.Dispatch<React.SetStateAction<Internship[]>>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string, type: "scholarship" | "internship") => void;
  isWon: (id: string) => boolean;
  toggleWon: (item: Scholarship | Internship, type: "scholarship" | "internship") => void;
  dismissNew: (id: string) => void;
  saveData: (overrides?: Record<string, any>) => void;
  profile: UserProfile | null;
  onOpenAiSearch: () => void;
}

function fmtDate(dateStr: string): string {
  if (!dateStr || dateStr === "Rolling" || dateStr === "Recurring" || dateStr === "None") return dateStr || "—";
  const [y, m, d] = dateStr.split("-");
  const date = new Date(+y, +m - 1, +d);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function isItemExpired(deadlineStr: string): boolean {
  if (!deadlineStr || deadlineStr === "Rolling" || deadlineStr === "Recurring" || deadlineStr === "None") return false;
  const today = new Date().toISOString().split("T")[0];
  return deadlineStr < today;
}

export default function InternshipsPanel({ internships, setInternships, isBookmarked, toggleBookmark, isWon, toggleWon, dismissNew, saveData, profile, onOpenAiSearch }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "title" | "company">("deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [typeFilter, setTypeFilter] = useState<"all" | "Paid" | "Unpaid">("all");
  const [hideExpired, setHideExpired] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ title: "", company: "", location: "", type: "Paid" as "Paid" | "Unpaid", deadline: "" });

  const handleSort = (field: "deadline" | "title" | "company") => {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir(field === "deadline" ? "asc" : "asc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setHideExpired(true);
    setSortBy("deadline");
    setSortDir("asc");
  };

  const verifyDeadline = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch("/api/opportunities/verify-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "internship" })
      });
      const data = await res.json();
      if (data.success && data.item) {
        setInternships(prev => prev.map(i => i.id === id ? { ...i, ...data.item } : i));
      }
    } catch (e) {
      console.error("Verification failed", e);
    } finally {
      setVerifyingId(null);
    }
  };

  const sortArrow = (field: "deadline" | "title" | "company") => {
    if (sortBy !== field) return null;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortDir === "desc" ? "rotate-180" : ""}`} />;
  };

  const filtered = internships
    .filter(i => {
      if (hideExpired && isItemExpired(i.deadline)) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return i.title.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || (i.fieldOfStudy || "").toLowerCase().includes(q) || (i.location || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const cmp = sortBy === "deadline" ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        : sortBy === "title" ? a.title.localeCompare(b.title)
        : a.company.localeCompare(b.company);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const addManual = () => {
    if (!manual.title || !manual.company || !manual.deadline) return;
    const id = "manual-int-" + Date.now();
    const i: Internship = {
      id, title: manual.title, company: manual.company,
      location: manual.location, type: manual.type,
      deadline: manual.deadline, description: "",
      requirements: [], isVerified: false, scamFlag: false, scamReason: "",
      sourceUrl: "", fieldOfStudy: "", studentLevel: "undergrad",
      isNew: false,
      lastVerifiedAt: new Date().toISOString().split("T")[0]
    };
    setInternships(prev => [i, ...prev]);
    setManual({ title: "", company: "", location: "", type: "Paid", deadline: "" });
    setManualOpen(false);
    setTimeout(() => saveData(), 100);
  };

  return (
    <div>
      {/* Deadline Disclaimer Banner */}
      <div className="m3-card p-3 mb-4 bg-primary-container/20 border border-primary/20 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">Deadline Notice:</span> Internship closing dates are gathered from company boards and AI search. Application windows shift frequently — verify closing dates on the employer website via the <span className="font-semibold">Visit</span> link.
        </div>
      </div>

      <div className="m3-card p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="m3-field w-full pl-9" placeholder="Filter internships by title, company, or field..." />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="m3-select">
            <option value="all">All types</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer px-2 py-1.5 rounded-lg bg-surface-dim/40 border border-surface-dim hover:bg-surface-dim/70 transition-colors">
            <input type="checkbox" checked={hideExpired} onChange={e => setHideExpired(e.target.checked)} className="rounded text-primary focus:ring-0" />
            <span>Hide Expired</span>
          </label>
          <button onClick={resetFilters} className="m3-btn-text p-1.5 text-on-surface-variant hover:text-primary" title="Reset all filters">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={onOpenAiSearch} className="m3-btn-filled text-sm px-4 py-2">
            <Sparkles className="w-4 h-4" /> AI Search
          </button>
          <button onClick={() => setManualOpen(!manualOpen)} className="m3-btn-outlined text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {manualOpen && (
        <div className="m3-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-on-surface">Add Internship</h3>
            <button onClick={() => setManualOpen(false)} className="m3-btn-text p-1"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} className="m3-field" placeholder="Title" />
            <input value={manual.company} onChange={e => setManual(m => ({ ...m, company: e.target.value }))} className="m3-field" placeholder="Company" />
            <input value={manual.location} onChange={e => setManual(m => ({ ...m, location: e.target.value }))} className="m3-field" placeholder="Location" />
            <div className="flex gap-2">
              <select value={manual.type} onChange={e => setManual(m => ({ ...m, type: e.target.value as any }))} className="m3-select flex-1">
                <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
              </select>
              <button onClick={addManual} className="m3-btn-filled text-sm px-4">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="m3-card overflow-x-auto">
        <table className="m3-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("company")} className="cursor-pointer select-none">Company{sortArrow("company")}</th>
              <th onClick={() => handleSort("title")} className="cursor-pointer select-none">Title{sortArrow("title")}</th>
              <th>Location</th>
              <th>Type</th>
              <th onClick={() => handleSort("deadline")} className="cursor-pointer select-none">Deadline{sortArrow("deadline")}</th>
              <th>Field</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => {
              const expired = isItemExpired(i.deadline);
              return (
                <tr key={i.id} className={expired ? "opacity-75 bg-error-container/5" : ""}>
                  <td className="text-sm text-on-surface-variant">{i.company}</td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      {i.title}
                      {i.isNew && <span onClick={() => dismissNew(i.id)} className="m3-badge m3-badge-new cursor-pointer" title="Dismiss">NEW</span>}
                    </div>
                  </td>
                  <td className="text-sm text-on-surface-variant">{i.location || "—"}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      i.type === "Paid" ? "bg-success-container text-success" : "bg-surface-dim text-on-surface-variant"
                    }`}>{i.type}</span>
                  </td>
                  <td className="font-mono tabular-nums text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className={expired ? "text-error line-through font-semibold" : ""}>{fmtDate(i.deadline)}</span>
                      {expired ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error">EXPIRED</span>
                      ) : i.lastVerifiedAt ? (
                        <span className="text-[10px] text-success flex items-center gap-0.5" title={`Verified: ${i.lastVerifiedAt}`}>
                          <CheckCircle2 className="w-3 h-3 inline" /> Verified
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-sm text-on-surface-variant">{i.fieldOfStudy || "—"}</td>
                  <td>
                    <div className="flex items-center gap-0.5 justify-end">
                      <button onClick={() => verifyDeadline(i.id)} disabled={verifyingId === i.id}
                        title="Re-verify deadline with AI"
                        className="m3-btn-text p-1.5 flex items-center gap-1 text-on-surface-variant hover:text-primary">
                        <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === i.id ? "animate-spin text-primary" : ""}`} />
                        <span className="text-[10px] leading-none hidden md:inline">Verify</span>
                      </button>
                      <button onClick={() => toggleBookmark(i.id, "internship")} title={isBookmarked(i.id) ? "Remove bookmark" : "Bookmark"}
                        className={`m3-btn-text p-1.5 flex items-center gap-1 ${isBookmarked(i.id) ? "text-primary" : "text-on-surface-variant"}`}>
                        <Bookmark className={`w-4 h-4 ${isBookmarked(i.id) ? "fill-primary" : ""}`} />
                        <span className="text-[10px] leading-none hidden md:inline">{isBookmarked(i.id) ? "Saved" : "Save"}</span>
                      </button>
                      <button onClick={() => toggleWon(i, "internship")} title={isWon(i.id) ? "Remove award" : "Mark as won"}
                        className={`m3-btn-text p-1.5 flex items-center gap-1 ${isWon(i.id) ? "text-secondary" : "text-on-surface-variant"}`}>
                        <Award className={`w-4 h-4 ${isWon(i.id) ? "text-secondary" : ""}`} />
                        <span className="text-[10px] leading-none hidden md:inline">{isWon(i.id) ? "Won" : "Award"}</span>
                      </button>
                      {i.sourceUrl && (
                        <a href={i.sourceUrl} target="_blank" rel="noreferrer" title="Open website"
                          className="m3-btn-text p-1.5 flex items-center gap-1 text-on-surface-variant">
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-[10px] leading-none hidden md:inline">Visit</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-sm text-on-surface-variant py-8 italic">No internships found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex justify-between items-center px-1 py-2 text-sm text-on-surface-variant">
          <span>{filtered.length} internships</span>
        </div>
      )}
    </div>
  );
}