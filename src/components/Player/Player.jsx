import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '../../store/useStore';
import {
    Play, Pause, Volume2, VolumeX, Maximize,
    ArrowLeft, Monitor, PictureInPicture
} from 'lucide-react';

const Player = ({ streamUrl, title }) => {
    const videoRef = useRef(null);
    const { setSelectedChannel } = useStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeout = useRef(null);

    useEffect(() => {
        let hls;

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current.play();
                setIsPlaying(true);
            });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Native support (Safari)
            videoRef.current.src = streamUrl;
            videoRef.current.addEventListener('loadedmetadata', () => {
                videoRef.current.play();
                setIsPlaying(true);
            });
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [streamUrl]);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current.parentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };

    return (
        <div
            className="relative w-full h-full bg-black group"
            onMouseMove={handleMouseMove}
            onClick={handleMouseMove}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster="https://images.unsplash.com/photo-1593784991095-a205039475fe?auto=format&fit=crop&q=80&w=1920"
            />

            {/* Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between">
                    <button
                        onClick={() => setSelectedChannel(null)}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition group/back"
                    >
                        <ArrowLeft className="group-hover/back:-translate-x-1 transition-transform" />
                        <span className="font-medium text-lg">Leave Player</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <p className="text-sm text-tv-accent">Now Playing • Live</p>
                    </div>
                    <div className="w-24" /> {/* Spacer */}
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:scale-110 transition">
                                {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                            </button>

                            <div className="flex items-center gap-4">
                                <button onClick={toggleMute} className="text-white/70 hover:text-white transition">
                                    {isMuted ? <VolumeX /> : <Volume2 />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setVolume(v);
                                        videoRef.current.volume = v;
                                    }}
                                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => videoRef.current.requestPictureInPicture()}
                                className="text-white/70 hover:text-white transition"
                                title="Picture in Picture"
                            >
                                <PictureInPicture />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="text-white/70 hover:text-white transition"
                            >
                                <Maximize />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
