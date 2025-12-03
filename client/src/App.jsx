import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

// Layouts
import AdminLayout from './layout/AdminLayout';
import GarzonLayout from './layout/GarzonLayout';
import CocinaLayout from './layout/CocinaLayout';

// Pages Admin
import Dashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/UsersPage';
import MesasPage from './pages/admin/MesasPage';
import ProductosPage from './pages/admin/ProductosPage';

// Pages Garzón
import ComedorPage from './pages/garzon/ComedorPage';
import MisMesasPage from './pages/garzon/MisMesasPage';
import MesaPedidoPage from './pages/garzon/MesaPedidoPage';

// Pages Cocina
import CocinaPage from './pages/cocina/CocinaPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<LoginPage />} />

        {/* 1. ZONA ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} /> 
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="mesas" element={<MesasPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="pedidos" element={<div className="text-white p-10">Historial (Fase 4)</div>} />
        </Route>

        {/* 2. ZONA GARZÓN */}
        <Route path="/garzon" element={<GarzonLayout />}>
           <Route path="comedor" element={<ComedorPage />} />
           <Route path="mis-mesas" element={<MisMesasPage />} />
           <Route path="mesa/:id" element={<MesaPedidoPage />} />
        </Route> 

        {/* 3. ZONA COCINA */}
        <Route path="/cocina" element={<CocinaLayout />}>
           <Route index element={<CocinaPage />} /> 
        </Route>

        {/* REDIRECCIÓN POR DEFECTO */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;