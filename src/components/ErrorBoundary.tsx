
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary text-primary">
          <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-ui border border-warning">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-warning mr-3" size={24} />
              <h2 className="text-xl font-bold">Something went wrong</h2>
            </div>
            
            <p className="mb-4">
              An unexpected error occurred in the application. The development team has been notified.
            </p>
            
            <details className="mb-4">
              <summary className="cursor-pointer text-accent">Technical Details</summary>
              <div className="mt-2 p-2 bg-black bg-opacity-20 rounded overflow-auto max-h-48">
                <p className="font-mono text-sm whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </p>
                {this.state.errorInfo && (
                  <p className="font-mono text-sm whitespace-pre-wrap mt-2">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            </details>
            
            <div className="flex justify-end">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
                aria-label="Try to recover from error"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
