"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-keylio-bg-secondary border border-keylio-border-primary rounded-xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-keylio-text-primary mb-2">
            發生錯誤
          </h3>
          <p className="text-sm text-keylio-text-secondary mb-4">
            {this.state.error?.message || "未知錯誤"}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="bg-keylio-teal hover:bg-keylio-teal/90"
          >
            重試
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
