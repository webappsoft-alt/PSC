import moment from "moment";

/**
 * Jobs module shared data (Figma Matching › Add-An-Experience,
 * Select-Employment-Type, Select-Company, Job-Listing).
 */
export const EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Self-Employed",
  "Freelance",
  "Internship",
  "Trainee",
];

// "Rate Your Experience" — select up to 5 keywords across the three groups
export const RATING_GROUPS = [
  {
    key: "environment",
    title: "Work environment",
    options: ["Collboarative", "Supportive", "Open-minded", "Competitive", "Stressful", "Toxic"],
  },
  {
    key: "management",
    title: "Management",
    options: ["Great leadership", "Transparent", "Fairness", "Micromanagement", "Poor communication"],
  },
  {
    key: "career",
    title: "Career & benefits",
    options: ["Career growth", "Good salary", "Flexible hours", "Work-life balance", "Limited growth", "Underpaid"],
  },
];
export const RATING_MAX = 5;
export const RECOMMEND_OPTIONS = ["Yes", "Neutral", "No"];

// Select-Company letter chips (Figma shows A-C … V-Z)
export const LETTER_RANGES = ["A-C", "D-F", "G-I", "J-L", "M-O", "P-R", "S-U", "V-Z"];

// Job marketplace (Figma Job-Listing) — topic chips + status filters
export const JOB_TOPICS = [
  "Technology",
  "Politics",
  "Sports",
  "Music",
  "Fashion",
  "Entertainment",
  "Gaming",
  "Food",
  "Health",
];
export const JOB_LEVELS = ["Junior", "Mid-Level", "Senior", "Lead", "Executive"];
export const WORK_MODES = ["On-site", "Remote", "Hybrid"];
export const SALARY_PERIODS = ["Yearly", "Monthly", "Hourly"];
export const JOB_STATUS_FILTERS = ["Active", "Paused", "Expired"];

// Figma Matching › "Contract-Type" sheet (job creation + Filters › Employment Type)
export const CONTRACT_TYPES = [
  "Casual",
  "Executive",
  "Fixed-term",
  "Freelance",
  "Full-time",
  "Industrial placement",
  "Internship",
  "Part-time",
  "Student Job",
  "Temporary",
  "Union",
  "Zero-hour",
];
// Figma "Location-Based" sheet labels → stored workMode
export const WORK_ARRANGEMENTS = [
  { value: "On-site", label: "Physical/on-site" },
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
];
// Filters › Work Schedule (no Figma sheet content yet — pending client)
export const WORK_SCHEDULES = ["Full-time", "Part-time", "Flexible hours", "Shift work", "Weekends"];
// Figma Salary-Range: $0 … $200,000
export const SALARY_BOUNDS = [0, 200000];
export const SALARY_STEP = 1000;
export const DEFAULT_JOB_FILTERS = {
  types: [],
  modes: [],
  schedules: [],
  salary: null, // [min, max] or null = any
  status: null, // search chips: "Active" | "Paused" | "Expired"
};
export const resolveJobFilters = (f) => ({ ...DEFAULT_JOB_FILTERS, ...(f || {}) });
/** Filters-sheet filters on (red dot on the `tune` button) */
export const countJobFilters = (f) => {
  const v = resolveJobFilters(f);
  return v.types.length + v.modes.length + v.schedules.length + (v.salary ? 1 : 0);
};
/** query params for GET /jobs */
export const jobFilterParams = (f, params) => {
  const v = resolveJobFilters(f);
  if (v.types.length) params.set("types", v.types.join(","));
  if (v.modes.length) params.set("modes", v.modes.join(","));
  if (v.schedules.length) params.set("schedules", v.schedules.join(","));
  if (v.salary) {
    params.set("salaryMin", String(v.salary[0]));
    params.set("salaryMax", String(v.salary[1]));
  }
  if (v.status) params.set("status", v.status.toLowerCase());
  return params;
};
/** "$200,000" */
export const formatMoney = (n) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

