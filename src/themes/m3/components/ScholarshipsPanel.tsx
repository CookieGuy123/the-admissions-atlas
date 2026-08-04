import React, { useState } from "react";
import { Search, Bookmark, Award, ExternalLink, Plus, Sparkles, X, ArrowUpDown, RotateCcw, AlertCircle, CheckCircle2, RefreshCw, Filter } from "lucide-react";
import type { Scholarship, Internship, UserProfile } from "../../../types";
import { apiFetch } from "../../../lib/api";

const levelLabels: Record<string, string> = { high_school: "High School", college: "College", both: "Both", graduate: "Graduate" };

interface Props {
  scholarships: Scholarship[];
  setScholarships: React.Dispatch<React.SetStateAction<Scholarship[]>>;
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

export default function ScholarshipsPanel({ scholarships, setScholarships, isBookmarked, toggleBookmark, isWon, toggleWon, dismissNew, saveData, profile, onOpenAiSearch }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "amount" | "name">("deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [levelFilter, setLevelFilter] = useState("all");
  const [hideExpired, setHideExpired] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ name: "", organization: "", amountNumeric: "", deadline: "", studentLevel: "high_school" });

  const handleSort = (field: "deadline" | "amount" | "name") => {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir(field === "amount" ? "desc" : "asc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setLevelFilter("all");
    setHideExpired(true);
    setSortBy("deadline");
    setSortDir("asc");
  };

  const verifyDeadline = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await apiFetch("/api/opportunities/verify-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "scholarship" })
      });
      const data = await res.json();
      if (data.success && data.item) {
        setScholarships(prev => prev.map(s => s.id === id ? { ...s, ...data.item } : s));
      }
    } catch (e) {
      console.error("Verification failed", e);
    } finally {
      setVerifyingId(null);
    }
  };

  const sortArrow = (field: "deadline" | "amount" | "name") => {
    if (sortBy !== field) return null;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortDir === "desc" ? "rotate-180" : ""}`} />;
  };

  const filtered = scholarships
    .filter(s => {
      if (hideExpired && isItemExpired(s.deadline)) return false;
      if (levelFilter !== "all" && s.studentLevel !== levelFilter && s.studentLevel !== "both") return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.organization.toLowerCase().includes(q) || (s.fieldOfStudy || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const cmp = sortBy === "deadline" ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        : sortBy === "amount" ? (a.amountNumeric || 0) - (b.amountNumeric || 0)
        : a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const addManual = () => {
    if (!manual.name || !manual.organization || !manual.amountNumeric || !manual.deadline) return;
    const id = "manual-" + Date.now();
    const s: Scholarship = {
      id, name: manual.name, organization: manual.organization,
      amountNumeric: parseInt(manual.amountNumeric) || 0,
      amount: `$${parseInt(manual.amountNumeric).toLocaleString()}`,
      deadline: manual.deadline, studentLevel: manual.studentLevel as any,
      sourceUrl: "", isNew: false,
      isFree: true, scamFlag: false, scamReason: "", ageFilter: "All eligible",
      requirements: [], isVerified: true, fieldOfStudy: "",
      lastVerifiedAt: new Date().toISOString().split("T")[0]
    };
    setScholarships(prev => [s, ...prev]);
    setManual({ name: "", organization: "", amountNumeric: "", deadline: "", studentLevel: "high_school" });
    setManualOpen(false);
    setTimeout(() => saveData(), 100);
  };

  return (
    <div>
      {/* Deadline Disclaimer Banner */}
      <div className="m3-card p-3 mb-4 bg-primary-container/20 border border-primary/20 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">Deadline Notice:</span> Due dates are gathered from official providers and AI search. Deadlines can change without notice — verify dates on the official website via the <span className="font-semibold">Visit</span> link.
        </div>
      </div>

      {/* Toolbar */}
      <div className="m3-card p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:flex-1 sm:min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="m3-field w-full pl-9" placeholder="Filter scholarships by name, org, or field..." />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="m3-select flex-1 sm:flex-none">
              <option value="all">All levels</option>
              <option value="high_school">High school</option>
              <option value="college">College</option>
              <option value="graduate">Graduate</option>
              <option value="both">Both</option>
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
      </div>

      {manualOpen && (
        <div className="m3-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-on-surface">Add Scholarship</h3>
            <button onClick={() => setManualOpen(false)} className="m3-btn-text p-1"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))} className="m3-field" placeholder="Name" />
            <input value={manual.organization} onChange={e => setManual(m => ({ ...m, organization: e.target.value }))} className="m3-field" placeholder="Org" />
            <input value={manual.amountNumeric} onChange={e => setManual(m => ({ ...m, amountNumeric: e.target.value }))} className="m3-field" placeholder="$ Amount" type="number" />
            <div className="flex gap-2">
              <input value={manual.deadline} onChange={e => setManual(m => ({ ...m, deadline: e.target.value }))} className="m3-field flex-1" type="date" />
              <button onClick={addManual} className="m3-btn-filled text-sm px-4">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table View (hidden on small mobile screens) */}
      <div className="hidden sm:block m3-card overflow-x-auto">
        <table className="m3-table">
          <thead>
            <tr>
              <th>Organization</th>
              <th onClick={() => handleSort("name")} className="cursor-pointer select-none">Name{sortArrow("name")}</th>
              <th onClick={() => handleSort("amount")} className="text-right cursor-pointer select-none">Amount{sortArrow("amount")}</th>
              <th onClick={() => handleSort("deadline")} className="cursor-pointer select-none">Deadline{sortArrow("deadline")}</th>
              <th>Level</th>
              <th>Field</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const expired = isItemExpired(s.deadline);
              return (
                <tr key={s.id} className={expired ? "opacity-75 bg-error-container/5" : ""}>
                  <td className="text-sm text-on-surface-variant">{s.organization}</td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      {s.name}
                      {s.isNew && <span onClick={() => dismissNew(s.id)} className="m3-badge m3-badge-new cursor-pointer" title="Dismiss">NEW</span>}
                    </div>
                  </td>
                  <td className="text-right font-mono tabular-nums font-semibold">${(s.amountNumeric || 0).toLocaleString()}</td>
                  <td className="font-mono tabular-nums text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className={expired ? "text-error line-through font-semibold" : ""}>{fmtDate(s.deadline)}</span>
                      {expired ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error">EXPIRED</span>
                      ) : s.lastVerifiedAt ? (
                        <span className="text-[10px] text-success flex items-center gap-0.5" title={`Verified: ${s.lastVerifiedAt}`}>
                          <CheckCircle2 className="w-3 h-3 inline" /> Verified
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-sm text-on-surface-variant">{levelLabels[s.studentLevel] || s.studentLevel}</td>
                  <td className="text-sm text-on-surface-variant">{s.fieldOfStudy || "—"}</td>
                  <td>
                    <div className="flex items-center gap-0.5 justify-end">
                      <button onClick={() => verifyDeadline(s.id)} disabled={verifyingId === s.id}
                        title="Re-verify deadline with AI"
                        className="m3-btn-text p-1.5 flex items-center gap-1 text-on-surface-variant hover:text-primary">
                        <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === s.id ? "animate-spin text-primary" : ""}`} />
                        <span className="text-[10px] leading-none hidden md:inline">Verify</span>
                      </button>
                      <button onClick={() => toggleBookmark(s.id, "scholarship")} title={isBookmarked(s.id) ? "Remove bookmark" : "Bookmark"}
                        className={`m3-btn-text p-1.5 flex items-center gap-1 ${isBookmarked(s.id) ? "text-primary" : "text-on-surface-variant"}`}>
                        <Bookmark className={`w-4 h-4 ${isBookmarked(s.id) ? "fill-primary" : ""}`} />
                        <span className="text-[10px] leading-none hidden md:inline">{isBookmarked(s.id) ? "Saved" : "Save"}</span>
                      </button>
                      <button onClick={() => toggleWon(s, "scholarship")} title={isWon(s.id) ? "Remove award" : "Mark as won"}
                        className={`m3-btn-text p-1.5 flex items-center gap-1 ${isWon(s.id) ? "text-secondary" : "text-on-surface-variant"}`}>
                        <Award className={`w-4 h-4 ${isWon(s.id) ? "text-secondary" : ""}`} />
                        <span className="text-[10px] leading-none hidden md:inline">{isWon(s.id) ? "Won" : "Award"}</span>
                      </button>
                      {s.sourceUrl && (
                        <a href={s.sourceUrl} target="_blank" rel="noreferrer" title="Open website"
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
              <tr><td colSpan={7} className="text-center text-sm text-on-surface-variant py-8 italic">No scholarships found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (visible on mobile <640px) */}
      <div className="block sm:hidden space-y-3">
        {filtered.map(s => {
          const expired = isItemExpired(s.deadline);
          return (
            <div key={s.id} className={`m3-card p-4 flex flex-col gap-2.5 ${expired ? "opacity-75 bg-error-container/5" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-on-surface-variant font-medium block">{s.organization}</span>
                  <h4 className="font-semibold text-on-surface text-base leading-tight mt-0.5">{s.name}</h4>
                </div>
                <span className="font-mono font-bold text-primary text-base whitespace-nowrap bg-primary-container/40 px-2.5 py-1 rounded-lg">
                  ${(s.amountNumeric || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {s.isNew && (
                  <span onClick={() => dismissNew(s.id)} className="m3-badge m3-badge-new cursor-pointer">NEW</span>
                )}
                <span className={`font-mono ${expired ? "text-error line-through font-semibold" : "text-on-surface-variant"}`}>
                  Deadline: {fmtDate(s.deadline)}
                </span>
                {expired ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error">EXPIRED</span>
                ) : s.lastVerifiedAt ? (
                  <span className="text-[10px] text-success flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 inline" /> Verified
                  </span>
                ) : null}
                <span className="bg-surface-dim px-2 py-0.5 rounded text-on-surface-variant">{levelLabels[s.studentLevel] || s.studentLevel}</span>
                {s.fieldOfStudy && <span className="bg-surface-dim px-2 py-0.5 rounded text-on-surface-variant">{s.fieldOfStudy}</span>}
              </div>

              <div className="pt-2 border-t border-surface-dim flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleBookmark(s.id, "scholarship")}
                    className={`m3-btn-text text-xs px-2.5 py-1.5 flex items-center gap-1 ${isBookmarked(s.id) ? "text-primary" : "text-on-surface-variant"}`}>
                    <Bookmark className={`w-4 h-4 ${isBookmarked(s.id) ? "fill-primary" : ""}`} />
                    <span>{isBookmarked(s.id) ? "Saved" : "Save"}</span>
                  </button>
                  <button onClick={() => toggleWon(s, "scholarship")}
                    className={`m3-btn-text text-xs px-2.5 py-1.5 flex items-center gap-1 ${isWon(s.id) ? "text-secondary" : "text-on-surface-variant"}`}>
                    <Award className={`w-4 h-4 ${isWon(s.id) ? "text-secondary" : ""}`} />
                    <span>{isWon(s.id) ? "Won" : "Award"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => verifyDeadline(s.id)} disabled={verifyingId === s.id}
                    className="m3-btn-text text-xs px-2 py-1.5 flex items-center gap-1 text-on-surface-variant">
                    <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === s.id ? "animate-spin text-primary" : ""}`} />
                  </button>
                  {s.sourceUrl && (
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="m3-btn-filled text-xs px-3 py-1.5 inline-flex items-center gap-1">
                      <span>Visit</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="m3-card p-6 text-center text-sm text-on-surface-variant italic">No scholarships found</div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex justify-between items-center px-1 py-2 text-sm text-on-surface-variant">
          <span>{filtered.length} scholarships</span>
          <span className="font-mono tabular-nums font-medium">${filtered.reduce((s, x) => s + (x.amountNumeric || 0), 0).toLocaleString()} total</span>
        </div>
      )}
    </div>
  );
}