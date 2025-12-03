import { useEffect } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore'; // <--- NUEVO STORE
import { Store, LogOut, Utensils, Bell, CheckCheck, X } from 'lucide-react';
import { askConfirmation } from '../utils/sweetAlert';
import socket from '../utils/socket';

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
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      
      {/* ================= COLUMNA IZQUIERDA: APP PRINCIPAL (80%) ================= */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-700">
        
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">BUEN SABOR</h1>
            <p className="text-xs text-indigo-400 font-medium">Garzón: {user.nombre}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Contenido (Outlet) */}
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>

        {/* Navbar Inferior */}
        <nav className="bg-gray-800 border-t border-gray-700 shrink-0">
          <div className="flex justify-around items-center h-16">
            <NavLink to="/garzon/comedor" className={({ isActive }) => 
              `flex flex-col items-center px-6 py-1 rounded-lg transition ${isActive ? 'text-indigo-400 bg-gray-700' : 'text-gray-500'}`
            }>
              <Store className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">MAPA</span>
            </NavLink>

            <NavLink to="/garzon/mis-mesas" className={({ isActive }) => 
              `flex flex-col items-center px-6 py-1 rounded-lg transition ${isActive ? 'text-indigo-400 bg-gray-700' : 'text-gray-500'}`
            }>
              <Utensils className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">MIS MESAS</span>
            </NavLink>
          </div>
        </nav>
      </div>

      {/* ================= COLUMNA DERECHA: NOTIFICACIONES (20% o 300px) ================= */}
      <div className="w-80 bg-gray-900 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" /> AVISOS ({notifications.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-900/50">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-600 mt-10 text-sm italic">
              Sin notificaciones pendientes.
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                // DOBLE CLICK PARA BORRAR
                onDoubleClick={() => removeNotification(notif.id)}
                className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg shadow-lg cursor-pointer hover:bg-green-900/30 transition-colors select-none group relative"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-green-400 text-lg">{notif.title}</h3>
                  <span className="text-[10px] text-gray-500">
                    {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <p className="text-white font-medium mt-1 text-sm">{notif.message}</p>
                
                <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
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