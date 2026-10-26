/**
 * Matching › Filters (Figma "Filters"): shared defaults, active-filter count
 * and the query string sent to matching/recommendations + filter-count.
 */
export const DISTANCE_BOUNDS = [1, 100]; // km
export const AGE_BOUNDS = [18, 80]; // yrs

export const INTERESTED_IN_OPTIONS = ["Discussions", "Meetings", "Partnerships"];
/**
 * Client: Industry is the main subject, Niche is relative to it
 * (Technology → Mobile Apps, Game Development, AI, …). Keys are the industry
 * names lower-cased (user data is free text, e.g. "entertainement").
 */
export const NICHES_BY_INDUSTRY = {
  technology: [
    "Mobile Apps",
    "Web Development",
    "Game Development",
    "AI",
    "Cybersecurity",
    "Cloud",
    "Data Science",
    "Hardware",
  ],
  music: [
    "Guitar",
    "Drums",
    "Vocal",
    "Piano",
    "Bass",
    "Violin",
    "Trumpet",
    "Production",
    "DJ",
  ],
  entertainment: ["Film", "TV", "Acting", "Comedy", "Streaming", "Events"],
  gaming: [
    "Esports",
    "Game Streaming",
    "Game Design",
    "Mobile Gaming",
    "Console",
    "PC Gaming",
  ],
  fashion: ["Streetwear", "Luxury", "Modeling", "Styling", "Design", "Photography"],
  food: ["Restaurants", "Catering", "Baking", "Food Blogging", "Nutrition"],
  politics: ["Campaigns", "Policy", "Journalism", "Activism", "Public Relations"],
  sports: ["Football", "Basketball", "Tennis", "Fitness", "Coaching", "Sports Media"],
  travel: ["Tourism", "Hospitality", "Travel Blogging", "Airlines"],
  automotive: ["Electric Vehicles", "Motorsport", "Car Dealers", "Mechanics"],
  finance: ["Investing", "Banking", "Crypto", "Fintech", "Accounting"],
  health: ["Fitness", "Nutrition", "Mental Health", "Medical", "Wellness"],
};
// spelling variants found in user data
NICHES_BY_INDUSTRY.entertainement = NICHES_BY_INDUSTRY.entertainment;

/** Niches of the selected industries, in order, without duplicates. */
export const nichesForIndustries = (industries = []) => {
  const out = [];
  industries.forEach((industry) => {
    const key = String(industry || "").trim().toLowerCase();
    (NICHES_BY_INDUSTRY[key] || []).forEach((niche) => {
      if (!out.includes(niche)) out.push(niche);
    });
  });
  return out;
};

export const DEFAULT_MATCHING_FILTERS = {
  individuals: true,
  companies: true,
  interestedIn: [],
  industries: [],
  niches: [],
  distance: DISTANCE_BOUNDS,
  age: AGE_BOUNDS,
  // Select On The Map (Gold+): { lat, lng, label } or null
  mapCenter: null,
};

export const resolveMatchingFilters = (filters) => ({
  ...DEFAULT_MATCHING_FILTERS,
  ...(filters || {}),
});

const sameRange = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

/** Number shown in the header badge (Figma "Filters 3"). */
export const countActiveFilters = (raw) => {
  const f = resolveMatchingFilters(raw);
  let count = 0;
  if (f.individuals !== f.companies) count += 1;
  count += f.interestedIn.length + f.industries.length + f.niches.length;
  if (!sameRange(f.distance, DISTANCE_BOUNDS)) count += 1;
  if (!sameRange(f.age, AGE_BOUNDS)) count += 1;
  if (f.mapCenter) count += 1;
  return count;
};

/** Query string for the filters the backend can apply. */
export const matchingFilterQuery = (raw) => {
  const f = resolveMatchingFilters(raw);
  const params = [];
  const add = (key, value) =>
    params.push(`${key}=${encodeURIComponent(String(value))}`);
  if (f.individuals && !f.companies) add("lookingFor", "individuals");
  if (f.companies && !f.individuals) add("lookingFor", "companies");
  if (f.industries.length) add("industries", f.industries.join(","));
  // only niches that still belong to a selected industry
  const niches = f.niches.filter((n) =>
    nichesForIndustries(f.industries).includes(n),
  );
  if (niches.length) add("niches", niches.join(","));
  if (!sameRange(f.distance, DISTANCE_BOUNDS)) {
    if (f.distance[0] > DISTANCE_BOUNDS[0]) add("distanceMin", f.distance[0]);
    if (f.distance[1] < DISTANCE_BOUNDS[1]) add("distanceMax", f.distance[1]);
  }
  if (!sameRange(f.age, AGE_BOUNDS)) {
    if (f.age[0] > AGE_BOUNDS[0]) add("ageMin", f.age[0]);
    if (f.age[1] < AGE_BOUNDS[1]) add("ageMax", f.age[1]);
  }
  if (f.mapCenter && Number.isFinite(f.mapCenter.lat) && Number.isFinite(f.mapCenter.lng)) {
    add("lat", f.mapCenter.lat);
    add("lng", f.mapCenter.lng);
  }
  return params.join("&");
};

// Gold plan or higher unlocks Select On The Map
export const hasGoldAccess = (userData) =>
  ["gold", "platinum", "premium", "premiumPlus", "pro"].includes(
    userData?.accountType,
  );
