import { create } from 'zustand';
import { account, databases, DB_ID, COLLECTIONS } from '../lib/appwrite';
import type { UserDoc } from '../types';

type AuthState = {
  // null = pas chargé, undefined = chargé mais pas de session, UserDoc = connecté
  profile: UserDoc | null | undefined;
  isLoading: boolean;
  loadSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,

  loadSession: async () => {
    try {
      const me = await account.get();
      try {
        const profile = await databases.getDocument(
          DB_ID,
          COLLECTIONS.users,
          me.$id
        );
        set({ profile: profile as unknown as UserDoc, isLoading: false });
      } catch {
        // Session existe mais pas de profil — utilisateur à compléter (KYC)
        set({ profile: undefined, isLoading: false });
      }
    } catch {
      // Pas de session
      set({ profile: undefined, isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const me = await account.get();
      const profile = await databases.getDocument(
        DB_ID,
        COLLECTIONS.users,
        me.$id
      );
      set({ profile: profile as unknown as UserDoc });
    } catch {
      set({ profile: undefined });
    }
  },

  clear: () => set({ profile: undefined, isLoading: false }),
}));
