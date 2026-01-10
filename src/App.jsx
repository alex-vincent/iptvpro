import React, { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import Player from './components/Player/Player'
import Sidebar from './components/Layout/Sidebar'
import PlaylistManager from './components/Playlist/PlaylistManager'
import EPGGrid from './components/Dashboard/EPGGrid'
import { useStore } from './store/useStore'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { fetchPlaylist } from './utils/m3uParser'
import { fetchXtreamChannels, loginXtream } from './utils/xtreamClient'
import DraggableToggle from './components/Shared/DraggableToggle'

function App() {
    const { user, loading, loginWithGoogle } = useAuth();
    const {
        selectedChannel,
        isSidebarOpen,
        toggleSidebar,
        channels,
        setChannels,
        setFavorites,
        isSyncing,
        setIsSyncing,
        forceShowPlaylistManager,
        setForceShowPlaylistManager
    } = useStore();

    useEffect(() => {
        const syncData = async () => {
            if (!user || channels.length > 0) return;

            setIsSyncing(true);
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.favorites) setFavorites(data.favorites);

                    if (data.type === 'xtream' && data.xtream) {
                        const { url, user: u, pass } = data.xtream;
                        await loginXtream(url, u, pass);
                        const fetchedChannels = await fetchXtreamChannels(url, u, pass);
                        setChannels(fetchedChannels);
                    } else if (data.playlistUrl) {
                        const fetchedChannels = await fetchPlaylist(data.playlistUrl);
                        setChannels(fetchedChannels);
                    }
                }
            } catch (error) {
                console.error("Auto-sync failed:", error);
            } finally {
                setIsSyncing(false);
            }
        };

        if (user) syncData();
    }, [user, setChannels, setFavorites, setIsSyncing]);

    if (loading || (user && isSyncing && channels.length === 0)) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-tv-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tv-accent mb-6"></div>
                {isSyncing && (
                    <div className="text-center">
                        <p className="text-gray-400 animate-pulse font-medium mb-4">Syncing your playlist...</p>
                        <button
                            onClick={() => setIsSyncing(false)}
                            className="text-xs text-gray-500 hover:text-white border border-gray-800 px-4 py-2 rounded-lg transition active:scale-95"
                        >
                            Cancel & Setup Manually
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-tv-bg p-4 text-center">
                <h1 className="mb-6 text-4xl font-bold text-white">IPTV Player Pro</h1>
                <p className="mb-8 text-gray-400 max-w-md">The ultimate web-based 10-foot UI IPTV experience. Sign in to sync your playlists and start watching.</p>
                <button
                    onClick={loginWithGoogle}
                    className="rounded bg-tv-accent px-8 py-3 font-semibold text-white transition hover:bg-blue-600 active:scale-95"
                >
                    Sign in with Google
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-screen bg-tv-bg overflow-hidden text-white">
            {!isSidebarOpen && <DraggableToggle onToggle={toggleSidebar} />}
            <Sidebar />
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
                {selectedChannel ? (
                    <Player streamUrl={selectedChannel.url} title={selectedChannel.name} />
                ) : (forceShowPlaylistManager || (!channels || channels.length === 0)) ? (
                    <PlaylistManager />
                ) : (
                    <EPGGrid />
                )}
            </main>
        </div>
    );
}

export default App;
