import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuthStore, initializeAuth, signOut, verifySession } from './lib/auth';
import Dashboard from './components/Dashboard';
import WorkersList from './components/WorkersList';
import AddWorker from './components/AddWorker';
import Statistics from './components/Statistics';
import Login from './components/Login';
import RedirectPage from './components/RedirectPage';
import QRCodeGenerator from './components/QRCodeGenerator';
import LanguageSwitcher from './components/LanguageSwitcher';
import { UserCircleIcon, QrCodeIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { LanguageContext, t } from './lib/i18n';
import Button from './components/ui/Button';

function App() {
  const { user, loading, error } = useAuthStore();
  const location = useLocation();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Verify session periodically
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        verifySession();
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle QR code redirects
  if (location.pathname.startsWith('/r/')) {
    return (
      <Routes>
        <Route path="/r/:code" element={<RedirectPage />} />
      </Routes>
    );
  }

  // Redirect root path to mobila-buna.md
  if (location.pathname === '/') {
    window.location.href = 'https://mobila-buna.md/';
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only show redoman panel content when accessing /redoman
  if (location.pathname.startsWith('/redoman')) {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-100">
          <Login />
          {error && (
            <div className="max-w-md mx-auto mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
        </div>
      );
    }

    return (
      <LanguageContext.Provider value={{ language, setLanguage, t: (key) => t(key, language) }}>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                  <Link 
                    to="/redoman" 
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span>{t('dashboard', language)}</span>
                  </Link>
                  <Link 
                    to="/redoman/workers" 
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    <UsersIcon className="h-5 w-5" />
                    <span>{t('workers', language)}</span>
                  </Link>
                  <Link 
                    to="/redoman/qr-generator" 
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    <QrCodeIcon className="h-5 w-5" />
                    <span>{t('qrGenerator', language)}</span>
                  </Link>
                  <Link 
                    to="/redoman/statistics" 
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                    <span>{t('statistics', language)}</span>
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <LanguageSwitcher />
                  <Button
                    variant="secondary"
                    onClick={signOut}
                    className="ml-4"
                  >
                    {t('logout', language)}
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/redoman" element={<Dashboard />} />
              <Route path="/redoman/workers" element={<WorkersList />} />
              <Route path="/redoman/add-worker" element={<AddWorker />} />
              <Route path="/redoman/qr-generator" element={<QRCodeGenerator />} />
              <Route path="/redoman/statistics" element={<Statistics />} />
            </Routes>
          </div>
        </div>
      </LanguageContext.Provider>
    );
  }

  // Handle QR code redirects for any other paths
  return (
    <Routes>
      <Route path="/r/:code" element={<RedirectPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;