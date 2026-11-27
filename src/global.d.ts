// Types the keys of next-intl from the generated messages: a key the pinned
// contracts version does not have is a type error (WF2-10).
import type { Locale, Messages } from "./i18n/messages";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
