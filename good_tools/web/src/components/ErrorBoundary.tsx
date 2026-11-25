import { Component, type ReactNode } from 'react';

interface Props {
  lang?: string;
  resetKey?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || '' };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-500/10 text-center space-y-3">
          <div className="text-base font-bold text-rose-700 dark:text-rose-300">
            {this.props.lang === 'en' ? 'This tool encountered an unexpected error.' : '이 도구에서 예기치 않은 오류가 발생했습니다'}
          </div>
          <div className="text-xs font-mono text-rose-600 dark:text-rose-400 break-all">
            {this.state.message}
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
          >
            {this.props.lang === 'en' ? 'Try again' : '다시 시도'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
