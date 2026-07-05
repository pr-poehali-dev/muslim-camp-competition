import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-display text-xl font-bold text-cocoa">Что-то пошло не так 🌸</p>
          <p className="text-sm text-muted-foreground">Попробуй обновить страницу</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-95"
          >
            Обновить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
