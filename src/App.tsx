import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { MenuProvider } from './context/MenuContext';
import { ReservationProvider } from './context/ReservationContext';
import { PromotionProvider } from './context/PromotionContext';
import { LoyaltyProvider } from './context/LoyaltyContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { HomePage } from './pages/customer/HomePage';
import { MenuPage } from './pages/customer/MenuPage';
import { AboutPage } from './pages/customer/AboutPage';
import { GalleryPage } from './pages/customer/GalleryPage';
import { ReservationPage } from './pages/customer/ReservationPage';
import { ContactPage } from './pages/customer/ContactPage';
import { LoginPage } from './pages/auth/LoginPage';

import { DashboardPage } from './pages/admin/DashboardPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { MenuAdminPage } from './pages/admin/MenuAdminPage';
import { ReservationsAdminPage } from './pages/admin/ReservationsAdminPage';
import { StaffAdminPage } from './pages/admin/StaffAdminPage';
import { LiveCounterPage } from './pages/admin/LiveCounterPage';
import { PromotionsPage } from './pages/admin/PromotionsPage';
import { OrdersAdminPage } from './pages/admin/OrdersAdminPage';
import { SplashScreen } from './components/common/SplashScreen';

// Public Customer Website Shell with Navbar & Footer
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FA] text-[#10222B]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  return (
    <>
      {showSplash && (
        <SplashScreen 
          onComplete={() => setShowSplash(false)} 
          durationMs={2500} 
        />
      )}
      <AuthProvider>
      <InventoryProvider>
        <MenuProvider>
          <PromotionProvider>
            <LoyaltyProvider>
              <ReservationProvider>
                <BrowserRouter>
                  <Routes>
                    
                    {/* Public Customer Pages */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/menu" element={<MenuPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/reservations" element={<ReservationPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                    </Route>

                    {/* Authentication Page */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Staff & Admin Operations Hub (Customers STRICTLY DENIED) */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/counter"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <LiveCounterPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <OrdersAdminPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/live-counter"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <LiveCounterPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/inventory"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/restock"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <InventoryPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/menu"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <MenuAdminPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/reservations"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <ReservationsAdminPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/promotions"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <PromotionsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/staff"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          <StaffAdminPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback to Home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </ReservationProvider>
            </LoyaltyProvider>
          </PromotionProvider>
        </MenuProvider>
      </InventoryProvider>
    </AuthProvider>
    </>
  );
};

export default App;
