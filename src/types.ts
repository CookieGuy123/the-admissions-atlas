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
  sourceUrl: string;
  fieldOfStudy: string;
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
  type: "Paid" | "Unpaid";
  deadline: string;
  studentLevel: "undergrad" | "grad" | "high_school" | "all";
  description: string;
  requirements: string[];
  isVerified: boolean;
  scamFlag: boolean;
  scamReason: string;
  sourceUrl: string;
  fieldOfStudy: string;
  isNew?: boolean;
  deadlineType?: "exact" | "estimated" | "rolling" | "recurring";
  lastVerifiedAt?: string;
}

export interface College {
  id: string;
  name: string;
  tier: "Ivy League" | "Top Engineering" | "Top Public" | "Top Liberal Arts" | "Specialized Health";
  specialization: "Engineering" | "Health" | "Business" | "Arts" | "Humanities" | "General";
  tuitionSticker: number;
  avgAidPackage: number;
  deadlineED: string;
  deadlineRD: string;
  location: string;
  acceptanceRate: number;
}

export interface UserPreferences {
  age: number;
  studentLevel: "high_school" | "college";
  householdIncome: number;
  fieldOfInterest: string;
}

export interface BookmarkedOpportunity {
  id: string;
  type: "scholarship" | "internship";
  savedAt: string;
  isWon?: boolean;
  wonAmount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "deadline" | "alert" | "system";
}

export interface UserProfile {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}
