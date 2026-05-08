import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import SignInModal from '@/components/auth/SignInModal';
import ChatDrawer from '@/components/assistant/ChatDrawer';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/discover',  icon: '🔍', label: 'Discover' },
  { to: '/planner',   icon: '📋', label: 'Planner' },
  { to: '/budget',    icon: '💰', label: 'Budget' },
  { to: '/packing',   icon: '🎒', label: 'Packing' },
  { to: '/profile',   icon: '👤', label: 'Profile' },
];

const AppShell: React.FC = () => {
  const { user }            = useAuthStore();
  const { isDark, toggleDark } = usePreferencesStore();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh' }}>
      {/* Top Bar */}
      <header className="app-topbar" role="banner" aria-label="WanderIQ top navigation">
        <NavLink to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}>
          <div style={{
            width:        36,
            height:       36,
            background:   'var(--color-accent)',
            borderRadius: 'var(--radius-md)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4L28 12V20L16 28L4 20V12L16 4Z" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
            WanderIQ
          </span>
        </NavLink>

        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <button
          onClick={() => setShowChat(true)}
          className="btn btn-primary btn-sm"
          aria-label="Open AI travel assistant"
          style={{ gap: 'var(--space-2)' }}
        >
          <span aria-hidden="true">✨</span>
          AI Assistant
        </button>

        <button
          onClick={toggleDark}
          className="btn btn-ghost btn-sm"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ fontSize: '1.25rem', padding: 'var(--space-2)' }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img
              src={user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}&background=1B4332&color=fff`}
              alt={`${user.displayName ?? 'User'} avatar`}
              width={36}
              height={36}
              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
            />
            <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => setShowSignIn(true)} className="btn btn-secondary btn-sm">
            Sign in
          </button>
        )}
      </header>

      {/* Sidebar */}
      <aside className="app-sidebar" aria-label="Primary navigation">
        <nav aria-label="App sections" style={{ padding: 'var(--space-4) var(--space-3)', flex: 1 }}>
          <ul role="list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to} role="listitem">
                <NavLink
                  to={item.to}
                  style={({ isActive }) => ({
                    display:       'flex',
                    alignItems:    'center',
                    gap:           'var(--space-3)',
                    padding:       `${(10)}px var(--space-3)`,
                    borderRadius:  'var(--radius-md)',
                    textDecoration: 'none',
                    fontWeight:    500,
                    fontSize:      '0.9375rem',
                    color:         isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    background:    isActive ? 'var(--color-accent-light)' : 'transparent',
                    transition:    'all var(--transition-fast)',
                    minHeight:     '44px',
                  })}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }} aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom CTA */}
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <button
            className="btn btn-highlight"
            style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
            onClick={() => navigate('/planner')}
          >
            <span aria-hidden="true">+</span>
            New Trip
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="app-main" aria-label="Main content">
        <Outlet />
      </main>

      {/* Modals */}
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      {showChat   && <ChatDrawer onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default AppShell;
