/**
 * PSC Political Classification System — V1 (client spec).
 * Figma: "Chips" (profile label), "Political-Information" (5 variants),
 * "Political-Bias-Content-Preference" (feed range sheet).
 *
 * Values: 0 Radical Left · 1 Left · 2 Center · 3 Right · 4 Radical Right.
 */
export const POLITICAL_MIN = 0;
export const POLITICAL_MAX = 4;

const NOTICE =
  "This label does not represent an independent or arbitrary classification framework. Instead, it consolidates commonly held political positions from around the world into a unified system that reflects the broad spectrum of political perspectives of the global population. It accounts for varying interpretations of the left-right political spectrum, incorporating diverse cultural, religious, and national perspectives into a universal classification framework, including views and values held within different societies by populations worldwide.";

export const POLITICAL_MAP_INTRO =
  "Political labels are defined by Super Intelligence through the live analysis of hundreds of thousands of data points related to global geopolitical developments, societal norms, cultural and religious values, and political organizations.\n\nThis five-level political spectrum is designed to reflect the diverse political perspectives of populations worldwide. Individual classifications are determined exclusively by users’ behavior and interactions within the PSC community, evaluated against 10 key political criteria.";

/** Client note shown with the label: analysis is limited to PSC interactions. */
export const POLITICAL_SCOPE_NOTE =
  "PSC SI analysis restricts itself to interactions made on the platform and does not include in its analysis external interactions that a user could have made. A label doesn’t define the user’s orientation outside the platform.";

// The 10 key criteria — Figma row icon (Material Symbols Rounded) + label
export const POLITICAL_CRITERIA = [
  { key: "IMMIGRATION", label: "Immigration", icon: "groups" },
  { key: "GENDER_DOCTRINE", label: "Gender Doctrine", icon: "woman" },
  { key: "SEXUAL_DOCTRINE", label: "Sexual Doctrine", icon: "favorite" },
  { key: "CULTURAL_IDENTITY", label: "Cultural Identity", icon: "fingerprint" },
  { key: "ABORTION", label: "Abortion", icon: "pregnant_woman" },
  { key: "ASSISTED_DYING", label: "Assisted Dying", icon: "elderly" },
  { key: "ECONOMIC_IDEOLOGY", label: "Economic Ideology", icon: "account_balance" },
  { key: "POLITICAL_SYSTEM", label: "Political System", icon: "gavel" },
  { key: "STATE_AUTHORITY", label: "State Authority", icon: "local_police" },
  { key: "SOCIETY_MODEL", label: "Society Model", icon: "diversity_3" },
];

