/**
 * XMLTV Parser
 * Parses XMLTV format EPG data
 */

/**
 * Parse XMLTV XML string into structured EPG data
 * @param {string} xmlString - The XMLTV XML content
 * @returns {Object} - { channelId: [programs] } mapping
 */
export const parseXMLTV = (xmlString) => {
    if (!xmlString || xmlString.trim().length === 0) {
        throw new Error('XMLTV file is empty');
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        const errorText = parserError.textContent || 'Unknown parsing error';
        throw new Error(`Failed to parse XMLTV file: ${errorText.substring(0, 200)}`);
    }
    
    // Verify it's actually a TV guide
    if (!xmlDoc.querySelector('tv') && !xmlDoc.querySelector('programme')) {
        throw new Error('XML file does not appear to be a valid XMLTV format');
    }

    const epgData = {};
    const programmes = xmlDoc.querySelectorAll('programme');

    programmes.forEach(programme => {
        const channelId = programme.getAttribute('channel');
        if (!channelId) return;

        const start = programme.getAttribute('start');
        const stop = programme.getAttribute('stop');
        const title = programme.querySelector('title');
        const desc = programme.querySelector('desc');
        const category = programme.querySelector('category');

        if (!epgData[channelId]) {
            epgData[channelId] = [];
        }

        epgData[channelId].push({
            start: start || '',
            end: stop || '',
            title: title?.textContent || '',
            description: desc?.textContent || '',
            category: category?.textContent || ''
        });
    });

    // Sort programmes by start time for each channel
    Object.keys(epgData).forEach(channelId => {
        epgData[channelId].sort((a, b) => {
            const timeA = parseXMLTVTime(a.start);
            const timeB = parseXMLTVTime(b.start);
            return timeA - timeB;
        });
    });

    return epgData;
};

/**
 * Parse XMLTV time format (YYYYMMDDHHmmss +TZ)
 * @param {string} xmltvTime - XMLTV time string
 * @returns {Date} - Parsed date object
 */
const parseXMLTVTime = (xmltvTime) => {
    if (!xmltvTime || xmltvTime.length < 14) return new Date(0);
    
    const year = parseInt(xmltvTime.substring(0, 4));
    const month = parseInt(xmltvTime.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(xmltvTime.substring(6, 8));
    const hour = parseInt(xmltvTime.substring(8, 10));
    const minute = parseInt(xmltvTime.substring(10, 12));
    const second = parseInt(xmltvTime.substring(12, 14));
    
    return new Date(Date.UTC(year, month, day, hour, minute, second));
};

/**
 * Get current and next programs for a channel from XMLTV data
 * @param {Array} programmes - Array of programmes for a channel
 * @returns {Object} - { current: program, next: program }
 */
export const getCurrentAndNextProgram = (programmes) => {
    if (!programmes || programmes.length === 0) {
        return { current: null, next: null };
    }

    const now = new Date();
    let current = null;
    let next = null;

    for (let i = 0; i < programmes.length; i++) {
        const program = programmes[i];
        const startTime = parseXMLTVTime(program.start);
        const endTime = parseXMLTVTime(program.end);

        if (startTime <= now && endTime > now) {
            current = program;
            if (i + 1 < programmes.length) {
                next = programmes[i + 1];
            }
            break;
        } else if (startTime > now) {
            next = program;
            break;
        }
    }

    // If no current program found, use the first upcoming program as "next"
    if (!current && !next && programmes.length > 0) {
        const firstUpcoming = programmes.find(p => parseXMLTVTime(p.start) > now);
        if (firstUpcoming) {
            next = firstUpcoming;
        } else {
            // All programs are in the past, use the last one as current
            current = programmes[programmes.length - 1];
        }
    }

    return { current, next };
};

/**
 * Format XMLTV time to readable format
 * @param {string} xmltvTime - XMLTV time string
 * @returns {string} - Formatted time string
 */
export const formatXMLTVTime = (xmltvTime) => {
    const date = parseXMLTVTime(xmltvTime);
    return date.toLocaleString();
};
