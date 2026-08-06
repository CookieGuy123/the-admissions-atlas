import React, { useState } from "react";
import { User, Bookmark, Award, RotateCcw, Edit3, Palette, Sun, Moon, Maximize2, Minimize2, Shield, ArrowUp, ArrowDown } from "lucide-react";
import type { UserProfile, UserPreferences, Scholarship, Internship, BookmarkedOpportunity } from "../../../types";
import { supabase } from "../../../supabaseClient";
import { apiFetch } from "../../../lib/api";

interface Props {
  user: any;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  wideMode: boolean;
  setWideMode: React.Dispatch<React.SetStateAction<boolean>>;
  gradient: string;
  setGradient: React.Dispatch<React.SetStateAction<"none" | "blue" | "teal" | "purple" | "green">>;
  gradientDir: "top" | "bottom";
  setGradientDir: React.Dispatch<React.SetStateAction<"top" | "bottom">>;
  saveData: (overrides?: Record<string, any>) => void;
  wonScholarships: Scholarship[];
  wonInternships: Internship[];
  bookmarked: BookmarkedOpportunity[];
  scholarships: Scholarship[];
  internships: Internship[];
}

export default function ProfilePanel({ user, profile, setProfile, preferences, setPreferences, darkMode, setDarkMode, wideMode, setWideMode, gradient, setGradient, gradientDir, setGradientDir, saveData, wonScholarships, wonInternships, bookmarked, scholarships, internships }: Props) {
  const [adminCode, setAdminCode] = useState("");

  const totalWonValue = wonScholarships.reduce((sum, s) => sum + (s.amountNumeric || 0), 0);
  const bookmarkedScholarships = scholarships.filter(s => bookmarked.some(b => b.id === s.id && b.type === "scholarship"));
  const bookmarkedInternships = internships.filter(i => bookmarked.some(b => b.id === i.id && b.type === "internship"));

  const handleAdminUpgrade = async () => {
    if (!adminCode.trim()) return;
    try {
      const res = await apiFetch("/api/auth/upgrade-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, code: adminCode }) });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setAdminCode("");
        await supabase.auth.refreshSession();
        alert("Upgraded to admin!");
      } else {
        alert(data.error || "Upgrade failed");
      }
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Settings */}
      <div className="m3-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-surface">Profile</h2>
          <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            user ? "bg-success-container text-success" : "bg-surface-dim text-on-surface-variant"
          }`}>
            {user ? "Signed in" : "Local"}
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-base font-semibold text-on-surface">{user?.email?.split("@")[0] || "Anonymous User"}</p>
            {user && <p className="text-sm text-on-surface-variant truncate">{user.email}</p>}
          </div>

          <div className="border-t border-surface-dim pt-3 space-y-3">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Preferences</p>
            <div className="flex gap-2">
              <button onClick={() => setDarkMode(!darkMode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all ${
                  darkMode ? "bg-primary-container text-primary border-primary" : "border-outline-variant text-on-surface-variant"
                }`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {darkMode ? "Light" : "Dark"}
              </button>
              {!(window as any).Capacitor && (
                <button onClick={() => setWideMode(!wideMode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all ${
                    wideMode ? "bg-primary-container text-primary border-primary" : "border-outline-variant text-on-surface-variant"
                  }`}>
                  {wideMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />} {wideMode ? "Narrow" : "Wide"}
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Student Level</label>
              <select value={preferences.studentLevel} onChange={e => setPreferences(p => ({ ...p, studentLevel: e.target.value as any }))} className="m3-select w-full">
                <option value="high_school">High School</option>
                <option value="college">College</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Field of Interest</label>
              <input value={preferences.fieldOfInterest} onChange={e => setPreferences(p => ({ ...p, fieldOfInterest: e.target.value }))} className="m3-field w-full" placeholder="e.g. STEM, Business" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Household Income</label>
              <input type="number" value={preferences.householdIncome} onChange={e => setPreferences(p => ({ ...p, householdIncome: parseInt(e.target.value) || 0 }))} className="m3-field w-full" />
            </div>

            <button onClick={() => { if (confirm("Reset all data?")) apiFetch("/api/reset", { method: "POST" }).then(() => location.reload()); }}
              className="m3-btn-outlined text-sm w-full py-2">
              <RotateCcw className="w-4 h-4" /> Reset Data
            </button>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-primary" /> Background
              </label>
              <div className="flex gap-1.5 mb-1.5">
                {[
                  { value: "none", label: "None" },
                  { value: "blue", label: "Blue" },
                  { value: "teal", label: "Teal" },
                  { value: "purple", label: "Purple" },
                  { value: "green", label: "Green" },
                ].map(g => (
                  <button key={g.value} onClick={() => setGradient(g.value as any)}
                    className={`flex-1 text-xs font-medium py-1.5 px-1 rounded-lg border transition-all ${
                      gradient === g.value
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface text-on-surface border-outline-variant hover:border-outline"
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
              {gradient !== "none" && (
                <div className="flex gap-1.5">
                  <button onClick={() => setGradientDir("top")}
                    className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1 rounded-lg border transition-all ${
                      gradientDir === "top"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface text-on-surface border-outline-variant hover:border-outline"
                    }`}>
                    <ArrowUp className="w-3 h-3" /> Top-down
                  </button>
                  <button onClick={() => setGradientDir("bottom")}
                    className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1 rounded-lg border transition-all ${
                      gradientDir === "bottom"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface text-on-surface border-outline-variant hover:border-outline"
                    }`}>
                    <ArrowDown className="w-3 h-3" /> Bottom-up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Awards */}
      <div className="m3-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-on-surface">Awards ({wonScholarships.length + wonInternships.length})</h2>
        </div>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {wonScholarships.length === 0 && wonInternships.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic">No awards marked yet</p>
          ) : (
            <>
              {wonScholarships.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-dim">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-on-surface-variant">{s.organization}</p>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-semibold text-primary shrink-0 ml-2">
                    ${(s.amountNumeric || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {wonInternships.map(i => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-surface-dim">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{i.title}</p>
                    <p className="text-xs text-on-surface-variant">{i.company}</p>
                  </div>
                  <span className={`shrink-0 ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    i.type === "Paid" ? "bg-success-container text-success" : "bg-surface-dim text-on-surface-variant"
                  }`}>{i.type}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="border-t border-surface-dim mt-2 pt-3 flex justify-between items-center">
          <span className="text-sm text-on-surface-variant">Total scholarship value</span>
          <span className="font-mono tabular-nums font-bold text-lg">${totalWonValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Watchlist */}
      <div className="m3-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-5 h-5 text-tertiary" />
          <h2 className="text-lg font-semibold text-on-surface">Watchlist ({bookmarked.length})</h2>
        </div>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {bookmarked.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic">No bookmarks yet</p>
          ) : (
            <>
              {bookmarkedScholarships.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-dim">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-on-surface-variant">{s.organization}</p>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-on-surface-variant shrink-0 ml-2">
                    {!s.deadline || s.deadline === "Rolling" || s.deadline === "Recurring" ? s.deadline || "—" : new Date(s.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
              {bookmarkedInternships.map(i => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-surface-dim">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{i.title}</p>
                    <p className="text-xs text-on-surface-variant">{i.company}</p>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-on-surface-variant shrink-0 ml-2">
                    {!i.deadline || i.deadline === "Rolling" || i.deadline === "Recurring" ? i.deadline || "—" : new Date(i.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}