import { useCallback } from "react";

import { useI18n } from "./I18nProvider";
import { localizeClientName } from "./nameLocalization";

export { localizeClientName } from "./nameLocalization";

export function useClientNameLocalizer(): (name: string) => string {
  const { language } = useI18n();
  return useCallback(
    (name: string) => localizeClientName(name, language),
    [language]
  );
}
