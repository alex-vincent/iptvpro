import { create } from 'zustand';

export const useStore = create((set) => ({
    channels: [],
    groups: [],
    favorites: [],
    selectedChannel: null,
    isSidebarOpen: true,
    currentGroup: 'All',
    searchQuery: '',
    isSyncing: false,
    forceShowPlaylistManager: false,

    setIsSyncing: (val) => set({ isSyncing: val }),
    setForceShowPlaylistManager: (val) => set({ forceShowPlaylistManager: val }),

    setChannels: (channels) => {
        const groups = ['All', ...new Set(channels.map(c => c.group))];
        set({ channels, groups });
    },

    setFavorites: (favorites) => set({ favorites }),

    toggleFavorite: (channelName) => set((state) => {
        const isFav = state.favorites.includes(channelName);
        const newFavs = isFav
            ? state.favorites.filter(n => n !== channelName)
            : [...state.favorites, channelName];
        return { favorites: newFavs };
    }),

    setSelectedChannel: (channel) => set({ selectedChannel: channel }),

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    setCurrentGroup: (group) => set({ currentGroup: group, searchQuery: '' }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    resetStore: () => set({
        channels: [],
        groups: [],
        favorites: [],
        selectedChannel: null,
        currentGroup: 'All',
        searchQuery: '',
        forceShowPlaylistManager: false,
        isSyncing: false
    }),
}));
