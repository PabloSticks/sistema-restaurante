import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Plus, Trash2, Edit } from 'lucide-react';
import CreateUserModal from '../../components/CreateUserModal';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // 1. ESTADO NUEVO: Para saber a quién vamos a editar
  const [userToEdit, setUserToEdit] = useState(null); // <--- AGREGAR ESTO

  const token = useAuthStore(state => state.token);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

 const handleDelete = async (id, nombre) => {
    // Usamos nuestra alerta bonita en vez de window.confirm
    const confirmado = await askConfirmation(
      `¿Eliminar a ${nombre}?`,
      "Esta acción es permanente y no se puede deshacer.",
      "Sí, eliminar"
    );

    if (confirmado) {
      try {
        await axios.delete(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Usuario eliminado');
        fetchUsers(); 
      } catch (error) {
        showError('Error', 'No se pudo eliminar el usuario');
      }
    }
  };

  return (
    <div className="text-white relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-400">Administra el personal del restaurante</p>
        </div>
        
        {/* 2. MODIFICACIÓN: Limpiar el usuario al crear uno nuevo */}
        <button 
          onClick={() => { 
            setUserToEdit(null); // <--- IMPORTANTE: Limpiamos para que el modal sepa que es CREAR
            setShowModal(true); 
          }} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-700/50 text-gray-400 text-sm uppercase">
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8">Cargando...</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                        {user.nombre.charAt(0)}
                      </div>
                      {user.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        user.rol === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        user.rol === 'COCINA' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-gray-300">{user.activo ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        
                        {/* 3. MODIFICACIÓN: Conectar el botón editar */}
                        <button 
                          onClick={() => {
                            setUserToEdit(user); // <--- GUARDAMOS EL USUARIO CLICKADO
                            setShowModal(true);  // <--- ABRIMOS EL MODAL
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button 
                            onClick={() => handleDelete(user.id, user.nombre)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition"
                            >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreateUserModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            fetchUsers(); 
          }}
          userToEdit={userToEdit} // <--- 4. MODIFICACIÓN: Pasamos la prop al hijo
        />
      )}
    </div>
  );
}

export default UsersPage;