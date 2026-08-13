import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Catches render-time exceptions that would otherwise leave a blank page with
// no feedback. Uses plain colors (theme vars may not be mounted at this point).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed', error, info);
  }
  render() {
    if (this.state.error) {
      const dark = localStorage.getItem('fr_theme') === 'dark';
      const bg = dark ? '#2e2a23' : '#f5ede0';
      const ink = dark ? '#f3ece0' : '#3a352c';
      const muted = dark ? '#b7ad9c' : '#7a7264';
      return (
        <div style={{ minHeight: '100dvh', background: bg, color: ink, fontFamily: 'ThmanyahSans, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 28, maxWidth: 300, lineHeight: 1.5 }}>The app hit an unexpected error. Reloading usually fixes it.</div>
          <button onClick={() => window.location.reload()} style={{ border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600, padding: '12px 32px', borderRadius: 16, background: dark ? '#c9743a' : '#b0602e', color: '#fff' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
