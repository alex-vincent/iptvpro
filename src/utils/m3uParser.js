/**
 * Simple yet robust M3U Parser
 * @param {string} m3uString - Raw M3U file content
 * @returns {Array} - Array of channel objects
 */
export const parseM3U = (m3uString) => {
    const lines = m3uString.split('\n');
    const channels = [];
    let currentChannel = null;

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith('#EXTINF:')) {
            // Parse EXTINF metadata
            const info = line.split('#EXTINF:')[1];
            const nameMatch = info.match(/,(.*)$/);
            const logoMatch = info.match(/tvg-logo="(.*?)"/);
            const groupMatch = info.match(/group-title="(.*?)"/);

            currentChannel = {
                name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
                logo: logoMatch ? logoMatch[1] : null,
                group: groupMatch ? groupMatch[1] : 'Uncategorized',
            };
        } else if (line.startsWith('http') && currentChannel) {
            // Add URL to current channel and push to list
            currentChannel.url = line;
            channels.push(currentChannel);
            currentChannel = null;
        }
    }

    return channels;
};

/**
 * Fetch and parse playlist from URL
 * Note: Subject to CORS. Suggest using a proxy if needed.
 */
export const fetchPlaylist = async (url) => {
    try {
        const response = await fetch(url);
        const m3uData = await response.text();
        return parseM3U(m3uData);
    } catch (error) {
        console.error("Error fetching playlist:", error);
        throw error;
    }
};
