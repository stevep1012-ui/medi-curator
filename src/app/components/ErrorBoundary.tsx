import { Component, type ErrorInfo, type ReactNode } from 'react';

// Top-level error boundary. Without this, any thrown render error (Three.js
// canvas, a malformed response escaping validation, a locale lookup) unmounts the
// whole tree to a blank white page with no recovery path — a catastrophic
// perceived-quality failure for a health product. The fallback is dependency-free
// (inline styles, no i18n/theme) so it still renders when those subsystems are the
// thing that failed, and it is intentionally bilingual since the language context
// may be unavailable at the point of failure.
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No PHI here: log only the error, never user symptom/medication input.
    console.error('Unhandled render error', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#091211',
          color: '#e7efed',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">
            ⚠️
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            일시적인 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 4px', opacity: 0.85 }}>
            화면을 표시하는 중 문제가 생겼어요. 페이지를 새로고침하면 대부분 해결됩니다.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 20px', opacity: 0.6 }}>
            Something went wrong while loading the page. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              appearance: 'none',
              border: 'none',
              borderRadius: 10,
              padding: '12px 22px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#0a5d52',
              color: '#ffffff',
            }}
          >
            새로고침 / Reload
          </button>
          <p style={{ fontSize: 12, lineHeight: 1.6, margin: '20px 0 0', opacity: 0.6 }}>
            응급 상황이라면 즉시 119에 연락하세요. 정신건강 위기 상담은 109(자살예방상담)입니다.
            <br />
            In an emergency call your local emergency number immediately.
          </p>
        </div>
      </div>
    );
  }
}
