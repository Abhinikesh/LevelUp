import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{ background: '#0A0A0F' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
            style={{ background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.3)' }}>
            ⚠️
          </div>
          <h1 className="font-display font-black text-2xl text-white mb-2">
            Something Went Wrong
          </h1>
          <p className="text-muted text-sm max-w-xs mb-2">
            An unexpected error crashed this level. Don't worry — your progress is saved.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs text-coral bg-[#120810] border border-coral/20 rounded-xl p-4 mb-6 max-w-md overflow-auto max-h-36">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleRefresh}
            className="px-6 py-3 rounded-2xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6584)',
                     boxShadow: '0 0 24px rgba(108,99,255,0.35)' }}
          >
            🔄 Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
