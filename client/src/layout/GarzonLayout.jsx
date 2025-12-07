import { useEffect } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore'; // <--- NUEVO STORE
import { Store, LogOut, Utensils, Bell, CheckCheck, X } from 'lucide-react';
import { askConfirmation } from '../utils/sweetAlert';
import socket from '../utils/socket';
import logo from '../assets/logopng.png';

function GarzonLayout() {
  const { isAuth, user, logout } = useAuthStore();
  const { notifications, addNotification, removeNotification } = useNotificationStore();
  // ESCUCHAR EVENTOS
  useEffect(() => {
    if (user?.id) {
      // 1. IDENTIFICARSE: "Hola servidor, soy el garzón con este ID"
      socket.emit('join_user_room', user.id);
    }

    // 2. ESCUCHAR (Esto sigue igual, pero ahora solo llegarán los mensajes dirigidos a ti)
    socket.on('pedido:listo', (data) => {
      // Agregamos al panel persistente
      addNotification({
        title: `Mesa ${data.mesa}`,
        message: `${data.producto} LISTO`,
        type: 'ready' // Tipo para darle color
      });
      
      // Sonido
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log("Audio bloqueado"));
    });

    return () => {
      socket.off('pedido:listo');
    };
  }, [user]); // Agregamos 'user' a la dependencia para que se reconecte si cambia

  if (!isAuth) return <Navigate to="/login" />;
  if (user.rol !== 'GARZON' && user.rol !== 'ADMIN') return <Navigate to="/login" />;

  const handleLogout = async () => {
    const ok = await askConfirmation('¿Salir del turno?', 'Se cerrará tu sesión.', 'Sí, salir');
    if (ok) logout();
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{
      backgroundColor: '#f9f5f1'
    }}>
      
      {/* ================= COLUMNA IZQUIERDA: APP PRINCIPAL (80%) ================= */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-700">
        
        {/* Header */}
        <header className="border-b border-gray-700 px-6 py-2 flex justify-between items-center shrink-0" style={{ backgroundColor: '#A62858' }}>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Buen Sabor" className="w-16 h-16" />
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Utensils className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">MONITOR DE MESAS</h1>
              <p className="text-xs text-gray-300 font-medium">Garzón: {user.nombre}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-400/30 hover:bg-red-400/50 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <LogOut className="w-5 h-5" />
            <span className="font-bold">SALIR</span>
          </button>
        </header>

        {/* Contenido (Outlet) */}
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>

        {/* Navbar Inferior */}
        <nav className="border-t border-gray-700 shrink-0" style={{ backgroundColor: '#A62858' }}>
          <div className="flex justify-around items-center h-16">
            <NavLink to="/garzon/comedor" className={({ isActive }) => 
              `flex flex-col items-center px-6 py-1 rounded-lg transition ${isActive ? 'text-white' : 'text-gray-300'}`}
              style={({ isActive }) => isActive ? { backgroundColor: '#6B2D4D' } : {}}
            >
              <Store className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">MAPA</span>
            </NavLink>

            <NavLink to="/garzon/mis-mesas" className={({ isActive }) => 
              `flex flex-col items-center px-6 py-1 rounded-lg transition ${isActive ? 'text-white' : 'text-gray-300'}`}
              style={({ isActive }) => isActive ? { backgroundColor: '#6B2D4D' } : {}}
            >
              <Utensils className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">MIS MESAS</span>
            </NavLink>
          </div>
        </nav>
      </div>

      {/* ================= COLUMNA DERECHA: NOTIFICACIONES (20% o 300px) ================= */}
      <div className="w-80 flex flex-col shrink-0 shadow-2xl z-20" style={{ backgroundColor: '#3A2154', borderLeft: '2px solid #ffffff' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#ffffff', backgroundColor: '#3A2154' }}>
          <h2 className="text-white font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: '#F1A321' }} /> AVISOS ({notifications.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ backgroundColor: 'rgba(58, 33, 84, 0.5)' }}>
          {notifications.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm italic">
              Sin notificaciones pendientes.
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                // DOBLE CLICK PARA BORRAR
                onDoubleClick={() => removeNotification(notif.id)}
                className="border-l-4 p-4 rounded-r-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity select-none group relative"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E' }}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg" style={{ color: '#22C55E' }}>{notif.title}</h3>
                  <span className="text-[10px]" style={{ color: '#ffffff', opacity: 0.7 }}>
                    {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <p className="text-white font-medium mt-1 text-sm">{notif.message}</p>
                
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider" style={{ color: '#ffffff', opacity: 0.7 }}>
                  <CheckCheck className="w-3 h-3" /> Doble click para borrar
                </div>

                {/* Hint visual al pasar el mouse */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg backdrop-blur-sm">
                   <span className="text-white font-bold text-xs flex flex-col items-center">
                      <X className="w-6 h-6 mb-1"/> Doble Click <br/> para descartar
                   </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default GarzonLayout;