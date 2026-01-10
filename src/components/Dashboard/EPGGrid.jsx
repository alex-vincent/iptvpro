import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Monitor, Clock, Star } from 'lucide-react';

const EPGGrid = () => {
    const {
        channels,
        currentGroup,
        setSelectedChannel,
        searchQuery,
        favorites,
        toggleFavorite
    } = useStore();
    const { user } = useAuth();

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

    const handleToggleFav = async (e, channelName) => {
        e.stopPropagation();
        toggleFavorite(channelName);
        if (user) {
            const docRef = doc(db, 'users', user.uid);
            const isFav = favorites.includes(channelName);
            const newFavs = isFav
                ? favorites.filter(n => n !== channelName)
                : [...favorites, channelName];
            await updateDoc(docRef, { favorites: newFavs });
        }
    };

    // Generate a mock timeline for the next 4 hours
    const hours = Array.from({ length: 8 }, (_, i) => {
        const time = new Date();
        time.setMinutes(0);
        time.setSeconds(0);
        time.setMilliseconds(0);
        time.setHours(time.getHours() + Math.floor(i / 2));
        if (i % 2 !== 0) time.setMinutes(30);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    return (
        <div className="flex flex-col h-full bg-tv-bg">
            {/* Timeline Header */}
            <div className="flex bg-tv-surface border-b border-gray-800">
                <div className="w-[200px] flex-shrink-0 p-4 border-r border-gray-800 flex items-center gap-2 font-bold text-tv-accent">
                    <Clock size={16} />
                    <span>Timeline</span>
                </div>
                <div className="flex flex-1 overflow-x-hidden">
                    {hours.map((time, idx) => (
                        <div key={idx} className="min-w-[200px] p-4 text-sm font-medium text-gray-400 border-r border-gray-800/50">
                            {time}
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto epg-grid-container custom-scrollbar">
                {/* Channel Sidebar */}
                <div className="w-[200px] flex-shrink-0 bg-tv-surface border-r border-gray-800">
                    {filteredChannels.map((channel, idx) => (
                        <div
                            key={idx}
                            className="h-20 flex items-center gap-3 px-4 border-b border-gray-800/50 hover:bg-gray-800 transition cursor-pointer group relative"
                            onClick={() => setSelectedChannel(channel)}
                        >
                            <div className="flex-shrink-0 relative">
                                {channel.logo ? (
                                    <img src={channel.logo} alt="" className="w-8 h-8 object-contain rounded" />
                                ) : (
                                    <Monitor size={16} className="text-gray-500" />
                                )}
                                {favorites.includes(channel.name) && (
                                    <Star size={8} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
                                )}
                            </div>
                            <span className="text-sm font-medium truncate flex-1">{channel.name}</span>
                            <button
                                onClick={(e) => handleToggleFav(e, channel.name)}
                                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-gray-700 transition-all ${favorites.includes(channel.name) ? 'opacity-100 text-yellow-400' : 'text-gray-500'}`}
                            >
                                <Star size={14} fill={favorites.includes(channel.name) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Programs Grid */}
                <div className="flex-1 overflow-x-auto bg-gray-900/20">
                    {filteredChannels.map((_, idx) => (
                        <div key={idx} className="h-20 flex border-b border-gray-800/30">
                            {/* Mock Programs */}
                            <div className="min-w-[300px] bg-tv-accent/10 border-r border-tv-accent/20 p-3 flex flex-col justify-center">
                                <p className="text-xs font-bold text-tv-accent truncate">LIVE CONTENT</p>
                                <p className="text-xs text-gray-400 truncate">S1 E1 • Special Coverage</p>
                            </div>
                            <div className="min-w-[400px] p-3 flex flex-col justify-center border-r border-gray-800/20">
                                <p className="text-xs font-bold text-white truncate">UP NEXT: EVENING NEWS</p>
                                <p className="text-xs text-gray-400 truncate">Global Updates and Highlights</p>
                            </div>
                            <div className="min-w-[500px] p-3 flex flex-col justify-center border-r border-gray-800/20">
                                <p className="text-xs font-bold text-gray-500 truncate">SCHEDULED PROGRAMMING</p>
                                <p className="text-xs text-gray-500 truncate">Program information unavailable</p>
                            </div>
                        </div>
                    ))}
                    {filteredChannels.length === 0 && (
                        <div className="flex h-full items-center justify-center text-gray-600 italic">
                            No channels matching search or group found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EPGGrid;
