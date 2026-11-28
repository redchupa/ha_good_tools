import { createContext, useContext } from 'react';
import { translatePhrase, type LangMode } from '../data/locales';

export const Language = createContext<LangMode>('ko');

export function useText() {
  const lang = useContext(Language);
  return (korean: string, english: string) => translatePhrase(lang, korean, english);
}
