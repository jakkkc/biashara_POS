import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import RegisterBusiness from './pages/RegisterBusiness';
import Dashboard from './pages/Dashboard';
import GlobalOps from './pages/GlobalOps';
import Branches from './pages/Branches';
import POS from './pages/POS';
import Layout from './components/Layout';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import Transfers from './pages/Transfers';
import Settings from './pages/Settings';

import Staff from './pages/Staff';
import AuditLog from './pages/AuditLog';

function PrivateRoute({ children, reqRole }: { children: React.ReactNode; reqRole?: string[] }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();
 
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Initializing Biashara POS</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  
  if (isAdmin) {
    if (location.pathname === '/') return <Navigate to="/global-ops" />;
    return <>{children}</>; 
  }
 
  if (!profile?.businessId && location.pathname !== '/register-business') {
    return <Navigate to="/register-business" />;
  }

  // Handle Role-Based Landing Pages
  if (location.pathname === '/') {
    if (profile?.role === 'sales_person') return <Navigate to="/pos" />;
    return <Dashboard />;
  }
  
  if (reqRole && !reqRole.includes(profile?.role || '')) {
    return <Navigate to="/" />;
  }
 
  return <>{children}</>;
}

function AppContent() {
  const { isAdmin } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/register-business" 
          element={
            <PrivateRoute>
              <RegisterBusiness />
            </PrivateRoute>
          } 
        />
        
        <Route path="/" element={<Layout />}>
          <Route index element={
            <PrivateRoute>
              {isAdmin ? <Navigate to="/global-ops" /> : <Dashboard />}
            </PrivateRoute>
          } />
          
          <Route path="global-ops" element={
            <PrivateRoute>
              <GlobalOps />
            </PrivateRoute>
          } />

          <Route path="branches" element={
            <PrivateRoute reqRole={['owner', 'manager']}>
              <Branches />
            </PrivateRoute>
          } />
          
          <Route path="pos" element={
            <PrivateRoute reqRole={['owner', 'manager', 'sales_person']}>
              <POS />
            </PrivateRoute>
          } />

          <Route path="staff" element={
            <PrivateRoute reqRole={['owner']}>
              <Staff />
            </PrivateRoute>
          } />

          <Route path="audit-log" element={
            <PrivateRoute reqRole={['owner', 'manager']}>
              <AuditLog />
            </PrivateRoute>
          } />

          <Route path="inventory" element={
            <PrivateRoute reqRole={['owner', 'manager', 'inventory']}>
              <Inventory />
            </PrivateRoute>
          } />

          <Route path="transactions" element={
            <PrivateRoute reqRole={['owner', 'manager', 'sales_person', 'accountant']}>
              <Transactions />
            </PrivateRoute>
          } />

          <Route path="expenses" element={
            <PrivateRoute reqRole={['owner', 'manager', 'accountant']}>
              <Expenses />
            </PrivateRoute>
          } />

          <Route path="customers" element={
            <PrivateRoute reqRole={['owner', 'manager', 'sales_person']}>
              <Customers />
            </PrivateRoute>
          } />

          <Route path="transfers" element={
            <PrivateRoute reqRole={['owner', 'manager', 'inventory']}>
              <Transfers />
            </PrivateRoute>
          } />

          <Route path="settings" element={
            <PrivateRoute reqRole={['owner']}>
              <Settings />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
