import { useState } from 'react';
import axios from '../api/axios'; // Importamos nuestra config
import { useAuthStore } from '../store/authStore'; // Importamos el estado global
import { useNavigate } from 'react-router-dom'; // Para redireccionar
import { User, Lock, ChefHat } from 'lucide-react'; // Iconos bonitos

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const setLogin = useAuthStore((state) => state.setLogin);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', { email, password });
      // Si login es exitoso:
      setLogin(res.data, res.data.token);
      
      // Redirigir según rol
      if (res.data.rol === 'ADMIN') navigate('/admin');
      else if (res.data.rol === 'COCINA') navigate('/cocina');
      else navigate('/garzon/comedor');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-full">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Bienvenido a <span className="text-indigo-400">Buen Sabor</span>
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="ejemplo@buensabor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200 transform hover:scale-[1.02]"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>  
  );
}

export default LoginPage;   