// The messages generated from the pinned contracts version
// (`npm run generate:contracts`). The type of `en.json` types every key, and
// `vi` must have the same shape.
import en from "../messages/en.json";
import vi from "../messages/vi.json";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export type Messages = typeof en;

export const messages: Record<Locale, Messages> = { en, vi };
