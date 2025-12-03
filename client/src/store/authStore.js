import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Para guardar en LocalStorage automáticamente

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuth: false,

      setLogin: (userData, token) => set({ 
        user: userData, 
        token: token, 
        isAuth: true 
      }),

      logout: () => set({ 
        user: null, 
        token: null, 
        isAuth: false 
      }),
    }),
    {
      name: 'auth-storage', // Nombre en el LocalStorage
    }
  )
);