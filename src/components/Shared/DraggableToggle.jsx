import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const DraggableToggle = ({ onToggle }) => {
    const [position, setPosition] = useState({ x: 24, y: 24 });
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const buttonRef = useRef(null);

    const handleMouseDown = (e) => {
        isDragging.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startPos.current.x;
            const dy = moveEvent.clientY - startPos.current.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging.current = true;
                setPosition((prev) => ({
                    x: Math.min(window.innerWidth - 60, Math.max(0, prev.x + dx)),
                    y: Math.min(window.innerHeight - 60, Math.max(0, prev.y + dy))
                }));
                startPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleClick = (e) => {
        if (!isDragging.current) {
            onToggle();
        }
    };

    // Touch support
    const handleTouchStart = (e) => {
        isDragging.current = false;
        const touch = e.touches[0];
        startPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        const dx = touch.clientX - startPos.current.x;
        const dy = touch.clientY - startPos.current.y;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isDragging.current = true;
            setPosition((prev) => ({
                x: Math.min(window.innerWidth - 60, Math.max(0, prev.x + dx)),
                y: Math.min(window.innerHeight - 60, Math.max(0, prev.y + dy))
            }));
            startPos.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    return (
        <button
            ref={buttonRef}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
            className="fixed z-[60] p-2 bg-tv-surface rounded-xl text-tv-accent hover:bg-gray-800 transition-colors shadow-2xl active:scale-110 cursor-move animate-in fade-in duration-300 group"
            title="Drag to move, click to open"
        >
            <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
    );
};

export default DraggableToggle;