// Figma status badges (My-Job-Offers card)
export const JOB_STATUS_STYLE = {
  active: { bg: "rgba(55, 184, 116, 0.16)", color: "rgba(29, 144, 83, 1)", label: "ACTIVE" },
  paused: { bg: "rgba(255, 207, 131, 0.16)", color: "rgba(255, 207, 131, 1)", label: "PAUSED" },
  expired: { bg: "rgba(238, 16, 69, 0.16)", color: "rgba(238, 16, 69, 1)", label: "EXPIRED" },
  // saved with "Save As Draft" (no Figma chip — neutral card chip colours)
  draft: { bg: "rgba(255, 255, 255, 0.04)", color: "rgba(255, 255, 255, 0.48)", label: "DRAFT" },
};
export const MATCH_BADGE = { bg: "rgba(55, 184, 116, 0.16)", color: "rgba(29, 144, 83, 1)" };

/** "Jan 2026 - Present" */
export const formatDateRange = (start, end, current) => {
  const s = start && moment(start).isValid() ? moment(start).format("MMM YYYY") : "";
  const e = current ? "Present" : end && moment(end).isValid() ? moment(end).format("MMM YYYY") : "";
  if (!s && !e) return "";
  return `${s || "—"} - ${e || "—"}`;
};

/** "3 yrs 10 mos" (rounded to the started month) */
export const formatDuration = (start, end, current) => {
  if (!start || !moment(start).isValid()) return "";
  const to = current || !end ? moment() : moment(end);
  const months = Math.max(1, to.diff(moment(start), "months") + 1);
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? "yr" : "yrs"}`);
  if (m) parts.push(`${m} ${m === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
};

/** "1.4k" */
export const formatCompact = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(v);
};

/** "USD 96K-110K" */
export const formatSalary = (salary) => {
  if (!salary || (salary.min == null && salary.max == null)) return "";
  const k = (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v));
  const cur = salary.currency || "USD";
  if (salary.min != null && salary.max != null && salary.min !== salary.max) return `${cur} ${k(salary.min)}-${k(salary.max)}`;
  return `${cur} ${k(salary.min ?? salary.max)}`;
};

export const companyOf = (item) =>
  item?.company && typeof item.company === "object" ? item.company : null;
export const companyName = (item) => companyOf(item)?.name || item?.companyName || "";
export const companyLogo = (item) => companyOf(item)?.logo || item?.companyLogo || "";
export const schoolOf = (item) =>
  item?.institution && typeof item.institution === "object" ? item.institution : null;
export const schoolName = (item) => schoolOf(item)?.name || item?.school || "";
export const schoolLogo = (item) => schoolOf(item)?.logo || "";

export const ratingCount = (rating) =>
  (rating?.environment?.length || 0) + (rating?.management?.length || 0) + (rating?.career?.length || 0);

// Figma New Job Offer sheets
export const EDUCATION_DEGREES = ["Associates", "Bachelor", "Certificate", "Masters", "MBA", "JD", "MD/DO", "Doctorate"];
export const EXPERIENCE_LEVELS = ["None", "1-3 Years", "3-5 Years", "5-7 Years", "7-10 Years"];
export const PAYMENT_TERMS = ["Weekly", "Bi-Weekly", "Monthly", "Bi-Monthly", "Quarterly", "Semestrial", "Yearly"];
export const APPLICATION_RANGES = ["<50km", "<100km", "<250km", "<500km", "<1000km", "Global"];
export const PRIVACY_OPTIONS = ["Public", "Private"];
// SALARY currency (flag image + code)
export const CURRENCIES = [
  { value: "USD", label: "USD", flag: "us" },
  { value: "EUR", label: "EUR", flag: "eu" },
  { value: "CHF", label: "CHF", flag: "ch" },
  { value: "GBP", label: "GBP", flag: "gb" },
];
export const currencyFlag = (code) => CURRENCIES.find((c) => c.value === code)?.flag || "us";
