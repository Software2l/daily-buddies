import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import {
  DEFAULT_LANGUAGE,
  getTranslations,
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
  type Translations,
} from "../i18n/translations";

type I18nContextShape = {
  language: SupportedLanguage;
  translations: Translations;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
};

const I18nContext = createContext<I18nContextShape | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const hydrateLanguage = async () => {
      try {
        const stored = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
        if (stored === "en" || stored === "mm") {
          setLanguageState(stored);
        }
      } catch (error) {
        console.warn("i18n hydrate error", error);
      }
    };

    void hydrateLanguage();
  }, []);

  const setLanguage = async (value: SupportedLanguage) => {
    setLanguageState(value);
    try {
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, value);
    } catch (error) {
      console.warn("i18n persist error", error);
    }
  };

  const translations = useMemo(() => getTranslations(language), [language]);

  const value: I18nContextShape = {
    language,
    translations,
    setLanguage,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
};
