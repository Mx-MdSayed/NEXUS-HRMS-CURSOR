import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Card, CardContent } from '@/components/ui'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

/** Global React error boundary — hides stack traces from end users. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message?.slice(0, 160) || 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep technical detail in the console only — never render stacks in UI.
    console.error('Application error boundary caught:', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' })
  }

  private handleHome = () => {
    this.setState({ hasError: false, message: '' })
    window.location.assign('/dashboard')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4 dark:bg-surface-950">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <p className="font-display text-3xl font-semibold text-surface-900 dark:text-surface-50">
              Something went wrong.
            </p>
            <p className="max-w-sm text-sm text-surface-500 dark:text-surface-400">
              {this.props.fallbackTitle ??
                'The page failed to render. You can try again or return to the dashboard.'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={this.handleRetry}>Try again</Button>
              <Button variant="secondary" onClick={this.handleHome}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
