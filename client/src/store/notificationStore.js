import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],

  // Agregar nueva notificación al principio de la lista
  addNotification: (notif) => set((state) => ({
    notifications: [
      { id: Date.now(), ...notif, timestamp: new Date() }, 
      ...state.notifications
    ]
  })),

  // Borrar una específica
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),

  // Limpiar todo (opcional)
  clearAll: () => set({ notifications: [] }),
}));