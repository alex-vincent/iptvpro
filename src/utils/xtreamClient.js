/**
 * Xtream Codes API Client
 */

export const loginXtream = async (baseUrl, username, password) => {
    try {
        const url = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.user_info && data.user_info.auth === 1) {
            return data;
        } else {
            throw new Error("Invalid Xtream credentials or authentication failed.");
        }
    } catch (error) {
        console.error("Xtream Login Error:", error);
        throw error;
    }
};

export const fetchXtreamChannels = async (baseUrl, username, password) => {
    try {
        // 1. Fetch categories first to map IDs to Names
        const catUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
        const catResponse = await fetch(catUrl);
        const categories = await catResponse.json();
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.category_id] = cat.category_name;
        });

        // 2. Fetch streams
        const url = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
        const response = await fetch(url);
        const data = await response.json();

        return data.map(stream => ({
            id: stream.stream_id,
            name: stream.name,
            logo: stream.stream_icon,
            group: categoryMap[stream.category_id] || 'Uncategorized',
            url: `${baseUrl}/live/${username}/${password}/${stream.stream_id}.m3u8`,
            epgId: stream.epg_channel_id
        }));
    } catch (error) {
        console.error("Xtream Fetch Error:", error);
        throw error;
    }
};

export const fetchXtreamCategories = async (baseUrl, username, password) => {
    try {
        const url = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error("Xtream Categories Error:", error);
        throw error;
    }
};

export const fetchXtreamEPG = async (baseUrl, username, password, streamId) => {
    const url = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_short_epg&stream_id=${streamId}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try {
        // Try direct fetch first
        let response = await fetch(url).catch(() => fetch(proxyUrl));
        const data = await response.json();
        return data.epg_listings || [];
    } catch (error) {
        // Silent fail to avoid flooding console as per user request
        return [];
    }
};
