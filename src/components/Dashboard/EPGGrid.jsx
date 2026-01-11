import React, { useMemo, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Monitor, Clock, Star, Loader2 } from 'lucide-react';
import { fetchXtreamEPG } from '../../utils/xtreamClient';

const EPGGrid = () => {
    const {
        channels,
        currentGroup,
        setSelectedChannel,
        searchQuery,
        favorites,
        toggleFavorite,
        xtreamCredentials
    } = useStore();
    const [epgData, setEpgData] = useState({}); // { streamId: [listings] }
    const [loadingEpg, setLoadingEpg] = useState(false);
    const [epgDisabled, setEpgDisabled] = useState(false);

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

    // Fetch EPG for visible channels
    useEffect(() => {
        const fetchAllEpg = async () => {
            if (!xtreamCredentials || filteredChannels.length === 0 || epgDisabled) return;
            setLoadingEpg(true);
            const newEpg = { ...epgData };

            // Only try first 10 channels to check health
            const channelsToFetch = filteredChannels.slice(0, 10);
            let failures = 0;

            try {
                for (const channel of channelsToFetch) {
                    if (channel.id && !newEpg[channel.id]) {
                        const listings = await fetchXtreamEPG(
                            xtreamCredentials.url,
                            xtreamCredentials.user,
                            xtreamCredentials.pass,
                            channel.id
                        );
                        if (listings.length > 0) {
                            newEpg[channel.id] = listings;
                        } else {
                            failures++;
                        }
                    }
                }

                // If more than 80% fail, disable for this session
                if (failures > 8) setEpgDisabled(true);

                setEpgData(newEpg);
            } catch (err) {
                setEpgDisabled(true);
            } finally {
                setLoadingEpg(false);
            }
        };

        const timer = setTimeout(fetchAllEpg, 1500);
        return () => clearTimeout(timer);
    }, [filteredChannels, xtreamCredentials, epgDisabled]);

    const handleToggleFav = (e, channelName) => {
        e.stopPropagation();
        toggleFavorite(channelName);
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

    const safeAtob = (str) => {
        try {
            return str ? decodeURIComponent(escape(window.atob(str))) : '';
        } catch (e) {
            return str || '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-tv-bg">
            {/* Timeline Header */}
            <div className="flex bg-tv-surface border-b border-gray-800">
                <div className="w-[200px] flex-shrink-0 p-4 border-r border-gray-800 flex items-center gap-2 font-bold text-tv-accent">
                    {loadingEpg ? <Loader2 className="animate-spin" size={16} /> : <Clock size={16} />}
                    <span>Timeline</span>
                </div>
                <div className="flex flex-1 overflow-x-hidden">
                    {hours.map((time, idx) => (
                        <div key={time} className="min-w-[200px] p-4 text-sm font-medium text-gray-400 border-r border-gray-800/50">
                            {time}
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-auto epg-grid-container custom-scrollbar">
                <div className="flex relative">
                    {/* Channel Sidebar - Sticky to the left */}
                    <div className="w-[200px] flex-shrink-0 bg-tv-surface border-r border-gray-800 sticky left-0 z-20 shadow-xl">
                        {filteredChannels.map((channel, idx) => (
                            <div
                                key={`${channel.id || channel.name}-${idx}`}
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
                    <div className="flex-1 bg-gray-900/10">
                        {filteredChannels.map((channel, idx) => {
                            const listings = epgData[channel.id] || [];
                            const currentProgram = listings[0];
                            const nextProgram = listings[1];

                            return (
                                <div key={`${channel.id || channel.name}-${idx}`} className="h-20 flex border-b border-gray-800/30 min-w-max">
                                    {currentProgram ? (
                                        <>
                                            <div className="min-w-[350px] bg-tv-accent/5 border-r border-tv-accent/10 p-4 flex flex-col justify-center">
                                                <p className="text-xs font-bold text-tv-accent truncate uppercase tracking-tight">
                                                    {safeAtob(currentProgram.title || '')}
                                                </p>
                                                <p className="text-[10px] text-gray-500 line-clamp-1 mt-1 leading-relaxed">
                                                    {safeAtob(currentProgram.description || '') || 'Live Broadcast'}
                                                </p>
                                            </div>
                                            {nextProgram && (
                                                <div className="min-w-[450px] p-4 flex flex-col justify-center border-r border-gray-800/20">
                                                    <p className="text-xs font-bold text-white/90 truncate uppercase tracking-tight">
                                                        NEXT: {safeAtob(nextProgram.title || '')}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 truncate mt-1">
                                                        {nextProgram.start.split(' ')[1].slice(0, 5)} - {nextProgram.end.split(' ')[1].slice(0, 5)}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="min-w-[350px] p-4 flex flex-col justify-center border-r border-gray-800/20">
                                            <p className="text-xs font-bold text-gray-700 truncate tracking-tight">NO GUIDE DATA</p>
                                            <p className="text-[10px] text-gray-800 truncate">Program information unavailable</p>
                                        </div>
                                    )}
                                    <div className="min-w-[600px] p-4 flex items-center border-r border-gray-800/20">
                                        <div className="h-1 w-full bg-gray-800/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-gray-800/40 w-1/3" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredChannels.length === 0 && (
                            <div className="flex h-64 items-center justify-center text-gray-600 italic">
                                No channels matching search or group found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EPGGrid;
