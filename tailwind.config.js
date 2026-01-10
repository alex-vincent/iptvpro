/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tv-accent': '#3b82f6', // Premium Blue
                'tv-bg': '#0f172a',     // Deep Slate/Navy
                'tv-surface': '#1e293b', // Lighter Slate
            },
        },
    },
    plugins: [],
}
