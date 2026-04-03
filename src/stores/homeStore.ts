import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HomeState {
  selectedGovernorate: string;
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: "trending" | "recent" | "rating";

  // Actions
  setGovernorate: (governorate: string) => void;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: "trending" | "recent" | "rating") => void;
  reset: () => void;
}

const DEFAULT_GOVERNORATE = "Baghdad";

export const useHomeStore = create<HomeState>()(
  persist(
    (set) => ({
      selectedGovernorate: DEFAULT_GOVERNORATE,
      selectedCategory: null,
      searchQuery: "",
      sortBy: "trending",

      setGovernorate: (governorate) =>
        set({ selectedGovernorate: governorate }),

      setCategory: (category) =>
        set({ selectedCategory: category }),

      setSearchQuery: (query) =>
        set({ searchQuery: query }),

      setSortBy: (sort) =>
        set({ sortBy: sort }),

      reset: () =>
        set({
          selectedGovernorate: DEFAULT_GOVERNORATE,
          selectedCategory: null,
          searchQuery: "",
          sortBy: "trending",
        }),
    }),
    {
      name: "home-store",
    }
  )
);
