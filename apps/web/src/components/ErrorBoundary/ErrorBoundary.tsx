import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-neutral-12 mb-2">Algo correu mal</h1>
          <p className="text-neutral-11 mb-6 max-w-md">
            Ocorreu um erro inesperado. Por favor, tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent-9 text-white rounded-lg hover:bg-accent-10 transition-colors"
          >
            Recarregar página
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left w-full max-w-2xl">
              <summary className="cursor-pointer text-neutral-9 hover:text-neutral-11">
                Detalhes do erro (dev)
              </summary>
              <pre className="mt-2 p-4 bg-neutral-3 rounded-lg overflow-auto text-xs text-red-11">
                {this.state.error.stack || this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
