import { create } from "zustand";

export interface FavoritesStore {
    selectedFavorites: string[];
    addSelectedFavorite: (index: string) => void;
    removeSelectedFavorite: (index: string) => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
    selectedFavorites: [],
    addSelectedFavorite: (id) => {
        set({ selectedFavorites: [...get().selectedFavorites, id] });
    },
    removeSelectedFavorite: (id) => {
        set({ selectedFavorites: get().selectedFavorites.filter((x) => x !== id) });
    },
}));
