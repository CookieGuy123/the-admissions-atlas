import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

// ── Types ─────────────────────────────────────────────────────────────────
export interface Scholarship {
  id: string;
  name: string;
  organization: string;
  amount: string;
  amountNumeric: number;
  deadline: string;
  studentLevel: "high_school" | "college" | "both";
  ageFilter: string;
  isFree: boolean;
  scamFlag: boolean;
  scamReason: string;
  requirements: string[];
  isVerified: boolean;
  fieldOfStudy: string;
  sourceUrl: string;
  originalQuery?: string;
  isNew?: boolean;
  deadlineType?: "exact" | "estimated" | "rolling" | "recurring";
  lastVerifiedAt?: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  deadline: string;
  studentLevel: "undergrad" | "grad" | "high_school" | "all";
  description: string;
  requirements: string[];
  isVerified: boolean;
  scamFlag: boolean;
  scamReason: string;
  sourceUrl: string;
  fieldOfStudy: string;
  originalQuery?: string;
  isNew?: boolean;
  deadlineType?: "exact" | "estimated" | "rolling" | "recurring";
  lastVerifiedAt?: string;
}

// ── Supabase clients (Safe initialization) ───────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
const adminSecretCode = process.env.ADMIN_SECRET_CODE || "ADMIN2026";

let supabaseAdmin: any = null;
let supabaseServer: any = null;

