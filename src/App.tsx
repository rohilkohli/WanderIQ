import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth } from './firebase';
import { useAuthStore } from './store/useAuthStore';
import AppShell from './components/layout/AppShell';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy-loaded pages for code splitting
const Landing    = lazy(() => import('./pages/Landing'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Discover   = lazy(() => import('./pages/Discover'));
const Planner    = lazy(() => import('./pages/Planner'));
const Budget     = lazy(() => import('./pages/Budget'));
const Packing    = lazy(() => import('./pages/Packing'));
const Profile    = lazy(() => import('./pages/Profile'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <LoadingScreen />
  </div>
);

function App() {
  const { setUser, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  if (loading) return <LoadingScreen fullScreen />;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   'var(--color-surface)',
            color:        'var(--color-text-primary)',
            border:       '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily:   'var(--font-body)',
            fontSize:     '0.9375rem',
          },
          success: { iconTheme: { primary: 'var(--color-accent)', secondary: 'white' } },
          error:   { iconTheme: { primary: 'var(--color-error)',  secondary: 'white' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App routes — wrapped in AppShell */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discover"  element={<Discover />} />
            <Route path="/planner"   element={<Planner />} />
            <Route path="/planner/:id" element={<Planner />} />
            <Route path="/budget"    element={<Budget />} />
            <Route path="/packing"   element={<Packing />} />
            <Route path="/profile"   element={<Profile />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
