// Handles various YouTube channel URL formats and returns a normalized identifier
// Returns either:
// - A channel ID (starts with 'UC')
// - A handle (starts with '@')
// - A custom URL identifier (starts with 'c/')
// - null if invalid

export function getChannelIdFromUrl(urlString: string): string | null {
	try {
		const url = new URL(urlString);
		
		// Only handle YouTube domains
		if (!url.hostname.match(/^(www\.)?(youtube\.com|youtu\.be)$/)) {
			return null;
		}

		// Remove trailing slashes and query parameters
		const cleanPath = url.pathname.replace(/\/+$/, "");

		// Handle different URL formats
		
		// 1. Standard channel ID format: /channel/UC...
		if (cleanPath.startsWith("/channel/")) {
			const channelId = cleanPath.split("/channel/")[1];
			// Basic validation - channel IDs typically start with UC and are 24 chars
			return channelId.startsWith("UC") && channelId.length >= 24 ? channelId : null;
		}
		
		// 2. Handle format: /@username
		if (cleanPath.startsWith("/@")) {
			const handle = cleanPath.replace(/^\/@/, "").split("/")[0];
			return handle ? `@${handle}` : null;
		}
		
		// 3. Legacy /c/ format: /c/username
		if (cleanPath.startsWith("/c/")) {
			const customUrl = cleanPath.replace(/^\/c\//, "").split("/")[0];
			// Return with c/ prefix to indicate it needs special handling
			return customUrl ? `c/${customUrl}` : null;
		}
		
		// 4. Legacy /user/ format: /user/username
		if (cleanPath.startsWith("/user/")) {
			const username = cleanPath.replace(/^\/user\//, "").split("/")[0];
			return username ? `@${username}` : null;
		}

		// Fallback
		return null;
	} catch (_err) {
		return null;
	}
}
  