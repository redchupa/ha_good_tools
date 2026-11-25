import { createContext, useContext } from 'react';
export const Language = createContext<'ko' | 'en'>('ko');
const translations = {
  ko: (korean: string, _english: string) => korean,
  en: (_korean: string, english: string) => english,
};

export function useText() {
  const lang = useContext(Language);
  return translations[lang];
}
