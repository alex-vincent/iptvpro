import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store/useStore';
import { fetchPlaylist } from '../../utils/m3uParser';
import { fetchXtreamChannels, loginXtream } from '../../utils/xtreamClient';
import { Plus, Database, Globe, Key, Loader2, Server, User, Lock, ArrowLeft } from 'lucide-react';

const PlaylistManager = () => {
    const { user } = useAuth();
    const { setChannels, setForceShowPlaylistManager, forceShowPlaylistManager, channels } = useStore();
    const [mode, setMode] = useState('m3u'); // 'm3u' or 'xtream'
    const [url, setUrl] = useState('');
    const [xtream, setXtream] = useState({ url: '', user: '', pass: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadSaved = async () => {
            if (!user) return;
            try {
                const docSnap = await getDoc(doc(db, 'users', user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.type === 'xtream') {
                        setMode('xtream');
                        if (data.xtream) setXtream(data.xtream);
                    } else if (data.playlistUrl) {
                        setMode('m3u');
                        setUrl(data.playlistUrl);
                    }
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            }
        };
        loadSaved();
    }, [user]);

    const handleFetchM3U = async (targetUrl = url) => {
        if (!targetUrl) return;
        setLoading(true);
        setError(null);
        try {
            const fetched = await fetchPlaylist(targetUrl);
            setChannels(fetched);
            setForceShowPlaylistManager(false);

            if (user) {
                await setDoc(doc(db, 'users', user.uid), {
                    type: 'm3u',
                    playlistUrl: targetUrl,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (err) {
            setError('Failed to fetch M3U playlist. Check URL and CORS.');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchXtream = async (credentials = xtream) => {
        if (!credentials.url || !credentials.user || !credentials.pass) return;
        setLoading(true);
        setError(null);
        try {
            await loginXtream(credentials.url, credentials.user, credentials.pass);
            const fetched = await fetchXtreamChannels(credentials.url, credentials.user, credentials.pass);
            setChannels(fetched);
            setForceShowPlaylistManager(false);

            if (user) {
                await setDoc(doc(db, 'users', user.uid), {
                    type: 'xtream',
                    xtream: credentials,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (err) {
            setError('Xtream login failed. Check credentials and server URL.');
        } finally {
            setLoading(false);
        }
    };

    const onBack = () => {
        setForceShowPlaylistManager(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-tv-bg">
            <div className="w-full max-w-3xl bg-tv-surface rounded-xl p-8 shadow-2xl border border-gray-800">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-tv-accent/20 rounded-lg">
                            <Database className="text-tv-accent" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Playlist Manager</h1>
                            <p className="text-gray-400">Choose your preferred method to load channels.</p>
                        </div>
                    </div>
                    {forceShowPlaylistManager && channels?.length > 0 && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Back to Player
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-gray-900 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('m3u')}
                        className={`flex-1 py-3 px-4 rounded-md transition font-medium flex items-center justify-center gap-2 ${mode === 'm3u' ? 'bg-tv-accent text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Globe size={18} />
                        M3U URL
                    </button>
                    <button
                        onClick={() => setMode('xtream')}
                        className={`flex-1 py-3 px-4 rounded-md transition font-medium flex items-center justify-center gap-2 ${mode === 'xtream' ? 'bg-tv-accent text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Server size={18} />
                        Xtream Codes
                    </button>
                </div>

                <div className="min-h-[300px]">
                    {mode === 'm3u' ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleFetchM3U(); }} className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">M3U Playlist URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/playlist.m3u"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-4 pl-12 pr-4 focus:ring-2 focus:ring-tv-accent focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>

                            {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">{error}</div>}

                            <button type="submit" disabled={loading} className="w-full bg-tv-accent hover:bg-blue-600 disabled:bg-gray-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition active:scale-[0.98]">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                {loading ? 'Loading...' : 'Load M3U Playlist'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); handleFetchXtream(); }} className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Server URL</label>
                                    <div className="relative">
                                        <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                        <input
                                            type="text"
                                            value={xtream.url}
                                            onChange={(e) => setXtream({ ...xtream, url: e.target.value })}
                                            placeholder="http://your-provider.com:8080"
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-4 pl-12 pr-4 focus:ring-2 focus:ring-tv-accent outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                            <input
                                                type="text"
                                                value={xtream.user}
                                                onChange={(e) => setXtream({ ...xtream, user: e.target.value })}
                                                placeholder="Username"
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-4 pl-12 pr-4 focus:ring-2 focus:ring-tv-accent outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                            <input
                                                type="password"
                                                value={xtream.pass}
                                                onChange={(e) => setXtream({ ...xtream, pass: e.target.value })}
                                                placeholder="Password"
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-4 pl-12 pr-4 focus:ring-2 focus:ring-tv-accent outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">{error}</div>}

                            <button type="submit" disabled={loading} className="w-full bg-tv-accent hover:bg-blue-600 disabled:bg-gray-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition active:scale-[0.98]">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                {loading ? 'Logging in...' : 'Sign in to Xtream'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistManager;
