// Very simplified version, only handles a couple of URL forms

// TODO: improve robustness like we previously did!


export function getChannelIdFromUrl(urlString: string): string | null {
	try {
	  const url = new URL(urlString);
  
	  // e.g. https://www.youtube.com/channel/<channelId>
	  if (url.pathname.startsWith("/channel/")) {
		return url.pathname.split("/channel/")[1];
	  }
  
	  // e.g. https://www.youtube.com/@lexfridman
	  if (url.pathname.startsWith("/@")) {
		// Remove leading "@" and any trailing slashes
		const username = url.pathname.replace(/^\/@/, "").replace(/\/$/, "");
		// Return the "username" for now, we'll handle it in the API call or next steps
		return username;
	  }
  
	  // Fallback
	  return null;
	} catch (err) {
	  return null;
	}
  }
  