// src/app/api/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';

// We'll keep your helper functions at the bottom (unchanged).
// The main difference is: we define `export async function GET(...)`
// instead of `export default function handler(...)`.

// Add these interfaces before the GET function
interface YouTubeVideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
  };
}

// Add error type interface
interface ApiError extends Error {
  status?: number;
}

// Add this interface near the top with the other interfaces
interface YouTubeSearchResponse {
  items?: YouTubeVideoItem[];
  nextPageToken?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key is not configured' },
        { status: 500 }
      );
    }

    // 1. Parse the query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const channelUrl = searchParams.get('channelUrl');
    const sortMode = searchParams.get('sortMode');

    if (!channelUrl) {
      return NextResponse.json({ error: 'Missing channelUrl param' }, { status: 400 });
    }

    // 2. Extract channelId (or username) from the provided channelUrl
    const channelIdOrName = extractChannelIdOrName(channelUrl);
    if (!channelIdOrName) {
      return NextResponse.json({ error: 'Could not parse channel URL' }, { status: 400 });
    }

    // 3. If it's an @username, we need to resolve it to a channelId
    const channelId = await getChannelId(channelIdOrName);

    // 4. Fetch up to e.g. 50 videos for that channel
    const videos = await getChannelVideos(channelId);

    // 5. For each video, fetch stats (views & likes)
    const videosWithStats = await Promise.all(
      videos.map(async (v: YouTubeVideoItem) => {
        const stats = await getVideoStats(v.id.videoId);
        return {
          title: v.snippet.title,
          videoId: v.id.videoId,
          views: Number(stats.viewCount || 0),
          likes: Number(stats.likeCount || 0),
        };
      })
    );

    // 6. Sort them
    let sorted;
    if (sortMode === 'ratio') {
      // sort by like:views ratio
      sorted = videosWithStats.sort((a, b) => b.likes / b.views - a.likes / a.views);
    } else {
      // default to sort by likes
      sorted = videosWithStats.sort((a, b) => b.likes - a.likes);
    }

    // 7. Return the data as JSON
    return NextResponse.json({ data: sorted }, { status: 200 });
  } catch (err: unknown) {
    const error = err as ApiError;
    console.error('API Error', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------
// Helper functions (same as your old code)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return null;
  }
}

async function getChannelId(channelIdOrName: string): Promise<string> {
  if (channelIdOrName.startsWith('UC')) {
    return channelIdOrName;
  }
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
  let allVideos: YouTubeVideoItem[] = [];
  let nextPageToken: string | undefined = undefined;
  
  do {
    const url: string = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet,id&type=video&maxResults=50&order=date&key=${process.env.YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const resp = await fetch(url);
    const data: YouTubeSearchResponse = await resp.json();

    if (!data.items) break;
    
    allVideos = [...allVideos, ...data.items];
    nextPageToken = data.nextPageToken;
    
    console.log(`Fetched ${allVideos.length} videos so far from channel`);
    
    // Limit to 200 videos to avoid too many API calls
    if (allVideos.length >= 200) break;
    
  } while (nextPageToken);

  console.log(`Finished fetching ${allVideos.length} total videos from channel`);
  return allVideos;
}

async function getVideoStats(videoId: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.YOUTUBE_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const stats = data.items?.[0]?.statistics || {};
  return stats;
}
