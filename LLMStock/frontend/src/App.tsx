import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Portfolio from './pages/Portfolio';
import Chatbot from './pages/Chatbot';
import Stocks from './pages/Stocks';
import StockDetail from './pages/StockDetail';
import AdminLayout from './components/Layout/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStocks from './pages/admin/AdminStocks';
import AdminLogs from './pages/admin/AdminLogs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="stocks/:id" element={<StockDetail />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="chat" element={<Chatbot />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stocks" element={<AdminStocks />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="portfolios" element={<div className="text-white">Portfolio list coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
