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

/**
 * Fetch XMLTV file from Xtream Codes API
 * @param {string} baseUrl - Base URL of the Xtream server
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<string>} - XMLTV XML content as string
 */
/**
 * Fetch XMLTV file from any URL
 * @param {string} url - URL of the XMLTV file
 * @returns {Promise<string>} - XMLTV XML content as string
 */
export const fetchXMLTVFromUrl = async (url) => {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try {
        // Try direct fetch first with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        let response;
        try {
            response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/xml, text/xml, */*'
                }
            });
            clearTimeout(timeoutId);
        } catch (directError) {
            clearTimeout(timeoutId);
            // If direct fetch fails (CORS, network error), try proxy
            console.log('Direct fetch failed, trying proxy...', directError);
            const proxyController = new AbortController();
            const proxyTimeoutId = setTimeout(() => proxyController.abort(), 120000); // 2 min timeout for proxy

            try {
                response = await fetch(proxyUrl, {
                    signal: proxyController.signal,
                    headers: {
                        'Accept': 'application/xml, text/xml, */*'
                    }
                });
                clearTimeout(proxyTimeoutId);
            } catch (proxyError) {
                clearTimeout(proxyTimeoutId);
                throw new Error(`Failed to fetch XMLTV: ${proxyError.message || 'Network error'}`);
            }
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`HTTP error! status: ${response.status}${errorText ? ` - ${errorText.substring(0, 100)}` : ''}`);
        }

        // Check if response is actually XML
        const contentType = response.headers.get('content-type') || '';
        const xmlText = await response.text();

        // Log size for debugging
        const sizeMB = (xmlText.length / (1024 * 1024)).toFixed(2);
        console.log(`XMLTV file downloaded: ${sizeMB} MB`);

        // Validate it's XML
        if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<tv')) {
            // Might be an error message
            if (xmlText.includes('error') || xmlText.includes('Error') || xmlText.includes('401') || xmlText.includes('403')) {
                throw new Error(`Server returned error: ${xmlText.substring(0, 200)}`);
            }
            throw new Error('Response does not appear to be valid XMLTV format');
        }

        // Check if file is too large (warn but don't fail)
        if (xmlText.length > 50 * 1024 * 1024) { // 50MB
            console.warn('XMLTV file is very large, parsing may take a while...');
        }

        return xmlText;
    } catch (error) {
        console.error("XMLTV Fetch Error:", error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The XMLTV file may be too large. Please try again.');
        }
        throw error;
    }
};

/**
 * Fetch XMLTV file from Xtream Codes API
 * @param {string} baseUrl - Base URL of the Xtream server
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<string>} - XMLTV XML content as string
 */
export const fetchXtreamXMLTV = async (baseUrl, username, password) => {
    const url = `${baseUrl}/xmltv.php?username=${username}&password=${password}`;
    return fetchXMLTVFromUrl(url);
};
