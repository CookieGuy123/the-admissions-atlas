import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../lib/api";
import { StatusBar, Style } from "@capacitor/status-bar";
import { supabase } from "../../supabaseClient";
import type { Scholarship, Internship, BookmarkedOpportunity, NotificationItem, UserPreferences, UserProfile } from "../../types";
import ScholarshipsPanel from "./components/ScholarshipsPanel";
import InternshipsPanel from "./components/InternshipsPanel";
import DeadlinesPanel from "./components/DeadlinesPanel";
import AidCalculatorPanel from "./components/AidCalculatorPanel";
import ProfilePanel from "./components/ProfilePanel";
import AuthModal from "./components/AuthModal";
import ResumeScannerModal from "./components/ResumeScannerModal";
import AdminPanel from "../../components/AdminPanel";
import ToastContainer from "../../components/ToastContainer";
import { defaultScholarships, defaultInternships } from "../../data/defaultData";

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
import { Search, Bookmark, Award, Bell, School, Briefcase, Calendar, Calculator, User, LogIn, LogOut, Home, Trophy, Layers, Clock, DollarSign, Shield, Sparkles, X, Sun, Moon, Maximize2, Minimize2, Loader2, Upload, ShieldCheck } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "scholarships" | "internships" | "deadlines" | "calculator" | "profile" | "admin">("overview");
  const [scholarships, setScholarships] = useState<Scholarship[]>(defaultScholarships);
  const [internships, setInternships] = useState<Internship[]>(defaultInternships);
  const [bookmarked, setBookmarked] = useState<BookmarkedOpportunity[]>([]);
  const [wonScholarships, setWonScholarships] = useState<Scholarship[]>([]);
  const [wonInternships, setWonInternships] = useState<Internship[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: "deadline" | "alert" | "system" }[]>([]);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({ age: 0, studentLevel: "high_school", householdIncome: 0, fieldOfInterest: "" });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("aid_dark") === "true");
  const [wideMode, setWideMode] = useState(() => localStorage.getItem("aid_wide") === "true");
  const [gradient, setGradient] = useState<"none" | "blue" | "teal" | "purple" | "green">(() => {
    const saved = localStorage.getItem("aid_gradient") as any;
    if (["none","blue","teal","purple","green","blue-bot","teal-bot","purple-bot","green-bot"].includes(saved)) {
      return saved.replace("-bot", "") as any;
    }
    return saved || "none";
  });
  const [gradientDir, setGradientDir] = useState<"top" | "bottom">(() => {
    const saved = localStorage.getItem("aid_gradient") as any;
    return saved?.endsWith("-bot") ? "bottom" : "top";
  });

  const resolvedGradient = gradient === "none" ? "none" : gradientDir === "bottom" ? `${gradient}-bot` : gradient;
  const [authOpen, setAuthOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchType, setAiSearchType] = useState<"scholarships" | "internships">("scholarships");
  const [dismissedNewIds, setDismissedNewIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("aid_dark", String(darkMode));
    // Sync Android status bar and navigation bar to match dark/light mode
    StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: darkMode ? "#141218" : "#ffffff" }).catch(() => {});
  }, [darkMode]);
  useEffect(() => { localStorage.setItem("aid_wide", String(wideMode)); }, [wideMode]);
  useEffect(() => { localStorage.setItem("aid_gradient", resolvedGradient); }, [resolvedGradient]);

  useEffect(() => {
    fetchInitialData();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && !dataLoaded) {
      loadSavedData();
      setDataLoaded(true);
      // Check if landing page requested resume scanner
      if (localStorage.getItem("aid_open_scanner")) {
        localStorage.removeItem("aid_open_scanner");
        setScanOpen(true);
      }
    }
  }, [isLoading, dataLoaded]);

  // Strip isNew from items whose dismissal was already saved
  useEffect(() => {
    if (!dataLoaded || dismissedNewIds.length === 0) return;
    setScholarships(prev => prev.map(s => dismissedNewIds.includes(s.id) ? { ...s, isNew: false } : s));
    setInternships(prev => prev.map(i => dismissedNewIds.includes(i.id) ? { ...i, isNew: false } : i));
  }, [dataLoaded, dismissedNewIds]);

  useEffect(() => {
    if (dataLoaded) saveLocalData();
  }, [bookmarked, wonScholarships, wonInternships, dismissedNewIds, preferences, dataLoaded]);

  // Cloud save for logged-in users
  useEffect(() => {
    if (!dataLoaded || !user) return;
    saveDataToCloud();
  }, [bookmarked, wonScholarships, wonInternships, dismissedNewIds, preferences, dataLoaded, user]);

  // Re-trigger cloud load when user becomes available (fixes race with getSession)
  useEffect(() => {
    if (dataLoaded && user) {
      loadDataFromCloud();
    }
  }, [dataLoaded, user]);

  // Deadline alerts — check every 30 minutes, avoids duplicate alerts
  const notifiedDeadlines = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!dataLoaded) return;
    const checkDeadlines = () => {
      const now = new Date();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const allItems = [...scholarships.map(s => ({ ...s, __type: "scholarship" as const })), ...internships.map(i => ({ ...i, __type: "internship" as const }))];
      allItems.forEach(item => {
        if (notifiedDeadlines.current.has(item.id)) return;
        if (!item.deadline || item.deadline === "Rolling" || item.deadline === "Recurring") return;
        const deadline = new Date(item.deadline);
        if (isNaN(deadline.getTime())) return;
        const diff = deadline.getTime() - now.getTime();
        if (diff > 0 && diff <= sevenDays) {
          notifiedDeadlines.current.add(item.id);
          const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
          addNotification("Deadline Approaching", `"${item.name}" closes in ${daysLeft} day${daysLeft > 1 ? "s" : ""}!`, "deadline");
        }
      });
    };
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dataLoaded, scholarships, internships]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [schRes, intRes] = await Promise.all([apiFetch("/api/scholarships"), apiFetch("/api/internships")]);
      if (schRes.ok) {
        const schData = await schRes.json();
        if (Array.isArray(schData) && schData.length > 0) setScholarships(schData);
      }
      if (intRes.ok) {
        const intData = await intRes.json();
        if (Array.isArray(intData) && intData.length > 0) setInternships(intData);
      }
    } catch (e) {
      console.warn("API load failed, using default client listings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocalData = () => {
    try {
      localStorage.setItem("aid_bookmarked", JSON.stringify(bookmarked));
      localStorage.setItem("aid_won_scholarships", JSON.stringify(wonScholarships));
      localStorage.setItem("aid_won_internships", JSON.stringify(wonInternships));
      localStorage.setItem("aid_dismissed_new", JSON.stringify(dismissedNewIds));
      localStorage.setItem("aid_preferences", JSON.stringify(preferences));
    } catch {}
  };

  const saveDataToCloud = async () => {
    if (!user) return;
    try {
      await apiFetch("/api/user/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          bookmarks: bookmarked,
          wonScholarships: Object.fromEntries(wonScholarships.map(s => [s.id, s.amountNumeric || 0])),
          dismissedNewIds,
          preferences: { ...preferences, darkMode, wideMode, gradient: resolvedGradient },
        })
      });
    } catch (e) {
      console.error("Cloud save failed", e);
    }
  };

  const loadDataFromCloud = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/user/load-data?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        if (data.bookmarks?.length) setBookmarked(data.bookmarks);
        if (data.dismissedNewIds?.length) setDismissedNewIds(data.dismissedNewIds);
        if (data.preferences) {
          setPreferences((p: UserPreferences) => ({ ...p, ...data.preferences }));
        }
      }
    } catch (e) {
      console.error("Cloud load failed", e);
    }
  };

  const loadSavedData = () => {
    try {
      const b = localStorage.getItem("aid_bookmarked");
      const ws = localStorage.getItem("aid_won_scholarships");
      const wi = localStorage.getItem("aid_won_internships");
      const dn = localStorage.getItem("aid_dismissed_new");
      const pr = localStorage.getItem("aid_preferences");
      const cs = localStorage.getItem("aid_custom_scholarships");
      const ci = localStorage.getItem("aid_custom_internships");
      if (b) setBookmarked(JSON.parse(b));
      if (ws) setWonScholarships(JSON.parse(ws));
      if (wi) setWonInternships(JSON.parse(wi));
      if (dn) setDismissedNewIds(JSON.parse(dn));
      if (pr) setPreferences((p: UserPreferences) => ({ ...p, ...JSON.parse(pr) }));

      if (cs) {
        const customSch: Scholarship[] = JSON.parse(cs);
        if (Array.isArray(customSch) && customSch.length > 0) {
          setScholarships(prev => {
            const existing = new Set(prev.map(s => s.id));
            const unique = customSch.filter(s => !existing.has(s.id));
            return [...unique, ...prev];
          });
        }
      }

      if (ci) {
        const customInt: Internship[] = JSON.parse(ci);
        if (Array.isArray(customInt) && customInt.length > 0) {
          setInternships(prev => {
            const existing = new Set(prev.map(i => i.id));
            const unique = customInt.filter(i => !existing.has(i.id));
            return [...unique, ...prev];
          });
        }
      }
    } catch {}
    // Also load from cloud for logged-in users
    loadDataFromCloud();
  };

  const isBookmarked = (id: string) => bookmarked.some(b => b.id === id);
  const toggleBookmark = (id: string, type: "scholarship" | "internship") => {
    const adding = !isBookmarked(id);
    setBookmarked(prev => adding ? [...prev, { id, type, savedAt: new Date().toISOString() }] : prev.filter(b => b.id !== id));
    if (adding) {
      const item = [...scholarships, ...internships].find(o => o.id === id);
      const itemName = item ? ("name" in item ? item.name : (item as any).title || id) : id;
      addNotification("Opportunity Saved", `Added "${itemName}" to bookmarks.`, "system");
    } else {
      addNotification("Bookmark Removed", `Removed from bookmarks.`, "system");
    }
  };

  const isWon = (id: string) => wonScholarships.some(s => s.id === id) || wonInternships.some(i => i.id === id);
  const toggleWon = (item: Scholarship | Internship, type: "scholarship" | "internship") => {
    const adding = !isWon(item.id);
    if (type === "scholarship") setWonScholarships(prev => prev.some(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item as Scholarship]);
    else setWonInternships(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item as Internship]);
    const itemName = "name" in item ? item.name : (item as any).title || item.id;
    if (adding) {
      addNotification("Award Secured!", `+"${itemName}" added to won list.`, "alert");
    } else {
      addNotification("Award Removed", `"${itemName}" removed from won list.`, "system");
    }
  };

  const dismissNew = (id: string) => {
    if (!dismissedNewIds.includes(id)) {
      setDismissedNewIds(prev => [...prev, id]);
      setScholarships(prev => prev.map(s => s.id === id ? { ...s, isNew: false } : s));
      setInternships(prev => prev.map(i => i.id === id ? { ...i, isNew: false } : i));
    }
  };

  const displayScholarships = scholarships;
  const displayInternships = internships;

  const totalWonValue = wonScholarships.reduce((sum, s) => sum + (s.amountNumeric || 0), 0);
  const bookmarkedCount = bookmarked.length;
  const dueThisMonth = displayScholarships.filter(s => {
    const d = new Date(s.deadline); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const handleSelectCollegeForCalc = (college: any) => { setSelectedCollege(college); setActiveTab("calculator"); };

  const addNotification = (title: string, message: string, type: "deadline" | "alert" | "system") => {
    const id = "n-" + Date.now();
    const now = new Date().toISOString();
    setNotifications(prev => [{ id, title, message, timestamp: now, isRead: false, type }, ...prev]);
    setToasts(prev => [...prev, { id: "t-" + Date.now(), title, message, type }]);
  };

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setAiSearchLoading(true);
    try {
      const endpoint = aiSearchType === "scholarships" ? "/api/scholarships/update" : "/api/internships/update";
      const res = await apiFetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ searchQuery: aiSearchQuery }) });
      const data = await res.json();

      const schItems: Scholarship[] = data.newScholarships || data.scholarships || [];
      const intItems: Internship[] = data.newInternships || data.internships || [];

      if (aiSearchType === "scholarships" && schItems.length > 0) {
        setScholarships(prev => {
          const existing = new Set(prev.map(s => s.id));
          const merged = schItems.filter((s: Scholarship) => !existing.has(s.id)).map((s: Scholarship) => ({ ...s, isNew: true }));
          const updated = [...merged, ...prev];
          const custom = updated.filter(s => !defaultScholarships.some(ds => ds.id === s.id));
          try { localStorage.setItem("aid_custom_scholarships", JSON.stringify(custom)); } catch {}
          return updated;
        });
      } else if (aiSearchType === "internships" && intItems.length > 0) {
        setInternships(prev => {
          const existing = new Set(prev.map(i => i.id));
          const merged = intItems.filter((i: Internship) => !existing.has(i.id)).map((i: Internship) => ({ ...i, isNew: true }));
          const updated = [...merged, ...prev];
          const custom = updated.filter(i => !defaultInternships.some(di => di.id === i.id));
          try { localStorage.setItem("aid_custom_internships", JSON.stringify(custom)); } catch {}
          return updated;
        });
      }

      if (data.success) {
        addNotification("AI Search Complete", `Found new ${aiSearchType} for "${aiSearchQuery}"`, "system");
      } else {
        addNotification("AI Search", data.error || "No new results found. Try a different query.", "system");
      }
      setAiSearchOpen(false);
      setAiSearchQuery("");
    } catch { addNotification("AI Search", "Search failed. Check your connection.", "alert"); }
    finally { setAiSearchLoading(false); }
  };

  const tabs = [
    { id: "overview", label: "Home", icon: Home },
    { id: "scholarships", label: "Scholarships", icon: School, count: displayScholarships.length },
    { id: "internships", label: "Internships", icon: Briefcase, count: displayInternships.length },
    ...(preferences.studentLevel !== "college" ? [{ id: "deadlines", label: "Deadlines", icon: Calendar }] : []),
    { id: "calculator", label: "Costs", icon: Calculator },
    { id: "profile", label: "Profile", icon: User },
    ...(user?.user_metadata?.role === "admin" ? [{ id: "admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className={`min-h-screen bg-background text-on-surface font-sans flex flex-col ${resolvedGradient !== "none" ? `bg-gradient-${resolvedGradient}` : ""} ${darkMode ? "dark" : ""}`}
      style={{ '--font-sans': "'Outfit', 'Roboto', ui-sans-serif, system-ui, sans-serif" } as React.CSSProperties}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Top App Bar */}
      <header className="bg-surface border-b border-surface-dim m3-elevation-1" style={{ zIndex: 10 }}>
        <div className={`mx-auto px-4 h-16 flex items-center justify-between ${wideMode ? "max-w-full" : "max-w-6xl"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={darkMode ? "/logo-dark.svg" : "/logo.svg"} alt="Atlas" className="w-8 h-8 rounded-xl shrink-0" />
            <span className="text-base sm:text-xl font-semibold tracking-tight text-on-surface whitespace-nowrap">The Admissions Atlas</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Wide-mode toggle — desktop only (useless on mobile) */}
            <div className="hidden sm:block group relative">
              <button onClick={() => setWideMode(!wideMode)} className="m3-btn-text p-2 gap-0" title={wideMode ? "Narrow layout" : "Wide layout"}>
                {wideMode ? <Minimize2 className="w-4 h-4 shrink-0" /> : <Maximize2 className="w-4 h-4 shrink-0" />}
                <span className="max-w-0 overflow-hidden group-hover:max-w-[60px] transition-all duration-200 whitespace-nowrap text-xs ml-1">
                  {wideMode ? "Narrow" : "Wide"}
                </span>
              </button>
            </div>
            <div className="group relative">
              <button onClick={() => setDarkMode(!darkMode)} className="m3-btn-text p-2 gap-0" title={darkMode ? "Light mode" : "Dark mode"}>
                {darkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                <span className="max-w-0 overflow-hidden group-hover:max-w-[60px] transition-all duration-200 whitespace-nowrap text-xs ml-1">
                  {darkMode ? "Light" : "Dark"}
                </span>
              </button>
            </div>
            {/* Upload resume — icon only on mobile */}
            <button onClick={() => setScanOpen(true)} className="m3-btn-text p-2 sm:px-3 sm:py-2">
              <Upload className="w-4 h-4" /> <span className="hidden sm:inline text-sm">Upload Resume</span>
            </button>
            {user ? (
              <button onClick={() => supabase.auth.signOut()} className="m3-btn-text p-2 sm:px-3 sm:py-2">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline text-sm">{user.email?.split("@")[0]}</span>
              </button>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="m3-btn-filled p-2 sm:px-4 sm:py-2">
                <LogIn className="w-4 h-4" /> <span className="hidden sm:inline text-sm">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Tab Bar (hidden on mobile) */}
      <div className={`hidden sm:block mx-auto w-full px-4 pt-3 ${wideMode ? "max-w-full" : "max-w-6xl"}`}>
        <nav className="m3-nav rounded-xl overflow-hidden">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`m3-nav-item ${activeTab === t.id ? "active" : ""}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] font-medium leading-tight ${activeTab === t.id ? "text-primary" : "text-on-surface-variant"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className={`flex-1 mx-auto w-full px-4 py-4 pb-24 sm:pb-4 ${wideMode ? "max-w-full" : "max-w-6xl"}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "overview" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-4">
              <div className="bg-primary-container rounded-xl p-5 relative overflow-hidden">
                <h2 className="text-xl font-semibold text-on-primary-container">Home</h2>
                <p className="text-sm text-on-primary-container/80 mt-1 max-w-lg">
                  Your central hub for scholarships, internships, college deadlines, and financial aid planning.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={() => setScanOpen(true)}
                    className="m3-btn-filled text-sm inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl hover:brightness-110 transition-all">
                    <Upload className="w-4 h-4" /> Upload Resume
                  </button>
                  <span className="text-xs text-on-primary-container/70 max-w-xs">
                    AI extracts your profile from a .pdf or .txt resume and finds your best matching scholarships and internships.
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="m3-stat">
                  <Award className="w-4 h-4 text-secondary" />
                  <span className="m3-stat-value tabular-nums">{displayScholarships.length + displayInternships.length}</span>
                  <span className="m3-stat-label">Total</span>
                </div>
                <div className="m3-stat">
                  <Bookmark className="w-4 h-4 text-tertiary" />
                  <span className="m3-stat-value tabular-nums">{bookmarkedCount}</span>
                  <span className="m3-stat-label">Saved</span>
                </div>
                <div className="m3-stat">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="m3-stat-value tabular-nums">${totalWonValue.toLocaleString()}</span>
                  <span className="m3-stat-label">Won</span>
                </div>
                <div className="m3-stat">
                  <Bell className={`w-4 h-4 ${dueThisMonth > 0 ? "text-error" : "text-outline"}`} />
                  <span className="m3-stat-value tabular-nums">{dueThisMonth}</span>
                  <span className="m3-stat-label">Due</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ShortcutCard icon={Trophy} label="Scholarship Search" desc="Search AI-powered records, filter, and bookmark." color="text-primary" onClick={() => setActiveTab("scholarships")} />
                <ShortcutCard icon={Layers} label="Internship Finder" desc="Browse positions, verify listings, flag scams." color="text-secondary" onClick={() => setActiveTab("internships")} />
                {preferences.studentLevel !== "college" && <ShortcutCard icon={Calendar} label="College Deadlines" desc="Track ED/RD cycles, tuition, and acceptance rates." color="text-tertiary" onClick={() => setActiveTab("deadlines")} />}
                <ShortcutCard icon={DollarSign} label="Cost Calculator" desc="Project net costs and model borrowing scenarios." color="text-primary" onClick={() => setActiveTab("calculator")} />
              </div>
            </div>
            <div className="md:col-span-4 space-y-3">
              <div className="m3-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-on-surface">{user ? "Account" : "Sign In"}</h3>
                </div>
                {user ? (
                  <div className="space-y-2 text-sm">
                    <p className="truncate text-on-surface-variant">{user.email}</p>
                    <p className="text-xs font-medium text-primary">{user.user_metadata?.role === "admin" ? "Admin" : "User"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-on-surface-variant">Save favorites across sessions.</p>
                    <button onClick={() => setAuthOpen(true)} className="m3-btn-filled w-full text-sm py-2">Sign In / Register</button>
                  </div>
                )}
              </div>
              <div className="m3-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" /> Alerts
                  </h3>
                  {notifications.some(n => !n.isRead) && (
                    <span className="px-2 py-0.5 bg-primary-container text-primary text-xs font-medium rounded-full">New</span>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">No notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item))}
                        className={`p-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                          n.isRead ? "bg-surface-dim/50 text-on-surface-variant" : "bg-primary-container/50 text-on-surface"
                        }`}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-medium text-xs">{n.title}</span>
                          <span className="text-xs text-on-surface-variant">{formatTimestamp(n.timestamp)}</span>
                        </div>
                        <p className="text-xs">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setNotifications([])} className="m3-btn-text text-xs flex-1 py-1">Clear all</button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "scholarships" ? (
          <ScholarshipsPanel
            scholarships={displayScholarships}
            setScholarships={setScholarships}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            isWon={isWon}
            toggleWon={toggleWon}
            dismissNew={dismissNew}
            saveData={() => saveLocalData()}
            profile={profile}
            onOpenAiSearch={() => { setAiSearchType("scholarships"); setAiSearchOpen(true); }}
          />
        ) : activeTab === "internships" ? (
          <InternshipsPanel
            internships={displayInternships}
            setInternships={setInternships}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            isWon={isWon}
            toggleWon={toggleWon}
            dismissNew={dismissNew}
            saveData={() => saveLocalData()}
            profile={profile}
            onOpenAiSearch={() => { setAiSearchType("internships"); setAiSearchOpen(true); }}
          />
        ) : activeTab === "deadlines" ? (
          <DeadlinesPanel onSelectCollege={handleSelectCollegeForCalc} />
        ) : activeTab === "calculator" ? (
          <AidCalculatorPanel initialCollege={selectedCollege} />
        ) : activeTab === "admin" ? (
          <AdminPanel userId={user?.id} />
        ) : (
          <ProfilePanel
            user={user}
            profile={profile}
            setProfile={setProfile}
            preferences={preferences}
            setPreferences={setPreferences}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            wideMode={wideMode}
            setWideMode={setWideMode}
            gradient={gradient}
            setGradient={setGradient}
            gradientDir={gradientDir}
            setGradientDir={setGradientDir}
            saveData={() => saveLocalData()}
            wonScholarships={wonScholarships}
            wonInternships={wonInternships}
            bookmarked={bookmarked}
            scholarships={scholarships}
            internships={internships}
          />
        )}
      </main>

      {/* AI Search Dialog */}
      {aiSearchOpen && <AiSearchDialog
        type={aiSearchType}
        onClose={() => { setAiSearchOpen(false); setAiSearchQuery(""); setAiSearchLoading(false); }}
        onSearch={handleAiSearch}
        query={aiSearchQuery}
        setQuery={setAiSearchQuery}
        loading={aiSearchLoading}
      />}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={() => setAuthOpen(false)} />

      {scanOpen && (
        <ResumeScannerModal onClose={() => { setScanOpen(false); setScanData(null); }}
          onData={setScanData} data={scanData} />
      )}

      {/* Mobile Bottom Navigation Bar — only visible on small screens (<640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-dim z-50 flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
              activeTab === t.id
                ? "text-primary"
                : "text-on-surface-variant"
            }`}>
            <div className={`relative p-1 rounded-2xl transition-all duration-200 ${
              activeTab === t.id ? "bg-primary-container" : ""
            }`}>
              <t.icon className="w-5 h-5" />
              {t.count !== undefined && t.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary text-[9px] font-bold rounded-full flex items-center justify-center">
                  {t.count > 99 ? "99+" : t.count}
                </span>
              )}
            </div>
            <span className="text-[9px] leading-none font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function ShortcutCard({ icon: Icon, label, desc, color, onClick }: { icon: any; label: string; desc: string; color: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="m3-card p-4 cursor-pointer hover:shadow-md transition-all">
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <h4 className="text-sm font-semibold text-on-surface">{label}</h4>
      <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
    </div>
  );
}

function AiSearchDialog({ type, onClose, onSearch, query, setQuery, loading }: {
  type: "scholarships" | "internships";
  onClose: () => void;
  onSearch: () => void;
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="m3-dialog-overlay" onClick={onClose}>
      <div className="m3-dialog" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">AI Search</h2>
              <p className="text-sm text-on-surface-variant">Find {type} matching your criteria</p>
            </div>
          </div>
          <button onClick={onClose} className="m3-btn-text p-2"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pb-5">
          <div className="flex gap-2">
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && !loading && onSearch()}
              className="m3-field flex-1" placeholder="e.g. STEM, engineering, arts..." />
            <button onClick={onSearch} disabled={loading} className="m3-btn-filled text-sm px-5 py-2 shrink-0">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Search</> : <><Sparkles className="w-4 h-4" /> Search</>}
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">AI will search the web for legitimate {type} matching your query.</p>
        </div>
      </div>
    </div>
  );
}