export const POLITICAL_ORIENTATIONS = [
  {
    value: 0,
    key: "RADICAL_LEFT",
    label: "Radical Left",
    tileLabel: "Radical\nLeft",
    chipBg: "rgba(238, 16, 69, 1)",
    dot: "rgba(238, 16, 69, 1)",
    headerColor: "rgba(238, 16, 69, 1)",
    overview:
      "The Radical Left generally supports fundamental transformation of society through aggressive actions, strong state intervation, multiculturalism and progressive ideologies & policies. It seeks to replace an existing society for a believed new & better one.",
    positions: [
      "Unrestricted immigration",
      "Feminism / Matriarchy / Female Centered",
      "LGBTQ+ Promotion Among Adults & Under-Age (Minors)",
      "Unrestricted multiculturalism",
      "Late Abortion nor Up To Birth",
      "Broad Human Death Assistance",
      "Marxism, Communism, Maoism, Stalinism, Fascism",
      "Revolutionary Collectivism",
      "Ideological state control",
      "Revolutionary Internationalism",
    ],
  },
  {
    value: 1,
    key: "LEFT",
    label: "Left",
    tileLabel: "Left",
    chipBg: "rgba(238, 16, 69, 0.64)",
    dot: "rgba(167, 25, 59, 1)",
    headerColor: "rgba(167, 25, 59, 1)",
    overview:
      "The Left generally supports social combat, state intervation, multiculturalism and progressive ideologies & policies. It seeks to reduce social and economic gaps through stronger public services and regulation.",
    positions: [
      "Strong legal immigration",
      "Feminism / Matriarchy / Leaning-Female Centered",
      "LGBTQ+ Advocacy",
      "Multiculturalism",
      "Later-Stage Abortion with restrictions",
      "Regulated assisted dying",
      "Socialism",
      "Social Democracy",
      "Strong State Intervention",
      "Progressive Multicultural Society",
    ],
  },
  {
    value: 2,
    key: "CENTER",
    label: "Center",
    tileLabel: "Center",
    chipBg: "rgba(255, 255, 255, 0.08)",
    dot: "rgba(255, 255, 255, 0.64)",
    headerColor: "rgba(255, 255, 255, 0.16)",
    overview:
      "The Center generally seeks a balance between social progress and tradition, combining market economy with a strong rule of law and social cohesion.",
    positions: [
      "Regulated legal immigration",
      "Humanism / Egalitarianism",
      "Egalitarism / Equal Individual Rights",
      "Contained Monoculturalism",
      "Early-Stage Abortion with Medical Exceptions",
      "Non-Lethal Medical And Eldery Care",
      "Social Market Economy",
      "Constitutional Democracy",
      "Balanced Rule Of Law",
      "Civic Pluralism And Social Cohesion",
    ],
  },
  {
    value: 3,
    key: "RIGHT",
    label: "Right",
    tileLabel: "Right",
    chipBg: "rgba(0, 123, 255, 0.64)",
    dot: "rgba(15, 94, 178, 1)",
    headerColor: "rgba(15, 94, 178, 1)",
    overview:
      "The Right generally supports individual freedom, economic liberalism, traditional values and a more limited government and skill-based immigration.",
    positions: [
      "Selective Immigration",
      "Humanism / Egalitarianism",
      "Individual Freedom & Private Choice",
      "Monoculturalism",
      "Exceptional Circumstances Only",
      "Prohibition/Palliative Care",
      "Economic Liberalism & Capitalism",
      "Conservative Democracy",
      "Limited Government",
      "Traditional National Society",
    ],
  },
  {
    value: 4,
    key: "RADICAL_RIGHT",
    label: "Radical Right",
    tileLabel: "Radical\nRight",
    chipBg: "rgba(0, 123, 255, 1)",
    dot: "rgba(0, 123, 255, 1)",
    headerColor: "rgba(0, 123, 255, 1)",
    overview:
      "The Radical Right generally supports a strong national identity & sovreignty, national protectionism, individual responsability, and evolving with a mixture of proud traditional and cultural heritage roots, and technological innovation.",
    positions: [
      "No Immigration / Remigration",
      "Humanism / Patriarchy / Male centered",
      "Heterosexual Norm",
      "Strong Patriotism / Nationalism",
      "Criminalized Abortion",
      "Complete Prohibition",
      "Ultra-Liberalism / Free Entreprise",
      "Centralized National Leadership",
      "Centralized National Authority",
      "Identitarian Nationalism",
    ],
  },
];

export const POLITICAL_NOTICE = NOTICE;

export const isPoliticalValue = (v) =>
  Number.isInteger(v) && v >= POLITICAL_MIN && v <= POLITICAL_MAX;

export const getOrientation = (value) =>
  POLITICAL_ORIENTATIONS.find((o) => o.value === value) || null;

/** Pro accounts (individual / company) are classified by PSC; regular users declare. */
export const isProAccount = (user) =>
  user?.role === "company" || user?.role === "individual" || !!user?.profile?.isPro;

/**
 * Label to show on a profile (0–4) or null.
 * Other users' profiles carry `politicalLabel` from the backend (privacy
 * applied there); the signed-in user's own data carries the raw `political`
 * block, where the owner always sees their own label.
 */
export const getProfileLabel = (user) => {
  if (!user) return null;
  if (isPoliticalValue(user.politicalLabel)) return user.politicalLabel;
  if (user.politicalLabel === null) return null;
  const p = user.political || {};
  if (isProAccount(user)) {
    return isPoliticalValue(p.aiClassification) ? p.aiClassification : null;
  }
  return isPoliticalValue(p.declaredOrientation) ? p.declaredOrientation : null;
};

export const DEFAULT_CONTENT_PREFERENCE = {
  feedMin: POLITICAL_MIN,
  feedMax: POLITICAL_MAX,
  filterNewsProviders: true,
  filterUsers: true,
  filterContent: true,
};

export const getContentPreference = (user) => {
  const p = user?.political || {};
  return {
    feedMin: isPoliticalValue(p.feedMin) ? p.feedMin : POLITICAL_MIN,
    feedMax: isPoliticalValue(p.feedMax) ? p.feedMax : POLITICAL_MAX,
    filterNewsProviders: p.filterNewsProviders !== false,
    filterUsers: p.filterUsers !== false,
    filterContent: p.filterContent !== false,
  };
};