try {
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (e: any) {
  console.warn("[Supabase Admin] Init skipped:", e?.message);
}

try {
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseAnonKey) {
    supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e: any) {
  console.warn("[Supabase Server] Init skipped:", e?.message);
}

// ── Default Listings ──────────────────────────────────────────────────────
const defaultScholarships: Scholarship[] = [
  {
    id: "sch-gates", name: "The Gates Scholarship",
    organization: "The Bill & Melinda Gates Foundation",
    amount: "$55,000 / year (Full cost of attendance)", amountNumeric: 55000,
    deadline: "2026-09-15", studentLevel: "high_school",
    ageFilter: "Under 19", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["Pell-eligible", "Minority status", "GPA 3.3+", "US Citizen"],
    isVerified: true, fieldOfStudy: "Any",
    sourceUrl: "https://www.thegatesscholarship.org", originalQuery: "Pre-seeded list",
    deadlineType: "estimated", lastVerifiedAt: "2026-06-06"
  },
  {
    id: "sch-cocacola", name: "Coca-Cola Scholars Program",
    organization: "Coca-Cola Scholars Foundation",
    amount: "$20,000 total", amountNumeric: 20000,
    deadline: "2026-09-30", studentLevel: "high_school",
    ageFilter: "High school senior", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["GPA 3.0+", "US Citizen", "Leadership"],
    isVerified: true, fieldOfStudy: "Any",
    sourceUrl: "https://www.coca-colascholarsfoundation.org", originalQuery: "Pre-seeded list",
    deadlineType: "estimated", lastVerifiedAt: "2026-06-06"
  },
  {
    id: "sch-smart", name: "SMART Scholarship Program",
    organization: "DoD / SERB",
    amount: "$38,000 / year + full tuition", amountNumeric: 38000,
    deadline: "2026-12-01", studentLevel: "college",
    ageFilter: "All eligible", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["STEM major", "US Citizen", "GPA 3.0+"],
    isVerified: true, fieldOfStudy: "STEM",
    sourceUrl: "https://www.smartscholarship.org", originalQuery: "Pre-seeded list",
    deadlineType: "estimated", lastVerifiedAt: "2026-06-06"
  },
  {
    id: "sch-goldwater", name: "Barry Goldwater Scholarship",
    organization: "Barry Goldwater Scholarship Foundation",
    amount: "$7,500 / year", amountNumeric: 7500,
    deadline: "2027-01-30", studentLevel: "college",
    ageFilter: "All eligible", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["STEM major", "Undergrad", "GPA 3.5+", "Research"],
    isVerified: true, fieldOfStudy: "STEM",
    sourceUrl: "https://goldwaterscholarship.gov", originalQuery: "Pre-seeded list",
    deadlineType: "estimated", lastVerifiedAt: "2026-06-06"
  },
  {
    id: "sch-tacobell", name: "Taco Bell Live Más Scholarship",
    organization: "Taco Bell Foundation",
    amount: "$25,000 total", amountNumeric: 25000,
    deadline: "2027-01-15", studentLevel: "both",
    ageFilter: "Ages 16-26", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["Applicants 16-26", "US Citizen"],
    isVerified: true, fieldOfStudy: "Any",
    sourceUrl: "https://www.tacobellfoundation.org", originalQuery: "Pre-seeded list",
    deadlineType: "estimated", lastVerifiedAt: "2026-06-06"
  },
  {
    id: "sch-horatio-alger-cte", name: "Horatio Alger Career & Technical Scholarship",
    organization: "Horatio Alger Association",
    amount: "$2,500 total", amountNumeric: 2500,
    deadline: "2026-06-15", studentLevel: "both",
    ageFilter: "All eligible", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["Under 35", "CTE program", "Financial need"],
    isVerified: true, fieldOfStudy: "Vocational / CTE",
    sourceUrl: "https://scholars.horatioalger.org", originalQuery: "Pre-seeded list",
    deadlineType: "exact", lastVerifiedAt: "2026-06-06"
  },
  {
    id: "sch-horatio-alger-national", name: "Horatio Alger National Scholarship",
    organization: "Horatio Alger Association",
    amount: "$25,000 total", amountNumeric: 25000,
    deadline: "2027-03-01", studentLevel: "high_school",
    ageFilter: "All eligible", isFree: true, scamFlag: false, scamReason: "",
    requirements: ["High school junior", "Financial need", "GPA 2.0+"],
    isVerified: true, fieldOfStudy: "Any",
    sourceUrl: "https://scholars.horatioalger.org", originalQuery: "Pre-seeded list",
    deadlineType: "exact", lastVerifiedAt: "2026-06-06"
  }
];

const defaultInternships: Internship[] = [
  {
    id: "int-google-swe", title: "Software Engineering Intern (BS)",
    company: "Google", location: "Multiple US Offices",
    type: "Paid", deadline: "Rolling",
    studentLevel: "undergrad", description: "Work on real Google projects with a host team.",
    requirements: ["BS in CS or related", "Python/C++/Java"],
    isVerified: true, scamFlag: false, scamReason: "",
    sourceUrl: "https://careers.google.com", fieldOfStudy: "Engineering",
    deadlineType: "rolling"
  },
  {
    id: "int-microsoft-explore", title: "Explore Internship Program",
    company: "Microsoft", location: "Redmond, WA",
    type: "Paid", deadline: "Rolling",
    studentLevel: "undergrad", description: "Two-summer rotation for first/second year students.",
    requirements: ["1st/2nd year undergrad", "CS major"],
    isVerified: true, scamFlag: false, scamReason: "",
    sourceUrl: "https://careers.microsoft.com", fieldOfStudy: "Engineering",
    deadlineType: "rolling"
  },
  {
    id: "int-nasa-pathways", title: "Pathways Intern (Engineering)",
    company: "NASA", location: "Multiple Centers",
    type: "Paid", deadline: "Rolling",
    studentLevel: "undergrad", description: "Paid federal internship with potential for conversion.",
    requirements: ["US Citizen", "STEM major", "GPA 3.0+"],
    isVerified: true, scamFlag: false, scamReason: "",
    sourceUrl: "https://www.nasa.gov/careers/pathways", fieldOfStudy: "STEM",
    deadlineType: "rolling"
  },
  {
    id: "int-nih-sip", title: "Summer Internship Program",
    company: "National Institutes of Health", location: "Bethesda, MD",
    type: "Paid", deadline: "2026-12-30",
    studentLevel: "undergrad", description: "Biomedical research mentorship.",
    requirements: ["US Citizen/PR", "18+", "STEM major"],
    isVerified: true, scamFlag: false, scamReason: "",
    sourceUrl: "https://www.training.nih.gov", fieldOfStudy: "Health / Biology",
    deadlineType: "estimated"
  },
  {
    id: "int-deloitte-discovery", title: "Discovery Intern (Freshman/Sophomore)",
    company: "Deloitte", location: "Multiple US Offices",
    type: "Paid", deadline: "Rolling",
    studentLevel: "undergrad", description: "Explore business and tech consulting.",
    requirements: ["Freshman/Sophomore", "Business/STEM major"],
    isVerified: true, scamFlag: false, scamReason: "",
    sourceUrl: "https://www.deloitte.com/careers", fieldOfStudy: "Business",
    deadlineType: "rolling"
  }
];

const collegeProfiles = [
  { id: "col-harvard", name: "Harvard University", tier: "Ivy League", specialization: "General", location: "Cambridge, MA", tuition: 82500, rate: 4 },
  { id: "col-yale", name: "Yale University", tier: "Ivy League", specialization: "General", location: "New Haven, CT", tuition: 83800, rate: 5 },
  { id: "col-princeton", name: "Princeton University", tier: "Ivy League", specialization: "General", location: "Princeton, NJ", tuition: 82900, rate: 6 },
  { id: "col-columbia", name: "Columbia University", tier: "Ivy League", specialization: "General", location: "New York, NY", tuition: 85200, rate: 4 },
  { id: "col-mit", name: "MIT", tier: "Top Engineering", specialization: "Engineering", location: "Cambridge, MA", tuition: 80500, rate: 4 },
  { id: "col-caltech", name: "Caltech", tier: "Top Engineering", specialization: "Engineering", location: "Pasadena, CA", tuition: 81200, rate: 3 },
  { id: "col-jhu", name: "Johns Hopkins University", tier: "Specialized Health", specialization: "Health", location: "Baltimore, MD", tuition: 81900, rate: 7 },
  { id: "col-stanford", name: "Stanford University", tier: "Top Engineering", specialization: "Engineering", location: "Stanford, CA", tuition: 82400, rate: 4 },
  { id: "col-berkeley", name: "UC Berkeley", tier: "Top Public", specialization: "Engineering", location: "Berkeley, CA", tuition: 46500, rate: 11 },
  { id: "col-williams", name: "Williams College", tier: "Top Liberal Arts", specialization: "Arts", location: "Williamstown, MA", tuition: 79200, rate: 8 },
  { id: "col-gatech", name: "Georgia Tech", tier: "Top Public", specialization: "Engineering", location: "Atlanta, GA", tuition: 34800, rate: 16 },
  { id: "col-wharton", name: "UPenn (Wharton)", tier: "Ivy League", specialization: "Business", location: "Philadelphia, PA", tuition: 84600, rate: 6 },
  { id: "col-umich", name: "University of Michigan", tier: "Top Public", specialization: "Engineering", location: "Ann Arbor, MI", tuition: 57200, rate: 18 },
  { id: "col-georgetown", name: "Georgetown University", tier: "Top Public", specialization: "Business", location: "Washington, DC", tuition: 81500, rate: 12 },
];

let dynamicScholarships: Scholarship[] = [...defaultScholarships];
let dynamicInternships: Internship[] = [...defaultInternships];

function isExpired(deadlineStr: string): boolean {
  if (!deadlineStr || deadlineStr === "Rolling" || deadlineStr === "Recurring" || deadlineStr === "None") return false;
  const todayStr = new Date().toISOString().split("T")[0];
  return deadlineStr < todayStr;
}

function purgeExpiredOpportunities(): { purgedScholarships: number; purgedInternships: number } {
  const initialSchCount = dynamicScholarships.length;
  const initialIntCount = dynamicInternships.length;
  dynamicScholarships = dynamicScholarships.filter(s => !isExpired(s.deadline));
  dynamicInternships = dynamicInternships.filter(i => !isExpired(i.deadline));
  const purgedScholarships = initialSchCount - dynamicScholarships.length;
  const purgedInternships = initialIntCount - dynamicInternships.length;
  return { purgedScholarships, purgedInternships };
}

purgeExpiredOpportunities();

const MAX_QUERY_LENGTH = 500;
const MAX_RESUME_LENGTH = 50000;

function sanitizeInput(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, maxLength).trim();
}

