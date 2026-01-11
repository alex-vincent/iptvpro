import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set) => ({
            channels: [],
            groups: [],
            favorites: [],
            selectedChannel: null,
            isSidebarOpen: true,
            currentGroup: 'All',
            searchQuery: '',
            isSyncing: false,
            forceShowPlaylistManager: false,
            xtreamCredentials: null,
            xmltvData: null, // Parsed XMLTV EPG data: { channelId: [programs] }
            xmltvLastRefresh: null, // Timestamp of last XMLTV refresh

            setIsSyncing: (val) => set({ isSyncing: val }),
            setForceShowPlaylistManager: (val) => set({ forceShowPlaylistManager: val }),
            setXtreamCredentials: (creds) => set({ xtreamCredentials: creds }),
            setXmltvData: (data, timestamp) => set({ xmltvData: data, xmltvLastRefresh: timestamp }),

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

            clearCache: () => set({
                channels: [],
                groups: [],
                favorites: [],
                selectedChannel: null
            }),

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
        }),
        {
            name: 'iptv-player-storage',
            partialize: (state) => ({
                channels: state.channels,
                groups: state.groups,
                favorites: state.favorites,
                isSidebarOpen: state.isSidebarOpen,
                xtreamCredentials: state.xtreamCredentials,
                // Note: xmltvData and xmltvLastRefresh are NOT persisted to localStorage
                // because XMLTV files can be very large and exceed localStorage quota
            }),
        }
    )
);
