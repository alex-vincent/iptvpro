# IPTV Player Pro 📺

A premium, web-based IPTV player with a "10-foot UI" experience, designed for both desktop and TV browsing. Built with modern web technologies with local storage for playlists and favorites.

![IPTV Player Pro](https://img.shields.io/badge/Status-Beta-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- **📡 M3U & Xtream Support**: Full support for standard M3U playlists and Xtream Codes API (Server/User/Pass).
- **⭐ Local Favorites**: Save your favorite channels locally in your browser.
- **🔍 Unified Search**: Tivimate-style search bar to filter channels across all categories in real-time.
- **📅 EPG Grid**: A TV-style Electronic Program Guide with XMLTV support, automatic 8-hour refresh, and manual refresh option.
- **🖱️ Draggable Navigation**: An interactive, draggable sidebar toggle for flexible UI control.
- **📱 Responsive Design**: Fully optimized for large screens, desktops, and mobile/touch devices.
- **💾 Local Storage**: All data (playlists, favorites, credentials) stored locally in your browser.

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Zustand (with localStorage persistence)
- **Video Player**: Hls.js

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alex-vincent/iptvpro.git
   cd iptvpro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## 📖 Usage

1. **Load Playlist**: Click "Settings & Playlist" in the sidebar to add your M3U URL or Xtream Codes credentials.
2. **Browse Channels**: Use the sidebar to filter by category or search for specific channels.
3. **Watch**: Click on any channel to start streaming.
4. **EPG**: The EPG grid automatically loads program guide data from your Xtream provider's XMLTV feed and refreshes every 8 hours.
5. **Favorites**: Click the star icon on any channel to add it to your favorites.

## 📸 Screenshots

*(Add your screenshots or demo videos here!)*

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Created with ❤️ by alex-vincent
