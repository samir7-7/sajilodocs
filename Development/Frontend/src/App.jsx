import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileSystemProvider } from './context/FileSystemContext';
import { ToastProvider } from './components/common/Toast'; // New import
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import DocumentView from './pages/DocumentView';
import FolderView from './pages/FolderView'; // New import

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  console.log("ProtectedRoute: auth state:", { isAuthenticated, isLoading, user });

  if (isLoading) {
    console.log("ProtectedRoute: rendering loading state...");
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: not authenticated, redirecting...");
    return <Navigate to="/login" />;
  }

  console.log("ProtectedRoute: authenticated, rendering children...");
  return children;
};

function App() {
  console.log("App: rendering...");
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Dashboard Route - Protected */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <FileSystemProvider>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<Dashboard />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/document/:fileId" element={<DocumentView />} />
                    <Route path="/settings" element={<Profile />} />
                    <Route path="/folder/:folderId" element={<FolderView />} /> {/* New route */}
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </FileSystemProvider>
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
