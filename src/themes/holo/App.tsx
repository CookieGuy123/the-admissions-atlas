import React, { useState, useEffect, useRef, useCallback } from "react";
import { Scholarship, Internship, College, BookmarkedOpportunity, NotificationItem, UserProfile } from "../../types";
import ScholarshipsPanel from "./components/ScholarshipsPanel";
import InternshipsPanel from "./components/InternshipsPanel";
import DeadlinesPanel from "./components/DeadlinesPanel";
import AidCalculatorPanel from "./components/AidCalculatorPanel";
import ProfilePanel from "./components/ProfilePanel";
import AuthModal from "./components/AuthModal";
import ResumeScannerModal from "./components/ResumeScannerModal";
import AdminPanel from "./components/AdminPanel";
import ToastContainer from "../../components/ToastContainer";
import { supabase } from "../../supabaseClient";

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
import { 
  Trophy, Bookmark, Clock, Calendar, ShieldCheck, 
  Sparkles, RefreshCw, Layers, Bell, CheckSquare, 
  ExternalLink, User, Settings, AlertTriangle, Play, Home,
  Sun, Moon, DollarSign, LogIn, LogOut, Shield, Maximize2, Minimize2, Upload
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "scholarships" | "internships" | "deadlines" | "calculator" | "profile" | "admin">("overview");
  
  // Theme & Preferences State
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("theme") as "dark" | "light") || "dark");
  const [homePageMode, setHomePageMode] = useState<"hub" | "profile">(() => (localStorage.getItem("homePageMode") as "hub" | "profile") || "hub");
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "Student Explorer");
  const [userLevel, setUserLevel] = useState(() => localStorage.getItem("userLevel") || "undergrad");
  const [wideMode, setWideMode] = useState(() => localStorage.getItem("wideMode") === "true");

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    saveAllUserData({ preferences: { theme: newTheme, homePageMode, userName, userLevel, wideMode } });
  };

  const handleHomePageModeChange = (newMode: "hub" | "profile") => {
    setHomePageMode(newMode);
    localStorage.setItem("homePageMode", newMode);
    saveAllUserData({ preferences: { theme, homePageMode: newMode, userName, userLevel, wideMode } });
  };

  const handleUserNameChange = (newName: string) => {
    setUserName(newName);
    localStorage.setItem("userName", newName);
    saveAllUserData({ preferences: { theme, homePageMode, userName: newName, userLevel, wideMode } });
  };

  const handleUserLevelChange = (newLevel: string) => {
    setUserLevel(newLevel);
    localStorage.setItem("userLevel", newLevel);
    saveAllUserData({ preferences: { theme, homePageMode, userName, userLevel: newLevel, wideMode } });
  };

  const toggleWideMode = () => {
    const next = !wideMode;
    setWideMode(next);
    localStorage.setItem("wideMode", String(next));
    saveAllUserData({ preferences: { theme, homePageMode, userName, userLevel, wideMode: next } });
  };
  
  // Data State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [wonScholarships, setWonScholarships] = useState<{ [id: string]: number }>({});
  const [dismissedNewIds, setDismissedNewIds] = useState<string[]>([]);
  
  // State for Calculator link
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  // Status metrics
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "note-1",
      title: "Deadline Approaching",
      message: "Horatio Alger Career & Technical Scholarship closes June 15 — only 9 days left!",
      timestamp: "10 mins ago",
      isRead: false,
      type: "deadline"
    }
  ]);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: "deadline" | "alert" | "system" }[]>([]);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Auth State
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [showResumeScanner, setShowResumeScanner] = useState(false);
  const [resumeScanData, setResumeScanData] = useState<any>(null);

  // Init Data Sync on Mount
  useEffect(() => {
    fetchInitialData();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) setSession(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // After initial data loads, restore any saved discoveries
  useEffect(() => {
    if (!isLoading && !dataLoaded) {
      loadAllUserData();
      setDataLoaded(true);
    }
  }, [isLoading, dataLoaded]);


  useEffect(() => {
    if (session?.user) {
      const role = session.user.user_metadata?.role || "user";
      setUserProfile(prev => {
        if (prev && prev.role === "admin") return prev;
        return { id: session.user.id, email: session.user.email || "", role, created_at: "" };
      });
      syncAnonBookmarks(session.user.id);
      syncLocalDataToCloud(session.user.id).then(() => {
        loadAllUserData();
      });
    }
  }, [session]);

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
        const deadline = new Date(item.deadline);
        const diff = deadline.getTime() - now.getTime();
        if (diff > 0 && diff <= sevenDays) {
          notifiedDeadlines.current.add(item.id);
          const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
          addPushNotification("Deadline Approaching", `"${item.name}" closes in ${daysLeft} day${daysLeft > 1 ? "s" : ""}!`, "deadline");
        }
      });
    };
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dataLoaded, scholarships, internships]);

  const syncAnonBookmarks = async (userId: string) => {
    const stored = localStorage.getItem("anon_bookmarks");
    if (!stored) return;
    try {
      const items = JSON.parse(stored);
      if (!Array.isArray(items) || items.length === 0) return;
      const merged = [...new Set([...bookmarks, ...items])];
      setBookmarks(merged);
      localStorage.removeItem("anon_bookmarks");
      saveAllUserData({ bookmarks: merged });
    } catch {}
  };

  const saveAllUserData = async (overrides?: {
    scholarships?: Scholarship[];
    internships?: Internship[];
    bookmarks?: string[];
    wonScholarships?: { [id: string]: number };
    dismissedNewIds?: string[];
    preferences?: { theme: string; homePageMode: string; userName: string; userLevel: string; wideMode: boolean };
  }) => {
    const data = {
      scholarships: overrides?.scholarships ?? scholarships,
      internships: overrides?.internships ?? internships,
      bookmarks: overrides?.bookmarks ?? bookmarks,
      wonScholarships: overrides?.wonScholarships ?? wonScholarships,
      dismissedNewIds: overrides?.dismissedNewIds ?? dismissedNewIds,
    };

    if (session?.user) {
      try {
        await fetch("/api/user/save-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            ...data,
            preferences: overrides?.preferences ?? { theme, homePageMode, userName, userLevel, wideMode },
          })
        });
      } catch (e) {
        console.error("Failed to save user data:", e);
      }
    } else {
      localStorage.setItem("discovered_scholarships", JSON.stringify(data.scholarships));
      localStorage.setItem("discovered_internships", JSON.stringify(data.internships));
      localStorage.setItem("won_scholarships_obj", JSON.stringify(data.wonScholarships));
      localStorage.setItem("dismissed_new_ids", JSON.stringify(data.dismissedNewIds));
      if (overrides?.bookmarks) localStorage.setItem("anon_bookmarks", JSON.stringify(overrides.bookmarks));
    }
  };

  const loadAllUserData = async () => {
    let savedScholarships: Scholarship[] | null = null;
    let savedInternships: Internship[] | null = null;
    let savedBookmarks: string[] | null = null;
    let savedWon: { [id: string]: number } | null = null;
    let savedDismissed: string[] | null = null;
    let savedPreferences: { theme?: string; homePageMode?: string; userName?: string; userLevel?: string; wideMode?: boolean } | null = null;

    if (session?.user) {
      try {
        const res = await fetch(`/api/user/load-data?userId=${session.user.id}`);
        const data = await res.json();
        if (data.success) {
          savedScholarships = data.scholarships;
          savedInternships = data.internships;
          savedBookmarks = data.bookmarks;
          savedWon = data.wonScholarships;
          savedDismissed = data.dismissedNewIds;
          savedPreferences = data.preferences;
        }
      } catch (e) {
        console.error("Failed to load user data:", e);
      }
    } else {
      const schData = localStorage.getItem("discovered_scholarships");
      const intData = localStorage.getItem("discovered_internships");
      const wonData = localStorage.getItem("won_scholarships_obj");
      const disData = localStorage.getItem("dismissed_new_ids");
      const bkmData = localStorage.getItem("anon_bookmarks");
      if (schData) try { savedScholarships = JSON.parse(schData); } catch {}
      if (intData) try { savedInternships = JSON.parse(intData); } catch {}
      if (wonData) try { savedWon = JSON.parse(wonData); } catch {}
      if (disData) try { savedDismissed = JSON.parse(disData); } catch {}
      if (bkmData) try { savedBookmarks = JSON.parse(bkmData); } catch {}
    }

    if (savedScholarships && savedScholarships.length > 0) {
      if (savedDismissed) {
        savedScholarships = savedScholarships.map(s =>
          savedDismissed.includes(s.id) ? { ...s, isNew: false } : s
        );
      }
      setScholarships(savedScholarships);
    }
    if (savedInternships && savedInternships.length > 0) {
      if (savedDismissed) {
        savedInternships = savedInternships.map(i =>
          savedDismissed.includes(i.id) ? { ...i, isNew: false } : i
        );
      }
      setInternships(savedInternships);
    }
    if (savedBookmarks) setBookmarks(savedBookmarks);
    if (savedWon) setWonScholarships(savedWon);
    if (savedDismissed) setDismissedNewIds(savedDismissed);
    if (savedPreferences) {
      if (savedPreferences.theme) { setTheme(savedPreferences.theme as "dark" | "light"); localStorage.setItem("theme", savedPreferences.theme); }
      if (savedPreferences.homePageMode) { setHomePageMode(savedPreferences.homePageMode as "hub" | "profile"); localStorage.setItem("homePageMode", savedPreferences.homePageMode); }
      if (savedPreferences.userName) { setUserName(savedPreferences.userName); localStorage.setItem("userName", savedPreferences.userName); }
      if (savedPreferences.userLevel) { setUserLevel(savedPreferences.userLevel); localStorage.setItem("userLevel", savedPreferences.userLevel); }
      if (savedPreferences.wideMode !== undefined) { setWideMode(savedPreferences.wideMode); localStorage.setItem("wideMode", String(savedPreferences.wideMode)); }
    }
  };

  const syncLocalDataToCloud = async (userId: string) => {
    const schData = localStorage.getItem("discovered_scholarships");
    const intData = localStorage.getItem("discovered_internships");
    const wonData = localStorage.getItem("won_scholarships_obj");
    const disData = localStorage.getItem("dismissed_new_ids");
    if (!schData && !intData && !wonData && !disData) return;
    try {
      await fetch("/api/user/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scholarships: schData ? JSON.parse(schData) : [],
          internships: intData ? JSON.parse(intData) : [],
          wonScholarships: wonData ? JSON.parse(wonData) : {},
          dismissedNewIds: disData ? JSON.parse(disData) : [],
          preferences: { theme, homePageMode, userName, userLevel, wideMode },
        })
      });
      localStorage.removeItem("discovered_scholarships");
      localStorage.removeItem("discovered_internships");
      localStorage.removeItem("won_scholarships_obj");
      localStorage.removeItem("dismissed_new_ids");
    } catch {}
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const schRes = await fetch("/api/scholarships");
      const schData = await schRes.json();
      setScholarships(schData);

      const intRes = await fetch("/api/internships");
      const intData = await intRes.json();
      setInternships(intData);
    } catch (e) {
      console.error("Failed to load initial directory records.", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Gemini Crawler Engine (Google Search Grounding)
  const triggerScholarshipAIUpdate = async (query: string) => {
    const res = await fetch("/api/scholarships/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchQuery: query })
    });
    const data = await res.json();
    if (data.success) {
      setScholarships(data.scholarships);
      saveAllUserData({ scholarships: data.scholarships });
      addPushNotification(
        "AI Search Complete",
        `Successfully integrated ${data.addedCount || 3} verified scholarships for: "${query}"`,
        "system"
      );
    } else {
      throw new Error(data.error || "Web crawler index lookup failed.");
    }
  };

  const triggerInternshipAIUpdate = async (query: string) => {
    const res = await fetch("/api/internships/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchQuery: query })
    });
    const data = await res.json();
    if (data.success) {
      setInternships(data.internships);
      saveAllUserData({ internships: data.internships });
      addPushNotification(
        "AI Internships Updated",
        `Discovered ${data.addedCount || 2} new student positions for: "${query}"`,
        "system"
      );
    } else {
      throw new Error(data.error || "Web crawler index lookup failed.");
    }
  };

  // Bookmarking System
  const handleToggleBookmark = (id: string, type: "scholarship" | "internship") => {
    let newBookmarks: string[];

    if (!session) {
      const stored = localStorage.getItem("anon_bookmarks");
      let anon: string[] = stored ? JSON.parse(stored) : [];
      if (anon.includes(id)) {
        anon = anon.filter(b => b !== id);
      } else {
        anon.push(id);
      }
      localStorage.setItem("anon_bookmarks", JSON.stringify(anon));
    }

    if (bookmarks.includes(id)) {
      newBookmarks = bookmarks.filter(b => b !== id);
      setBookmarks(newBookmarks);
      addPushNotification("Bookmark Removed", `Removed item from watch list.`, "system");
    } else {
      newBookmarks = [...bookmarks, id];
      setBookmarks(newBookmarks);
      
      const matchedName = type === "scholarship" 
        ? scholarships.find(s => s.id === id)?.name 
        : internships.find(i => i.id === id)?.title;
        
      addPushNotification(
        "Opportunity Saved",
        `Added "${matchedName || "Opp"}" to favorites list. Watch for upcoming deadlines.`,
        "deadline"
      );
    }

    saveAllUserData({ bookmarks: newBookmarks });
  };

  // Won status manager
  const handleToggleWonStatus = (id: string, amount: number) => {
    let newWon: { [id: string]: number };
    setWonScholarships(prev => {
      const updated = { ...prev };
      if (amount === 0) {
        delete updated[id];
        addPushNotification("Award Removed", "Scholarship won status cleared.", "system");
      } else {
        updated[id] = amount;
        addPushNotification("Award Secured!", `Marked as won: +$${amount.toLocaleString()}! Added to financial calculator.`, "alert");
      }
      newWon = updated;
      return updated;
    });
    setTimeout(() => saveAllUserData({ wonScholarships: newWon }), 0);
  };

  // Manual insertions
  const handleAddManualScholarship = (newSch: Scholarship) => {
    const updated = [newSch, ...scholarships];
    setScholarships(updated);
    saveAllUserData({ scholarships: updated });
    addPushNotification("Manual Track Added", `Created: "${newSch.name}"`, "system");
  };

  const handleAddManualInternship = (newInt: Internship) => {
    const updated = [newInt, ...internships];
    setInternships(updated);
    saveAllUserData({ internships: updated });
    addPushNotification("Manual Internship Tracked", `Created: "${newInt.title}"`, "system");
  };

  // Dismiss "NEW" badge on click
  const handleDismissNewItem = (id: string, type: "scholarship" | "internship") => {
    const updatedDismissed = dismissedNewIds.includes(id) ? dismissedNewIds : [...dismissedNewIds, id];
    setDismissedNewIds(updatedDismissed);
    if (type === "scholarship") {
      setScholarships(prev => prev.map(s => s.id === id ? { ...s, isNew: false } : s));
    } else {
      setInternships(prev => prev.map(i => i.id === id ? { ...i, isNew: false } : i));
    }
    saveAllUserData({ dismissedNewIds: updatedDismissed });
  };

  // Pre-load collegiate cost details to calculator
  const handleSelectCollegeForCalculator = (college: College) => {
    setSelectedCollege(college);
    setActiveTab("calculator");
    addPushNotification(
      "College Pre-Loaded",
      `Sticker cost for ${college.name} loaded into out-of-pocket projection tool.`,
      "system"
    );
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    addPushNotification("Welcome!", "You are now signed in.", "system");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setBookmarks([]);
    setWonScholarships({});
    setDismissedNewIds([]);
    addPushNotification("Signed Out", "Your session has ended.", "system");
  };

  const handleAdminUpgrade = async () => {
    if (!session?.user || !adminCodeInput) {
      addPushNotification("Admin Error", "Enter the admin security code first.", "alert");
      return;
    }
    try {
      const res = await fetch("/api/auth/upgrade-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, code: adminCodeInput })
      });
      const data = await res.json();
      if (data.profile) {
        setUserProfile(data.profile);
        setAdminCodeInput("");
        await supabase.auth.refreshSession();
        addPushNotification("Admin Upgrade", "You are now an admin! Reset controls are active.", "system");
      } else {
        addPushNotification("Admin Error", data.error || "Upgrade failed.", "alert");
      }
    } catch (e: any) {
      addPushNotification("Admin Error", e.message, "alert");
    }
  };

  const isAdmin = userProfile?.role === "admin";

  // Reset database state to original templates
  const handleResetDatabase = async () => {
    if (!isAdmin) {
      addPushNotification("Access Denied", "Only admins can reset sample data.", "alert");
      return;
    }
    if (window.confirm("Restore pre-seeded safe-mode scholarships & internships?")) {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        if (session?.user) {
          await fetch("/api/user/save-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              scholarships: [],
              internships: [],
              bookmarks: [],
              wonScholarships: {},
              dismissedNewIds: [],
            })
          });
        } else {
          localStorage.removeItem("discovered_scholarships");
          localStorage.removeItem("discovered_internships");
          localStorage.removeItem("won_scholarships_obj");
          localStorage.removeItem("dismissed_new_ids");
        }
        fetchInitialData();
        setBookmarks([]);
        setWonScholarships({});
        setDismissedNewIds([]);
        addPushNotification("System Settings", "All application structures successfully restored.", "system");
      }
    }
  };

  // Push Notifications API
  const addPushNotification = (title: string, message: string, type: "deadline" | "alert" | "system") => {
    const now = new Date().toISOString();
    const newItem: NotificationItem = {
      id: `note-${Date.now()}`,
      title,
      message,
      timestamp: now,
      isRead: false,
      type
    };
    setNotifications(prev => [newItem, ...prev]);
    setToasts(prev => [...prev, { id: "t-" + Date.now(), title, message, type }]);

    if (Notification.permission === "granted") {
      new Notification(`[Holo Academic] ${title}`, {
        body: message,
        icon: "/favicon.ico"
      });
    }
  };

  // Calculations for dashboard indicators
  const totalWonTotalValue = (Object.values(wonScholarships) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
  const bookmarkedCount = bookmarks.length;

  return (
    <div className={`min-h-screen bg-holo-black text-white font-sans flex flex-col selection:bg-holo-blue-dark selection:text-black ${theme === "light" ? "theme-light" : ""}`}
      style={{ '--font-sans': "'Roboto', 'Inter', ui-sans-serif, system-ui, sans-serif" } as React.CSSProperties}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Android Action Bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-holo-gray-border bg-holo-black shrink-0 relative">
        <div className="flex items-center gap-3">
          <button 
            className="w-8 h-8 rounded-sm bg-holo-blue-light text-black flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer overflow-hidden" 
            onClick={() => setActiveTab("overview")}
            title="Go to Home Overview"
          >
            <img src="/logo.svg" alt="Home" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base tracking-tight font-medium flex items-center">
              The Admissions Atlas
            </h1>
          </div>
        </div>

        {/* Global Action items */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-holo-blue-light" />
              <span>Bookmarked: <strong className="text-white">{bookmarkedCount}</strong></span>
            </div>
            {isAdmin && (
              <button 
                onClick={handleResetDatabase}
                className="border border-holo-gray-border bg-holo-gray-light hover:bg-holo-blue-dim hover:text-holo-blue-light py-1 px-2.5 text-xs transition-all cursor-pointer"
                title="Reset databases to pre-seeded list"
              >
                Reset Sample Data
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auth button */}
            <div className="group relative">
              <button
                onClick={() => session ? handleLogout() : setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-2 h-8 rounded-sm border border-holo-gray-border bg-holo-gray-light text-holo-blue-light hover:bg-holo-blue-dim hover:border-holo-blue-dark transition-all cursor-pointer"
                title={session ? "Sign out" : "Sign in"}
              >
                {session ? <LogOut className="w-4 h-4 shrink-0" /> : <LogIn className="w-4 h-4 shrink-0" />}
                <span className="text-xs font-mono uppercase max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-200 whitespace-nowrap">
                  {session ? "Logout" : "Login"}
                </span>
              </button>
            </div>

            {/* Wide mode toggle */}
            <div className="group relative">
              <button
                onClick={toggleWideMode}
                className="flex items-center gap-1.5 px-2 h-8 rounded-sm border border-holo-gray-border bg-holo-gray-light text-holo-blue-light hover:bg-holo-blue-dim hover:border-holo-blue-dark transition-all cursor-pointer"
                title={wideMode ? "Constrain width" : "Extend to edges"}
              >
                {wideMode ? <Minimize2 className="w-4 h-4 shrink-0" /> : <Maximize2 className="w-4 h-4 shrink-0" />}
                <span className="text-xs font-mono uppercase max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-200 whitespace-nowrap">
                  {wideMode ? "Narrow" : "Wide"}
                </span>
              </button>
            </div>

            {/* Theme switcher */}
            <div className="group relative">
              <button
                onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-1.5 px-2 h-8 rounded-sm border border-holo-gray-border bg-holo-gray-light text-holo-blue-light hover:bg-holo-blue-dim hover:border-holo-blue-dark transition-all cursor-pointer"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                <span className="text-xs font-mono uppercase max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-200 whitespace-nowrap">
                  Theme
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation Bar */}
      <nav className="flex bg-[#0b0f15] border-b border-holo-gray-border shrink-0 select-none font-sans">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
              : "border-transparent text-gray-400 hover:text-holo-blue-light"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("scholarships")}
          className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === "scholarships"
              ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
              : "border-transparent text-gray-400 hover:text-holo-blue-light"
          }`}
        >
          Scholarships
        </button>
        <button
          onClick={() => setActiveTab("internships")}
          className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === "internships"
              ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
              : "border-transparent text-gray-400 hover:text-holo-blue-light"
          }`}
        >
          Internships
        </button>
        <button
          onClick={() => setActiveTab("deadlines")}
          className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === "deadlines"
              ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
              : "border-transparent text-gray-400 hover:text-holo-blue-light"
          }`}
        >
          Deadlines
        </button>
        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === "calculator"
              ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
              : "border-transparent text-gray-400 hover:text-holo-blue-light"
          }`}
        >
          Calculator
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === "profile"
              ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
              : "border-transparent text-gray-400 hover:text-holo-blue-light"
          }`}
        >
          Profile
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-3 text-center border-b-2 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeTab === "admin"
                ? "border-holo-blue-light text-holo-blue-light bg-holo-blue-dim/10 font-bold"
                : "border-transparent text-gray-400 hover:text-holo-blue-light"
            }`}
          >
            Admin
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      <main className={`flex-grow p-4 md:p-6 w-full mx-auto ${wideMode ? "" : "max-w-7xl"}`}>
        <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div key={activeTab} style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3 font-sans text-xs text-holo-blue-light animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Gathering student opportunities...</span>
          </div>
        ) : (
          <>
            {/* 1. Overview Tab (Dashboard) */}
            {activeTab === "overview" && (
              homePageMode === "profile" ? (
                <ProfilePanel
                  userName={userName}
                  userLevel={userLevel}
                  onChangeUserName={handleUserNameChange}
                  onChangeUserLevel={handleUserLevelChange}
                  theme={theme}
                  onChangeTheme={handleThemeChange}
                  bookmarks={bookmarks}
                  scholarships={scholarships}
                  internships={internships}
                  onToggleBookmark={handleToggleBookmark}
                  wonScholarships={wonScholarships}
                  onToggleWonStatus={handleToggleWonStatus}
                  onResetDatabase={handleResetDatabase}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Console Hub (Dashboard Grid) */}
                  <div className="md:col-span-8 space-y-6">
                    {/* Summary Banner greeting */}
                    <div className="bg-gradient-to-r from-holo-blue-dim/30 to-transparent border border-holo-gray-border p-6 relative">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-holo-blue-light shadow-[0_0_8px_#33b5e5]" />
                      <h2 className="text-2xl font-light uppercase tracking-tight text-white">
                        Home
                      </h2>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans">
                        Your central control hub. Navigate through scholarships, track deadlines, project college costs, and manage your student credentials.
                      </p>
                    </div>

                    {/* Bento Grid Hub Shortcuts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Shortcut: Scholarships */}
                      <div 
                        onClick={() => setActiveTab("scholarships")}
                        className="bg-holo-gray-dark border border-holo-gray-border p-5 hover:border-holo-blue-light/50 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 text-holo-blue-light/20 group-hover:text-holo-blue-light/40 transition-all">
                          <Trophy className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold font-sans text-white uppercase group-hover:text-holo-blue-light transition-all">
                          Scholarship Search
                        </h4>
                        <p className="text-2xs text-gray-400 mt-1 font-sans leading-relaxed">
                          Query live records using AI web search. Filter safe and verified listings.
                        </p>
                        <span className="text-xs text-holo-blue-light font-mono mt-3 inline-block uppercase">
                          Open Finder &rarr;
                        </span>
                      </div>

                      {/* Shortcut: Internships */}
                      <div 
                        onClick={() => setActiveTab("internships")}
                        className="bg-holo-gray-dark border border-holo-gray-border p-5 hover:border-holo-blue-light/50 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 text-holo-blue-light/20 group-hover:text-holo-blue-light/40 transition-all">
                          <Layers className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold font-sans text-white uppercase group-hover:text-holo-blue-light transition-all">
                          Internship Finder
                        </h4>
                        <p className="text-2xs text-gray-400 mt-1 font-sans leading-relaxed">
                          Scan engineering, health, and business opportunities, and flag scams.
                        </p>
                        <span className="text-xs text-holo-blue-light font-mono mt-3 inline-block uppercase">
                          Browse Openings &rarr;
                        </span>
                      </div>

                      {/* Shortcut: Deadlines */}
                      <div 
                        onClick={() => setActiveTab("deadlines")}
                        className="bg-holo-gray-dark border border-holo-gray-border p-5 hover:border-holo-blue-light/50 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 text-holo-blue-light/20 group-hover:text-holo-blue-light/40 transition-all">
                          <Clock className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold font-sans text-white uppercase group-hover:text-holo-blue-light transition-all">
                          College Deadlines
                        </h4>
                        <p className="text-2xs text-gray-400 mt-1 font-sans leading-relaxed">
                          Monitor admissions cycles, sticker tuition rates, and application dates.
                        </p>
                        <span className="text-xs text-holo-blue-light font-mono mt-3 inline-block uppercase">
                          View Calendar &rarr;
                        </span>
                      </div>

                      {/* Shortcut: Net Price Calculator */}
                      <div 
                        onClick={() => setActiveTab("calculator")}
                        className="bg-holo-gray-dark border border-holo-gray-border p-5 hover:border-holo-blue-light/50 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 text-holo-blue-light/20 group-hover:text-holo-blue-light/40 transition-all">
                          <DollarSign className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold font-sans text-white uppercase group-hover:text-holo-blue-light transition-all">
                          Net Cost Calculator
                        </h4>
                        <p className="text-2xs text-gray-400 mt-1 font-sans leading-relaxed">
                          Project out-of-pocket costs with tuition loading and won grant deductions.
                        </p>
                        <span className="text-xs text-holo-blue-light font-mono mt-3 inline-block uppercase">
                          Open Calculator &rarr;
                        </span>
                      </div>

                      {/* Shortcut: Profile */}
                      <div 
                        onClick={() => setActiveTab("profile")}
                        className="bg-holo-gray-dark border border-holo-gray-border p-5 hover:border-holo-blue-light/50 transition-all cursor-pointer group relative overflow-hidden sm:col-span-2"
                      >
                        <div className="absolute top-0 right-0 p-3 text-holo-blue-light/20 group-hover:text-holo-blue-light/40 transition-all">
                          <User className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold font-sans text-white uppercase group-hover:text-holo-blue-light transition-all">
                          My Profile & Preferences
                        </h4>
                        <p className="text-2xs text-gray-400 mt-1 font-sans leading-relaxed">
                          Edit student credentials, toggle preferences, customize your homepage mode, switch themes, and review saved opportunities.
                        </p>
                        <span className="text-xs text-holo-blue-light font-mono mt-3 inline-block uppercase">
                          Open Settings &rarr;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical side column: Notifications */}
                  <div className="md:col-span-4 flex flex-col gap-6">
                    {/* Auth Card */}
                    <div className="bg-holo-gray-dark border border-holo-gray-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-holo-blue-light" />
                        <h3 className="text-xs font-mono text-holo-blue-light uppercase font-bold">
                          {session ? "Account" : "Sign In"}
                        </h3>
                      </div>
                      {session ? (
                        <div className="space-y-2 text-xs text-gray-300 font-sans">
                          <p className="truncate">{session.user?.email}</p>
                          <p className="text-holo-blue-light uppercase text-xs font-mono">
                            Role: {isAdmin ? "Admin" : "User"}
                          </p>
                          {!isAdmin && (
                            <div className="pt-2 space-y-1">
                              <input
                                type="text"
                                placeholder="Admin code..."
                                value={adminCodeInput}
                                onChange={e => setAdminCodeInput(e.target.value)}
                                className="w-full bg-black text-gray-200 border-b border-holo-gray-border px-2 py-1 text-xs font-mono focus:border-holo-blue-light outline-none"
                              />
                              <button
                                onClick={handleAdminUpgrade}
                                className="w-full bg-holo-gray-light border border-holo-gray-border text-gray-300 hover:text-holo-blue-light py-1 text-2xs font-mono uppercase cursor-pointer"
                              >
                                Upgrade to Admin
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-sans">Save your favorites across sessions.</p>
                          <button
                            onClick={() => setShowAuthModal(true)}
                            className="w-full bg-holo-blue-dark text-black uppercase font-mono font-bold text-xs py-1.5 hover:bg-holo-blue-light transition-all cursor-pointer"
                          >
                            Sign In / Register
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notifications panel */}
                    <div className="bg-holo-gray-dark border border-holo-gray-border p-4 flex-1 flex flex-col">
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center border-b border-holo-gray-border pb-2 mb-3">
                          <h3 className="text-xs text-holo-blue-light uppercase font-bold tracking-wider flex items-center gap-1.5 font-sans">
                            <Bell className="w-4 h-4" />
                            Notifications & Alerts
                          </h3>
                          {notifications.some(n => !n.isRead) && (
                            <span className="bg-holo-blue-light text-black text-xs font-bold px-1.5 uppercase animate-pulse">Alerts</span>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3.5">
                          {notifications.length === 0 ? (
                            <div className="text-center text-xs text-gray-500 py-6 font-sans">
                              No active notifications.
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n.id} 
                                className={`p-2.5 border text-xs font-sans relative group ${
                                  n.isRead ? "bg-black/40 border-gray-900 text-gray-500" : "bg-holo-blue-dim/10 border-holo-blue-dark/30 text-gray-200"
                                }`}
                              >
                                <div 
                                  onClick={() => {
                                    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                                  }}
                                  className="cursor-pointer pr-6"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-holo-blue-light uppercase text-xs tracking-wide select-none">&bull; {n.title}</span>
                                    <span className="text-xs text-gray-500 font-normal">{formatTimestamp(n.timestamp)}</span>
                                  </div>
                                  <p className="leading-relaxed font-sans">{n.message}</p>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotifications(prev => prev.filter(item => item.id !== n.id));
                                  }}
                                  className="absolute top-2.5 right-2.5 text-gray-500 hover:text-red-400 font-mono text-xs cursor-pointer font-bold opacity-60 group-hover:opacity-100 transition-opacity"
                                  title="Dismiss notification"
                                >
                                  &times;
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => setNotifications([])}
                        className="w-full mt-4 bg-black border border-holo-gray-border text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all text-xs font-sans uppercase py-1.5 cursor-pointer text-center"
                      >
                        DISMISS ALL NOTIFICATIONS
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* 2. Scholarships Panel */}
            {activeTab === "scholarships" && (
              <ScholarshipsPanel
                scholarships={scholarships}
                bookmarks={bookmarks}
                wonScholarships={wonScholarships}
                isLoading={isLoading}
                onToggleBookmark={handleToggleBookmark}
                onToggleWonStatus={handleToggleWonStatus}
                onTriggerAIUpdate={triggerScholarshipAIUpdate}
                setIsAddingManual={() => {}}
                onAddManualScholarship={handleAddManualScholarship}
                onDismissNewItem={handleDismissNewItem}
                onOpenResumeScanner={() => setShowResumeScanner(true)}
              />
            )}

            {/* 3. Internships Panel */}
            {activeTab === "internships" && (
              <InternshipsPanel
                internships={internships}
                bookmarks={bookmarks}
                isLoading={isLoading}
                onToggleBookmark={handleToggleBookmark}
                onTriggerAIUpdate={triggerInternshipAIUpdate}
                onAddManualInternship={handleAddManualInternship}
                onDismissNewItem={handleDismissNewItem}
                onOpenResumeScanner={() => setShowResumeScanner(true)}
              />
            )}

            {/* 4. Deadlines Panel */}
            {activeTab === "deadlines" && (
              <DeadlinesPanel
                onSelectCollegeForCalculator={handleSelectCollegeForCalculator}
              />
            )}

            {/* 5. Financial Calculator Panel */}
            {activeTab === "calculator" && (
              <AidCalculatorPanel
                preselectedCollege={selectedCollege}
                totalScholarshipsWon={totalWonTotalValue}
              />
            )}

            {/* 7. Admin Panel */}
            {activeTab === "admin" && isAdmin && (
              <AdminPanel userId={session?.user?.id} />
            )}

            {/* 6. Profile Panel */}
            {activeTab === "profile" && (
              <ProfilePanel
                userName={userName}
                userLevel={userLevel}
                onChangeUserName={handleUserNameChange}
                onChangeUserLevel={handleUserLevelChange}
                theme={theme}
                onChangeTheme={handleThemeChange}
                bookmarks={bookmarks}
                scholarships={scholarships}
                internships={internships}
                onToggleBookmark={handleToggleBookmark}
                wonScholarships={wonScholarships}
                onToggleWonStatus={handleToggleWonStatus}
                onResetDatabase={handleResetDatabase}
              />
            )}
          </>
        )}
      </div>
      </main>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Resume Scanner Modal */}
      {showResumeScanner && (
        <ResumeScannerModal
          onClose={() => { setShowResumeScanner(false); setResumeScanData(null); }}
          onData={setResumeScanData}
          data={resumeScanData}
        />
      )}

    </div>
  );
}