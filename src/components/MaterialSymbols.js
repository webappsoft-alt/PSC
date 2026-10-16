import { createIconSet } from "react-native-vector-icons";
import glyphMap from "../assets/fonts/material-symbols/glyphmap.json";

/**
 * Google Material Symbols — Rounded style (weight 400, grade 0, optical size 24),
 * same fonts as the Viral app (assets/fonts/material-symbols). Names are the ones
 * on fonts.google.com/icons (e.g. "verified_user", "close", "pin").
 * Use through <Icons family="MaterialSymbolsRounded" | "MaterialSymbolsRoundedFilled" />.
 */
export const MaterialSymbolsRounded = createIconSet(
  glyphMap,
  "MaterialSymbolsRounded",
  "MaterialSymbolsRounded.ttf",
);

export const MaterialSymbolsRoundedFilled = createIconSet(
  glyphMap,
  "MaterialSymbolsRoundedFilled",
  "MaterialSymbolsRoundedFilled.ttf",
);
