import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileSystemProvider } from './context/FileSystemContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import DocumentView from './pages/DocumentView';
import FolderView from './pages/FolderView'; // New import

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
