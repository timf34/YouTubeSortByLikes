import type { NextApiRequest, NextApiResponse } from 'next';
// import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { channelUrl, sortMode } = req.query;

    if (!channelUrl || typeof channelUrl !== 'string') {
      return res.status(400).json({ error: 'Missing channelUrl param' });
    }

    // 1. Extract channelId (or username) from the provided channelUrl
    const channelIdOrName = extractChannelIdOrName(channelUrl);
    if (!channelIdOrName) {
      return res.status(400).json({ error: 'Could not parse channel URL' });
    }

    // 2. If it's an @username, we need to resolve it to a channelId:
    const channelId = await getChannelId(channelIdOrName);

    // 3. Fetch up to e.g. 50 videos for that channel
    const videos = await getChannelVideos(channelId);

    // 4. For each video, fetch stats (views & likes)
    const videosWithStats = await Promise.all(
      videos.map(async (v) => {
        const stats = await getVideoStats(v.id.videoId);
        return {
          title: v.snippet.title,
          videoId: v.id.videoId,
          views: Number(stats.viewCount || 0),
          likes: Number(stats.likeCount || 0),
        };
      })
    );

    // 5. Sort them
    let sorted: typeof videosWithStats;
    if (sortMode === 'ratio') {
      sorted = videosWithStats.sort((a, b) => b.likes / b.views - a.likes / a.views);
    } else {
      // default to sort by likes
      sorted = videosWithStats.sort((a, b) => b.likes - a.likes);
    }

    res.status(200).json({ data: sorted });
  } catch (err: any) {
    console.error('API Error', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// ----------------------------------------------------------------
// Now the helper functions (this is minimal; adapt from your extension!)
// ----------------------------------------------------------------

function extractChannelIdOrName(fullUrl: string): string | null {
  try {
    const url = new URL(fullUrl);

    if (url.pathname.startsWith('/channel/')) {
      return url.pathname.replace('/channel/', '');
    } else if (url.pathname.startsWith('/@')) {
      return url.pathname.replace('/@', '');
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getChannelId(channelIdOrName: string): Promise<string> {
  // If it's a typical YouTube channelId (starts with UC...), return it
  if (channelIdOrName.startsWith('UC')) {
    return channelIdOrName;
  }

  // Otherwise, we interpret it as a "custom name" or "handle" (i.e. @lexfridman).
  // We'll do a "search for channel" call to find the real channel ID.
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    channelIdOrName
  )}&type=channel&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`;

  const resp = await fetch(searchUrl);
  const data = await resp.json();

  if (data.items && data.items.length > 0) {
    return data.items[0].id.channelId;
  }

  throw new Error('Could not find channel by username: ' + channelIdOrName);
}

async function getChannelVideos(channelId: string) {
  // Note: The 'search' endpoint only returns a subset of videos (max 50)
  // For truly complete data, you’d need to use "playlistItems" from the channel's uploads playlist, etc.
  const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet,id&type=video&maxResults=50&order=date&key=${process.env.YOUTUBE_API_KEY}`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (!data.items) return [];

  return data.items;
}

async function getVideoStats(videoId: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.YOUTUBE_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const stats = data.items?.[0]?.statistics || {};
  return stats;
}
