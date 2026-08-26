export { fr } from "./fr";
export { en } from "./en";

export type Locale = "fr" | "en";
export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];
export const DEFAULT_LOCALE: Locale = "fr";

export type TranslationKeys = typeof import("./fr")["fr"];
