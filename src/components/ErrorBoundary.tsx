"use client";

import { Component, type ReactNode } from "react";
import { getStrings } from "@/lib/i18n/strings";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const strings = getStrings();
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h2 className="text-lg font-medium text-cogapp-charcoal mb-2">
              {strings.errorBoundary.title}
            </h2>
            <p className="text-sm text-cogapp-gray mb-4">
              {this.state.error?.message || strings.errorBoundary.message}
            </p>
            <Button onClick={this.handleReset}>
              {strings.errorBoundary.tryAgain}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
