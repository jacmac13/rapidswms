'use client';
import { Component, type ReactNode } from 'react';
interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }
export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback ?? <p className="text-risk-high">Something went wrong. Please refresh and try again.</p>;
    return this.props.children;
  }
}
