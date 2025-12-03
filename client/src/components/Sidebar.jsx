import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  Coffee, 
  LogOut, 
  ClipboardList 
} from 'lucide-react';
import clsx from 'clsx';
import { askConfirmation } from '../utils/sweetAlert';

function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const menuItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/usuarios", icon: Users, label: "Usuarios" },
    { to: "/admin/mesas", icon: Coffee, label: "Mesas" },
    { to: "/admin/productos", icon: UtensilsCrossed, label: "Menú y Productos" },
    { to: "/admin/pedidos", icon: ClipboardList, label: "Historial Pedidos" },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen fixed left-0 top-0">
      {/* 1. Header del Sidebar */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <h1 className="text-xl font-bold text-white tracking-wider">
          BUEN <span className="text-indigo-500">SABOR</span>
        </h1>
      </div>

      {/* 2. Navegación */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/admin"} // Solo exacto para el dashboard
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 3. Footer del Sidebar (Perfil + Logout) */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
            {user?.nombre?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
            <p className="text-xs text-gray-400 truncate">Administrador</p>
          </div>
        </div>
        
        <button 
          onClick={async () => {
            const confirmado = await askConfirmation(
              '¿Cerrar Sesión?',
              'Tendrás que ingresar tus credenciales nuevamente.',
              'Sí, salir'
            );
            if (confirmado) logout();
          }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;