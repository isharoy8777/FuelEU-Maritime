import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './ui/layout/DashboardLayout';
import { RoutesPage } from './ui/pages/RoutesPage';
import { ComparePage } from './ui/pages/ComparePage';
import { BankingPage } from './ui/pages/BankingPage';
import { PoolingPage } from './ui/pages/PoolingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/routes" replace />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/banking" element={<BankingPage />} />
          <Route path="/pooling" element={<PoolingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