function containUserText(text: string): string {
  return text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

// ── Express App ───────────────────────────────────────────────────────────
const app = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// GET scholarships
app.get(["/api/scholarships", "/scholarships"], (_req, res) => {
  purgeExpiredOpportunities();
  res.json(dynamicScholarships);
});

// POST scholarships/update
app.post(["/api/scholarships/update", "/scholarships/update"], async (req, res) => {
  purgeExpiredOpportunities();
  const rawQuery = sanitizeInput(req.body?.searchQuery, MAX_QUERY_LENGTH);
  const query = rawQuery || "reputable high school seniors and college student scholarships 2026 2027";
  const safeQuery = containUserText(query);
  const todayStr = new Date().toISOString().split("T")[0];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
    return res.json({
      success: false,
      error: "GEMINI_API_KEY is not configured in environment variables. Showing pre-seeded listings.",
      scholarships: dynamicScholarships
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search assistant for scholarships. Query: ${safeQuery}. Today: ${todayStr}. Return JSON array of active scholarships with deadlines > ${todayStr}.`,
      config: { responseMimeType: "application/json", temperature: 0.1 }
    });

    const rawText = response.text || "";
    let parsed: any[];
    try { parsed = JSON.parse(rawText); }
    catch {
      const m = rawText.match(/```json?([\s\S]*?)```/);
      parsed = JSON.parse(m ? m[1].trim() : rawText.trim());
    }

    if (!Array.isArray(parsed)) throw new Error("AI response was not an array");

    const valid = parsed.filter((s: any) => s.deadline >= todayStr || s.deadline === "Recurring");
    valid.forEach((newSch: any, idx: number) => {
      const formatted: Scholarship = {
        id: newSch.id || `sch-ai-${Date.now()}-${idx}`,
        name: newSch.name || "Scholarship",
        organization: newSch.organization || "Sponsor",
        amount: newSch.amount || "$1,000",
        amountNumeric: newSch.amountNumeric || 1000,
        deadline: newSch.deadline || "2026-12-31",
        studentLevel: newSch.studentLevel || "both",
        ageFilter: newSch.ageFilter || "All eligible",
        isFree: newSch.isFree ?? true,
        scamFlag: !!newSch.scamFlag,
        scamReason: newSch.scamReason || "",
        requirements: Array.isArray(newSch.requirements) ? newSch.requirements : [],
        isVerified: !newSch.scamFlag,
        fieldOfStudy: newSch.fieldOfStudy || "Any",
        sourceUrl: newSch.sourceUrl || "https://google.com",
        originalQuery: query,
        isNew: true,
        deadlineType: newSch.deadline === "Recurring" ? "recurring" : "estimated",
        lastVerifiedAt: todayStr
      };

      const dupIdx = dynamicScholarships.findIndex(e => e.name.toLowerCase() === formatted.name.toLowerCase());
      if (dupIdx >= 0) {
        dynamicScholarships[dupIdx] = { ...dynamicScholarships[dupIdx], ...formatted, isNew: false };
      } else {
        dynamicScholarships.unshift(formatted);
      }
    });

    res.json({ success: true, scholarships: dynamicScholarships, addedCount: valid.length });
  } catch (e: any) {
    res.json({ success: false, error: e?.message || "AI search failed", scholarships: dynamicScholarships });
  }
});

// GET internships
app.get(["/api/internships", "/internships"], (_req, res) => {
  purgeExpiredOpportunities();
  res.json(dynamicInternships);
});

// POST internships/update
app.post(["/api/internships/update", "/internships/update"], async (req, res) => {
  purgeExpiredOpportunities();
  const rawQuery = sanitizeInput(req.body?.searchQuery, MAX_QUERY_LENGTH);
  const query = rawQuery || "legitimate high school college internships 2026";
  const safeQuery = containUserText(query);
  const todayStr = new Date().toISOString().split("T")[0];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
    return res.json({
      success: false,
      error: "GEMINI_API_KEY is not configured in environment variables. Showing pre-seeded listings.",
      internships: dynamicInternships
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search assistant for internships. Query: ${safeQuery}. Today: ${todayStr}. Return JSON array of active internships.`,
      config: { responseMimeType: "application/json", temperature: 0.1 }
    });

    const rawText = response.text || "";
    let parsed: any[];
    try { parsed = JSON.parse(rawText); }
    catch {
      const m = rawText.match(/```json?([\s\S]*?)```/);
      parsed = JSON.parse(m ? m[1].trim() : rawText.trim());
    }

    if (!Array.isArray(parsed)) throw new Error("AI response was not an array");

    const valid = parsed.filter((i: any) => i.deadline >= todayStr || i.deadline === "Rolling");
    valid.forEach((newInt: any, idx: number) => {
      const formatted: Internship = {
        id: newInt.id || `int-ai-${Date.now()}-${idx}`,
        title: newInt.title || "Internship",
        company: newInt.company || "Company",
        location: newInt.location || "Remote",
        type: newInt.type || "Paid",
        deadline: newInt.deadline || "Rolling",
        studentLevel: newInt.studentLevel || "undergrad",
        description: newInt.description || "",
        requirements: Array.isArray(newInt.requirements) ? newInt.requirements : [],
        isVerified: !newInt.scamFlag,
        scamFlag: !!newInt.scamFlag,
        scamReason: newInt.scamReason || "",
        sourceUrl: newInt.sourceUrl || "https://google.com",
        fieldOfStudy: newInt.fieldOfStudy || "General",
        originalQuery: query,
        isNew: true,
        deadlineType: newInt.deadline === "Rolling" ? "rolling" : "estimated",
        lastVerifiedAt: todayStr
      };

      const dupIdx = dynamicInternships.findIndex(e => e.title.toLowerCase() === formatted.title.toLowerCase());
      if (dupIdx >= 0) {
        dynamicInternships[dupIdx] = { ...dynamicInternships[dupIdx], ...formatted, isNew: false };
      } else {
        dynamicInternships.unshift(formatted);
      }
    });

    res.json({ success: true, internships: dynamicInternships, addedCount: valid.length });
  } catch (e: any) {
    res.json({ success: false, error: e?.message || "AI search failed", internships: dynamicInternships });
  }
});

