import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, ChefHat } from 'lucide-react';
import { askConfirmation } from '../utils/sweetAlert';
import socket from '../utils/socket';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CocinaLayout() {
  const { isAuth, user, logout } = useAuthStore();

  // Escuchar nuevos pedidos para sonar una alerta
  useEffect(() => {
    socket.on('cocina:nuevo_pedido', (data) => {
      toast.info(`🔔 Nueva comanda: Mesa ${data.mesaId}`, {
        position: "top-center",
        autoClose: 5000,
        theme: "dark",
        style: { fontSize: '1.2rem', fontWeight: 'bold' }
      });
      
      // Sonido de campana (Asegúrate de tener un .mp3 o usa el navegador)
      const audio = new Audio('/new-order.mp3'); 
      audio.play().catch(e => console.log("Audio bloqueado"));
    });

    return () => socket.off('cocina:nuevo_pedido');
  }, []);

  if (!isAuth) return <Navigate to="/login" />;
  if (user.rol !== 'COCINA' && user.rol !== 'ADMIN') return <Navigate to="/login" />;

  const handleLogout = async () => {
    const ok = await askConfirmation('¿Cerrar Cocina?', 'Saldrás del sistema.', 'Sí, salir');
    if (ok) logout();
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <ToastContainer />
      
      {/* Header Cocina */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <ChefHat className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">MONITOR DE COCINA</h1>
            <p className="text-xs text-gray-400 font-medium">Jefe de Cocina: {user.nombre}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-gray-700 hover:bg-red-500/20 hover:text-red-400 text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <LogOut className="w-5 h-5" />
          <span className="font-bold">SALIR</span>
        </button>
      </header>

      {/* Contenido (El tablero) */}
      <main className="flex-1 overflow-hidden p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default CocinaLayout;