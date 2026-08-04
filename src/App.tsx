import React, { lazy, Suspense, useState, useEffect } from "react";
import { BookOpen, GraduationCap, Sparkles, Sun, Moon, Search, Calendar, DollarSign, FileText, ShieldCheck, ArrowRight, Upload } from "lucide-react";

const M3App = lazy(() => import("./themes/m3/App"));

export default function App() {
  const [started, setStarted] = useState(() => localStorage.getItem("aid_started") === "true");
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("aid_landing_dark");
    return saved !== null ? saved === "true" : false;
  });

  useEffect(() => {
    localStorage.setItem("aid_landing_dark", String(dark));
    document.documentElement.classList.toggle("landing-dark", dark);
  }, [dark]);

  const handleStart = () => {
    localStorage.setItem("aid_started", "true");
    setStarted(true);
  };

  const handleStartWithResume = () => {
    localStorage.setItem("aid_open_scanner", "true");
    handleStart();
  };

  if (started) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#141218] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#90CAF9] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <M3App />
      </Suspense>
    );
  }

  const bg = dark ? "bg-[#0f0f11] text-gray-100" : "bg-[#f5f5f7] text-gray-900";
  const cardBg = dark ? "bg-[#1c1c1e]" : "bg-white";
  const cardBorder = dark ? "border-[#2c2c2e]" : "border-gray-200";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const accent = "text-[#2563eb]";

  const features = [
    { icon: Search, title: "AI-Powered Search", desc: "Find scholarships and internships using natural language. Gemini AI discovers new opportunities beyond pre-seeded lists." },
    { icon: Calendar, title: "College Deadlines", desc: "Track ED/RD cycles, tuition, acceptance rates, and financial aid. AI recommends colleges based on your interests." },
    { icon: DollarSign, title: "Cost Calculator", desc: "Project net costs after aid, model loan scenarios, and estimate monthly payments for any college." },
    { icon: FileText, title: "Resume Scanner", desc: "Upload a PDF resume for AI analysis. Extract your profile and see which opportunities match you best — scored out of 7." },
    { icon: ShieldCheck, title: "Scam Detection", desc: "Every opportunity is checked for scam indicators. Flagged results show a warning so you know what's legitimate." },
    { icon: BookOpen, title: "Bookmarks & Tracking", desc: "Save favorites, mark awards as won with dollar amounts, and get deadline alerts 7 days before applications close." },
  ];

  const btn = "inline-flex items-center gap-2 bg-[#2563eb] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#1d4ed8] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#2563eb]/20";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <style>{`
        .landing-dark { color-scheme: dark; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUp 0.5s ease-out both; }
      `}</style>

      {/* Fixed top bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${cardBg} border-b ${cardBorder} h-14 flex items-center justify-between px-4 md:px-8`}>
        <div className="flex items-center gap-2">
          <img src={dark ? "/logo-dark.svg" : "/logo.svg"} alt="Atlas" className="w-7 h-7 rounded" />
          <span className="font-semibold text-sm">The Admissions Atlas</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Upload Resume — hidden on mobile (available in hero below) */}
          <button onClick={handleStartWithResume} className={`hidden sm:inline-flex items-center gap-2 bg-[#2563eb] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#1d4ed8] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#2563eb]/20`}>
            <Upload className="w-4 h-4" /> Upload Resume
          </button>
          {/* Go to Dashboard — text label hidden on mobile, icon + short label shown */}
          <button onClick={handleStart} className={btn}>
            <span className="hidden sm:inline">Go to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => setDark(!dark)} className={`p-2 rounded-lg ${cardBg} border ${cardBorder} hover:opacity-80 transition-all`} title="Toggle theme">
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-16 animate-fade-up">

        {/* Hero section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img src={dark ? "/logo-dark.svg" : "/logo.svg"} alt="Atlas" className="w-24 h-24 rounded-2xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            The Admissions Atlas
          </h1>
          <p className={`text-lg md:text-xl ${muted} max-w-2xl mx-auto leading-relaxed`}>
            Your central hub for scholarships, internships, college deadlines, and financial aid planning — all in one place.
          </p>
          <button onClick={handleStartWithResume} className={`${btn} text-base px-8 py-3`}>
            <Upload className="w-5 h-5" /> Upload Resume & Get Started
          </button>
          <p className={`text-sm ${muted} max-w-lg mx-auto`}>
            AI reads your PDF or text resume, extracts your profile, and scores matching scholarships and internships — all in seconds.
          </p>
        </div>

        {/* How it works */}
        <div className="text-center space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#2563eb]">How It Works</h2>
          <p className="text-2xl font-semibold">Three simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: Search, step: "01", title: "Discover", desc: "Search scholarships and internships with AI, or browse our curated lists." },
              { icon: BookOpen, step: "02", title: "Track", desc: "Bookmark opportunities, mark them as won, and get deadline reminders." },
              { icon: DollarSign, step: "03", title: "Plan", desc: "Run cost projections, compare colleges, and model financial aid scenarios." },
            ].map((item, i) => (
              <div key={i} className={`${cardBg} border ${cardBorder} rounded-xl p-6 text-left space-y-3 hover:shadow-lg transition-shadow`}>
                <span className="text-xs font-mono text-[#2563eb]">{item.step}</span>
                <item.icon className={`w-6 h-6 ${accent}`} />
                <h3 className="font-semibold">{item.title}</h3>
                <p className={`text-sm ${muted}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Everything you need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {features.map((f, i) => (
              <div key={i} className={`${cardBg} border ${cardBorder} rounded-xl p-5 space-y-2 hover:shadow-lg transition-shadow`}>
                <f.icon className={`w-5 h-5 ${accent}`} />
                <h3 className="font-semibold">{f.title}</h3>
                <p className={`text-sm ${muted} leading-relaxed`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-6 space-y-4`}>
          <h2 className="font-semibold text-center">Built With</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["React 19", "TypeScript", "Tailwind CSS", "Express", "Supabase", "Gemini AI", "Vercel"].map(t => (
              <span key={t} className={`px-3 py-1 rounded-full text-xs font-medium ${cardBg} border ${cardBorder} ${muted}`}>{t}</span>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-4 pt-8">
          <p className="text-lg font-semibold">Ready to get started?</p>
          <p className={`text-sm ${muted}`}>No sign-up required to browse. Sign in to save your progress across sessions.</p>
          <button onClick={handleStartWithResume} className={`${btn} text-base px-8 py-3`}>
            <Upload className="w-5 h-5" /> Upload Resume & Get Started
          </button>
          <p className={`text-xs ${muted} max-w-md mx-auto`}>
            Drop a .pdf or .txt file. AI extracts your GPA, field of study, skills, and extracurriculars then shows your best-fit opportunities.
          </p>
        </div>

      </div>
    </div>
  );
}