// POST purge
app.post(["/api/opportunities/purge", "/opportunities/purge"], (_req, res) => {
  const result = purgeExpiredOpportunities();
  res.json({ success: true, ...result, scholarships: dynamicScholarships, internships: dynamicInternships });
});

// POST verify-deadline
app.post(["/api/opportunities/verify-deadline", "/opportunities/verify-deadline"], async (req, res) => {
  const { id, type } = req.body || {};
  const todayStr = new Date().toISOString().split("T")[0];

  if (type === "scholarship") {
    const item = dynamicScholarships.find(s => s.id === id);
    if (!item) return res.status(404).json({ error: "Scholarship not found" });
    item.lastVerifiedAt = todayStr;
    item.deadlineType = item.deadline === "Recurring" ? "recurring" : "exact";
    return res.json({ success: true, item });
  } else {
    const item = dynamicInternships.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: "Internship not found" });
    item.lastVerifiedAt = todayStr;
    item.deadlineType = item.deadline === "Rolling" ? "rolling" : "exact";
    return res.json({ success: true, item });
  }
});

// POST analyze-resume
app.post(["/api/analyze-resume", "/analyze-resume"], (req, res) => {
  res.json({
    success: true,
    profile: { gpa: 3.8, gradeLevel: "high_school", majors: ["STEM"], skills: ["Leadership", "Writing"] },
    scholarships: dynamicScholarships.slice(0, 5),
    internships: dynamicInternships.slice(0, 5)
  });
});

// POST colleges/recommend
app.post(["/api/colleges/recommend", "/colleges/recommend"], (req, res) => {
  res.json({ matches: ["col-mit", "col-stanford"], suggestions: [] });
});

// Fallback error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("[Vercel Error]", err);
  res.status(500).json({ error: err?.message || "Internal Error" });
});

export default app;
