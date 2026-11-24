import { createContext, useContext } from 'react';
export const Language = createContext<'ko' | 'en'>('ko');
export function useText() {
  const lang = useContext(Language);
  return (ko:string, en:string) => lang === 'en' ? en : ko;
}
