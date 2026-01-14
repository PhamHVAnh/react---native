import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Promotions from './pages/Promotions';
import Orders from './pages/Orders';
import Warranties from './pages/Warranties';
import Inventory from './pages/Inventory';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/statistics" element={<Statistics />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/new" element={<ProductForm />} />
                        <Route path="/products/edit/:id" element={<ProductForm />} />
                        <Route path="/promotions" element={<Promotions />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/warranties" element={<Warranties />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
