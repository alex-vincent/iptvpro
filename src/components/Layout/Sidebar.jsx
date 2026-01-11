import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ChevronLeft, Monitor, List, Settings, Star, Search } from 'lucide-react';

const Sidebar = () => {
    const {
        isSidebarOpen,
        toggleSidebar,
        groups,
        currentGroup,
        setCurrentGroup,
        channels,
        setSelectedChannel,
        favorites,
        toggleFavorite,
        searchQuery,
        setSearchQuery,
        setForceShowPlaylistManager
    } = useStore();

    const handleOpenSettings = () => {
        setForceShowPlaylistManager(true);
        if (window.innerWidth < 1024) toggleSidebar();
    };

    const filteredChannels = useMemo(() => {
        let base = channels;
        if (currentGroup === 'Favorites') {
            base = channels.filter(c => favorites.includes(c.name));
        } else if (currentGroup !== 'All') {
            base = channels.filter(c => c.group === currentGroup);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            base = base.filter(c =>
                c.name.toLowerCase().includes(q) ||
                (c.group && c.group.toLowerCase().includes(q))
            );
        }
        return base;
    }, [channels, currentGroup, favorites, searchQuery]);

    const handleToggleFav = (e, channelName) => {
        e.stopPropagation();
        toggleFavorite(channelName);
    };

    const sidebarGroups = ['All', 'Favorites', ...groups.filter(g => g !== 'All')];

    return (
        <aside
            className={`relative h-full bg-tv-surface transition-all duration-300 flex flex-col flex-shrink-0 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
                }`}
        >
            <div className="flex flex-col h-full border-r border-gray-800">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-tv-accent flex items-center gap-2">
                            <Monitor className="text-tv-accent" />
                            IPTV Pro
                        </h2>
                        <button onClick={toggleSidebar} className="text-tv-accent hover:text-blue-400 transition-transform hover:-translate-x-1">
                            <ChevronLeft size={24} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-tv-accent transition-colors" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search channels..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-tv-accent outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6 custom-scrollbar">
                    {/* Groups Section */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-2">Navigation</p>
                        <nav className="space-y-1">
                            {sidebarGroups.map((group) => (
                                <button
                                    key={group}
                                    onClick={() => setCurrentGroup(group)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm flex items-center justify-between group ${currentGroup === group
                                        ? 'bg-tv-accent text-white font-medium shadow-lg'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {group === 'Favorites' ? <Star size={16} className={currentGroup === group ? 'fill-white' : ''} /> : <List size={16} />}
                                        {group}
                                    </span>
                                    {group !== 'Favorites' && group !== 'All' && (
                                        <span className="text-[10px] bg-gray-900 group-hover:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 group-hover:text-gray-300">
                                            {channels.filter(c => c.group === group).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Channel List Preview */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-2">
                            {currentGroup} Channels
                        </p>
                        <div className="space-y-1">
                            {filteredChannels.slice(0, 50).map((channel, idx) => (
                                <button
                                    key={`${channel.name}-${idx}`}
                                    onClick={() => setSelectedChannel(channel)}
                                    className="w-full border border-transparent flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:border-gray-700 transition group"
                                >
                                    <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt="" className="w-6 h-6 object-contain rounded" />
                                        ) : (
                                            <Monitor size={14} />
                                        )}
                                    </div>
                                    <span className="truncate flex-1 text-left">{channel.name}</span>
                                    <button
                                        onClick={(e) => handleToggleFav(e, channel.name)}
                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-yellow-400 ${favorites.includes(channel.name) ? 'opacity-100 text-yellow-400' : ''}`}
                                    >
                                        <Star size={14} fill={favorites.includes(channel.name) ? "currentColor" : "none"} />
                                    </button>
                                </button>
                            ))}
                            {filteredChannels.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 text-xs italic">No channels found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900/80 border-t border-gray-800 font-medium">
                    <button
                        onClick={handleOpenSettings}
                        className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition shadow-lg active:scale-[0.98]"
                    >
                        <Settings size={18} />
                        Settings & Playlist
                    </button>
                    <p className="text-[9px] text-gray-600 mt-4 text-center uppercase tracking-tighter">Local Storage Only Mode</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
