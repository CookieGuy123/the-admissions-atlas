import React, { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, DollarSign, Percent, University, Plus, X, Search, Calculator, Sparkles, Loader2 } from "lucide-react";
import { collegesData } from "../../../data/colleges";
import { supabase } from "../../../supabaseClient";
import { apiFetch } from "../../../lib/api";

interface Props {
  customColleges: any[];
  setCustomColleges: React.Dispatch<React.SetStateAction<any[]>>;
  suggestedColleges: any[];
  setSuggestedColleges: React.Dispatch<React.SetStateAction<any[]>>;
  onSelectCollege?: (college: any) => void;
}

const tierColors: Record<string, string> = {
  "Ivy League": "bg-primary-container text-primary",
  "Top Engineering": "bg-secondary-container text-secondary",
  "Top Public": "bg-tertiary-container text-tertiary",
  "Top Liberal Arts": "bg-surface-dim text-on-surface-variant",
  "Specialized Health": "bg-error-container text-error",
};

export default function DeadlinesPanel({
  customColleges,
  setCustomColleges,
  suggestedColleges,
  setSuggestedColleges,
  onSelectCollege
}: Props) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: "", location: "", acceptanceRate: "", tuitionSticker: "", avgAidPackage: "", deadlineED: "", deadlineRD: "" });
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);

  const handleAiRecommend = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiFetch("/api/colleges/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: aiQuery })
      });
      const data = await res.json();
      setRecommendedIds(data.matches || []);
      if (data.suggestions?.length) {
        setSuggestedColleges(data.suggestions);
      }
    } catch { setRecommendedIds([]); }
    finally { setAiLoading(false); }
  };

  const dismissRecommendation = (id: string) => {
    setRecommendedIds(prev => prev.filter(i => i !== id));
    setSuggestedColleges(prev => prev.map(c => c.id === id ? { ...c, dismissed: true } : c));
  };

  const allColleges = [...collegesData, ...customColleges, ...suggestedColleges].filter(c => {
    if (tierFilter !== "all" && c.tier !== tierFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.location || "").toLowerCase().includes(q);
  });

  const addCustom = () => {
    if (!custom.name) return;
    setCustomColleges(prev => [{
      ...custom, id: "custom-" + Date.now(), tier: "Top Public",
      specialization: "General",
      acceptanceRate: parseFloat(custom.acceptanceRate) || 0,
      tuitionSticker: parseInt(custom.tuitionSticker) || 0,
      avgAidPackage: parseInt(custom.avgAidPackage) || 0,
    }, ...prev]);
    setCustom({ name: "", location: "", acceptanceRate: "", tuitionSticker: "", avgAidPackage: "", deadlineED: "", deadlineRD: "" });
    setCustomOpen(false);
  };

  return (
    <div>
      <div className="m3-card p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="m3-field w-full pl-9" placeholder="Search colleges..." />
          </div>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="m3-select">
            <option value="all">All tiers</option>
            <option value="Ivy League">Ivy League</option>
            <option value="Top Engineering">Engineering</option>
            <option value="Top Public">Public</option>
            <option value="Top Liberal Arts">Liberal Arts</option>
            <option value="Specialized Health">Health</option>
          </select>
          <button onClick={() => setCustomOpen(!customOpen)} className="m3-btn-outlined text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> Add College
          </button>
        </div>
      </div>

      {/* AI College Recommender */}
      <div className="m3-card p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">College Recommender</span>
        </div>
        <p className="text-xs text-on-surface-variant mb-2">Tell us your interests and we'll suggest colleges from the list.</p>
        <div className="flex items-center gap-2">
          <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAiRecommend()}
            className="m3-field flex-1" placeholder="e.g. I want to study engineering in California..." />
          <button onClick={handleAiRecommend} disabled={aiLoading || !aiQuery.trim()}
            className="m3-btn-filled text-sm px-4 py-2">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Find
          </button>
        </div>
        {(recommendedIds.length > 0 || suggestedColleges.length > 0) && (
          <p className="text-xs text-success mt-2">{recommendedIds.length + suggestedColleges.length} college{(recommendedIds.length + suggestedColleges.length) > 1 ? "s" : ""} matched your interests. Click a highlighted card to dismiss.</p>
        )}
      </div>

      {customOpen && (
        <div className="m3-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-on-surface">Add College</h3>
            <button onClick={() => setCustomOpen(false)} className="m3-btn-text p-1"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={custom.name} onChange={e => setCustom(c => ({ ...c, name: e.target.value }))} className="m3-field" placeholder="College name" />
            <input value={custom.location} onChange={e => setCustom(c => ({ ...c, location: e.target.value }))} className="m3-field" placeholder="Location" />
            <input value={custom.acceptanceRate} onChange={e => setCustom(c => ({ ...c, acceptanceRate: e.target.value }))} className="m3-field" placeholder="Rate %" type="number" step="0.1" />
            <button onClick={addCustom} className="m3-btn-filled text-sm px-4 self-end">Save</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allColleges.map(c => {
          const suggestion = suggestedColleges.find(s => s.id === c.id);
          const isRecommended = recommendedIds.includes(c.id) || (suggestion && !suggestion.dismissed);
          return (
          <div key={c.id} onClick={isRecommended ? () => dismissRecommendation(c.id) : undefined}
            className={`m3-card p-0 overflow-hidden transition-all duration-200 ${
              isRecommended ? "ring-2 ring-primary bg-primary-container/10 cursor-pointer" : ""
            }`}>
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <University className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-base font-semibold text-on-surface truncate" title={c.name}>{c.name}</h3>
                  {suggestion && !suggestion.dismissed && <span className="m3-badge m3-badge-new text-[10px]">AI SUGGESTED</span>}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${tierColors[c.tier] || "bg-surface-dim text-on-surface-variant"}`}>
                  {c.tier === "Ivy League" ? "Ivy" : c.tier === "Top Engineering" ? "ENG" : c.tier === "Top Public" ? "PUB" : c.tier === "Top Liberal Arts" ? "LA" : c.tier === "Specialized Health" ? "HLTH" : c.tier}
                </span>
              </div>
              {suggestion?.reason && !suggestion.dismissed && (
                <p className="text-xs text-primary mb-2 italic">"{suggestion.reason}"</p>
              )}
              {c.location && (
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {c.location}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="font-mono tabular-nums font-medium">{c.acceptanceRate}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="font-mono tabular-nums font-medium">${c.tuitionSticker.toLocaleString()}</span>
                </div>
              </div>
              {c.avgAidPackage > 0 && (
                <div className="flex items-center gap-1.5 text-sm mt-1">
                  <DollarSign className="w-3.5 h-3.5 text-secondary" />
                  <span className="font-mono tabular-nums text-secondary font-medium">Avg aid: ${c.avgAidPackage.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="border-t border-surface-dim px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">ED:</span>
                  <span className="font-mono">{c.deadlineED}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="font-medium">RD:</span>
                  <span className="font-mono">{c.deadlineRD}</span>
                </div>
              </div>
              {onSelectCollege && (
                <button onClick={(e) => { e.stopPropagation(); onSelectCollege(c); }}
                  className="m3-btn-text text-xs py-1 px-2 shrink-0">
                  <Calculator className="w-3.5 h-3.5" /> Load
                </button>
              )}
            </div>
          </div>
        );
        })}
        {allColleges.length === 0 && (
          <div className="col-span-full text-center text-sm text-on-surface-variant py-8 italic">No colleges match your filters</div>
        )}
      </div>
    </div>
  );
}