import { useText } from '../hooks/language';

export function LookupNotice({ pending, cache }: { pending: boolean; cache?: string }) {
  const ui = useText();
  return (
    <p role="status" className="text-xs text-slate-600 dark:text-slate-300">
      {pending
        ? ui('조회 중입니다. 외부 서버 보호를 위한 대기 시간이 포함됩니다.', 'Looking up… This includes a short wait to protect the external server.')
        : ui('외부 요청은 2초 이상 기다린 뒤 전송합니다. 같은 서버에는 이전 요청이 끝난 후 최소 10초 간격을 둡니다.', 'External requests wait at least 2 seconds before starting. Requests to the same server are spaced at least 10 seconds after the previous one finishes.')}
      {cache && ' ' + cache}
    </p>
  );
}

export function checkLookupLimit(response: Response, ui: ReturnType<typeof useText>) {
  if (response.status !== 429) return;
  const seconds = Number(response.headers.get('Retry-After'));
  throw new Error(seconds > 0
    ? ui(`조회가 잠시 제한되었습니다. ${seconds}초 후 다시 시도해 주세요.`, `Lookups are temporarily limited. Try again in ${seconds} seconds.`)
    : ui('조회가 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.', 'Lookups are temporarily limited. Please try again shortly.'));
}
