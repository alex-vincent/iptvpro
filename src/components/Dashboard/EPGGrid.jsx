import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Monitor, Clock, Star, Loader2, RefreshCw } from 'lucide-react';
import { fetchXtreamXMLTV } from '../../utils/xtreamClient';
import { parseXMLTV, getCurrentAndNextProgram, formatXMLTVTime } from '../../utils/xmltvParser';

const EPGGrid = () => {
    const {
        channels,
        currentGroup,
        setSelectedChannel,
        searchQuery,
        favorites,
        toggleFavorite,
        xtreamCredentials,
        xmltvData,
        xmltvLastRefresh,
        setXmltvData
    } = useStore();
    const [loadingEpg, setLoadingEpg] = useState(false);
    const [error, setError] = useState(null);

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

    // Check if XMLTV needs refresh (8 hours = 8 * 60 * 60 * 1000 ms)
    const needsRefresh = useMemo(() => {
        if (!xmltvLastRefresh) return true;
        const eightHours = 8 * 60 * 60 * 1000;
        const now = Date.now();
        return (now - xmltvLastRefresh) > eightHours;
    }, [xmltvLastRefresh]);

    // Fetch XMLTV data
    const fetchXMLTV = useCallback(async (force = false) => {
        if (!xtreamCredentials) return;
        
        // Don't fetch if we have recent data and not forcing
        if (!force && xmltvData && xmltvLastRefresh) {
            const eightHours = 8 * 60 * 60 * 1000;
            const now = Date.now();
            if ((now - xmltvLastRefresh) < eightHours) {
                return; // Data is still fresh
            }
        }

        setLoadingEpg(true);
        setError(null);

        try {
            console.log('Fetching XMLTV data...');
            const xmlString = await fetchXtreamXMLTV(
                xtreamCredentials.url,
                xtreamCredentials.user,
                xtreamCredentials.pass
            );
            
            console.log('Parsing XMLTV data...');
            const parsedData = parseXMLTV(xmlString);
            const channelCount = Object.keys(parsedData).length;
            console.log(`XMLTV parsed successfully: ${channelCount} channels with EPG data`);
            
            setXmltvData(parsedData, Date.now());
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error('Failed to fetch/parse XMLTV:', err);
            const errorMessage = err.message || 'Unknown error occurred';
            setError(`Failed to load EPG data: ${errorMessage}. Please try refreshing manually.`);
        } finally {
            setLoadingEpg(false);
        }
    }, [xtreamCredentials, xmltvData, xmltvLastRefresh, setXmltvData]);

    // Initial load and auto-refresh check
    useEffect(() => {
        if (!xtreamCredentials || channels.length === 0) return;

        // Fetch if we don't have data or it needs refresh
        if (!xmltvData || needsRefresh) {
            fetchXMLTV();
        }

        // Set up interval to check for refresh every hour
        const interval = setInterval(() => {
            const now = Date.now();
            const eightHours = 8 * 60 * 60 * 1000;
            if (!xmltvLastRefresh || (now - xmltvLastRefresh) > eightHours) {
                fetchXMLTV();
            }
        }, 60 * 60 * 1000); // Check every hour

        return () => clearInterval(interval);
    }, [xtreamCredentials, channels.length, xmltvData, xmltvLastRefresh, needsRefresh, fetchXMLTV]);

    const handleToggleFav = (e, channelName) => {
        e.stopPropagation();
        toggleFavorite(channelName);
    };

    const handleManualRefresh = () => {
        fetchXMLTV(true);
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

    // Get EPG data for a channel
    const getChannelEPG = (channel) => {
        if (!xmltvData) return null;
        
        // Try multiple matching strategies:
        // 1. By epgId (from Xtream API)
        // 2. By channel ID (stream_id)
        // 3. By channel name (normalized)
        // 4. By channel name with different variations
        let programmes = null;
        
        if (channel.epgId) {
            programmes = xmltvData[channel.epgId];
        }
        
        if (!programmes && channel.id) {
            programmes = xmltvData[channel.id] || 
                        xmltvData[String(channel.id)];
        }
        
        if (!programmes && channel.name) {
            programmes = xmltvData[channel.name] ||
                        xmltvData[channel.name.toLowerCase()] ||
                        xmltvData[channel.name.toUpperCase()];
        }
        
        if (!programmes || programmes.length === 0) return null;
        
        return getCurrentAndNextProgram(programmes);
    };

    // Format time for display
    const formatTime = (xmltvTime) => {
        if (!xmltvTime) return '';
        try {
            // Parse XMLTV time format (YYYYMMDDHHmmss)
            const year = xmltvTime.substring(0, 4);
            const month = xmltvTime.substring(4, 6);
            const day = xmltvTime.substring(6, 8);
            const hour = xmltvTime.substring(8, 10);
            const minute = xmltvTime.substring(10, 12);
            
            return `${hour}:${minute}`;
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-tv-bg">
            {/* Timeline Header */}
            <div className="flex bg-tv-surface border-b border-gray-800">
                <div className="w-[200px] flex-shrink-0 p-4 border-r border-gray-800 flex items-center gap-2 font-bold text-tv-accent">
                    {loadingEpg ? <Loader2 className="animate-spin" size={16} /> : <Clock size={16} />}
                    <span>Timeline</span>
                    {xtreamCredentials && (
                        <button
                            onClick={handleManualRefresh}
                            disabled={loadingEpg}
                            className="ml-auto p-1.5 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                            title="Refresh EPG"
                        >
                            <RefreshCw size={14} className={loadingEpg ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>
                <div className="flex flex-1 overflow-x-hidden">
                    {hours.map((time, idx) => (
                        <div key={time} className="min-w-[200px] p-4 text-sm font-medium text-gray-400 border-r border-gray-800/50">
                            {time}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-sm text-red-400">
                    {error}
                </div>
            )}

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
                            const epg = getChannelEPG(channel);
                            const currentProgram = epg?.current;
                            const nextProgram = epg?.next;

                            return (
                                <div key={`${channel.id || channel.name}-${idx}`} className="h-20 flex border-b border-gray-800/30 min-w-max">
                                    {currentProgram ? (
                                        <>
                                            <div className="min-w-[350px] bg-tv-accent/5 border-r border-tv-accent/10 p-4 flex flex-col justify-center">
                                                <p className="text-xs font-bold text-tv-accent truncate uppercase tracking-tight">
                                                    {currentProgram.title || 'Live Broadcast'}
                                                </p>
                                                <p className="text-[10px] text-gray-500 line-clamp-1 mt-1 leading-relaxed">
                                                    {currentProgram.description || 'Live Broadcast'}
                                                </p>
                                            </div>
                                            {nextProgram && (
                                                <div className="min-w-[450px] p-4 flex flex-col justify-center border-r border-gray-800/20">
                                                    <p className="text-xs font-bold text-white/90 truncate uppercase tracking-tight">
                                                        NEXT: {nextProgram.title || 'Upcoming'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 truncate mt-1">
                                                        {formatTime(nextProgram.start)} - {formatTime(nextProgram.end)}
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
