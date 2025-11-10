
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import DietaryPlanPage from './pages/DietaryPlanPage';
import FoodAnalysisPage from './pages/FoodAnalysisPage';
import LoggerPage from './pages/LoggerPage';
import PasswordResetPage from './pages/PasswordResetPage';
import Layout from './components/Layout';

const App: React.FC = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return null; // Or a loading spinner
  }
  const { user, loading } = authContext;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
      <Route path="/*" element={user ? (
        <Layout>
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/dietary-plan" element={<DietaryPlanPage />} />
            <Route path="/food-analysis" element={<FoodAnalysisPage />} />
            <Route path="/logger" element={<LoggerPage />} />
            <Route path="*" element={<Navigate to="/chat" />} />
          </Routes>
        </Layout>
      ) : <Navigate to="/auth" />} />
    </Routes>
  );
};

export default App;