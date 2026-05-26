import { create } from 'zustand';
import api from '../lib/api';

export interface Chama {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  contribution_amount: number;
  max_members?: number;
  role?: string;
  member_count?: number;
}

interface ChamaState {
  chamas: Chama[];
  activeChama: Chama | null;
  isLoading: boolean;
  fetchChamas: () => Promise<void>;
  setActiveChama: (chama: Chama) => void;
}

export const useChamaStore = create<ChamaState>((set, get) => ({
  chamas: [],
  activeChama: null,
  isLoading: false,

  fetchChamas: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/chamas');
      set({ chamas: response.data, isLoading: false });

      // If no active chama but we have chamas, set the first one as active
      if (!get().activeChama && response.data.length > 0) {
        set({ activeChama: response.data[0] });
      }
    } catch (error) {
      console.error('Failed to fetch chamas:', error);
      set({ isLoading: false });
    }
  },

  setActiveChama: (chama) => {
    set({ activeChama: chama });
  },
}));
