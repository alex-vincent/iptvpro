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
        const url = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
        const response = await fetch(url);
        const data = await response.json();

        return data.map(stream => ({
            name: stream.name,
            logo: stream.stream_icon,
            group: stream.category_name || 'Uncategorized',
            url: `${baseUrl}/live/${username}/${password}/${stream.stream_id}.m3u8`
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
