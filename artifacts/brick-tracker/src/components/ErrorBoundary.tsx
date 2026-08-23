import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 p-8">
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground font-mono text-sm">
                Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Refresh
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}