import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Trackit ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-6">
          <div className="max-w-md w-full bg-white border border-border rounded-r shadow-sm p-8 text-center">
            <div className="text-[40px] mb-3">⚠️</div>
            <h1 className="text-[18px] font-bold text-text-1 mb-2">Something went wrong</h1>
            <p className="text-[13px] text-text-3 mb-5 leading-relaxed">
              An unexpected error occurred. Reload the page to continue — your data is safe.
            </p>
            <p className="text-[11px] text-text-3 font-mono bg-bg border border-border rounded px-3 py-2 mb-5 text-left break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-5 py-2 rounded-rs text-[13px] font-semibold border-none cursor-pointer hover:bg-primary-hover transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
