import React from 'react'
import Player from './components/Player/Player'
import Sidebar from './components/Layout/Sidebar'
import PlaylistManager from './components/Playlist/PlaylistManager'
import EPGGrid from './components/Dashboard/EPGGrid'
import { useStore } from './store/useStore'
import DraggableToggle from './components/Shared/DraggableToggle'
import { AlertCircle, X } from 'lucide-react'

function App() {
    const [showBanner, setShowBanner] = React.useState(true);
    const {
        selectedChannel,
        isSidebarOpen,
        toggleSidebar,
        channels,
        forceShowPlaylistManager,
    } = useStore();

    return (
        <div className="flex h-screen w-screen bg-tv-bg overflow-hidden text-white flex-col">
            {/* HTTP Mixed Content Warning Banner */}
            {showBanner && window.location.protocol === 'http:' && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[10px] text-amber-500 uppercase tracking-widest font-bold animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2 flex-1 justify-center">
                        <AlertCircle size={14} />
                        <span>HTTP Mode: Browser protocol must match your M3U/Xtream provider links</span>
                    </div>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="p-1 hover:bg-amber-500/20 rounded-full transition-colors active:scale-95 text-amber-500/60 hover:text-amber-500"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {!isSidebarOpen && <DraggableToggle onToggle={toggleSidebar} />}
                <Sidebar />
                <main className="flex-1 h-full min-w-0 relative">
                    {selectedChannel ? (
                        <Player streamUrl={selectedChannel.url} title={selectedChannel.name} />
                    ) : (forceShowPlaylistManager || (!channels || channels.length === 0)) ? (
                        <PlaylistManager />
                    ) : (
                        <EPGGrid />
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
