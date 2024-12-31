// src/app/api/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getChannelIdFromUrl } from '@/lib/getChannelId';

// Add these interfaces before the GET function
interface YouTubeVideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
  };
}

interface ApiError extends Error {
  status?: number;
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
    const maxVideos = Number(searchParams.get('maxVideos')) || 50;

    if (!channelUrl) {
      return NextResponse.json({ error: 'Missing channelUrl param' }, { status: 400 });
    }

    // Validate maxVideos
    if (maxVideos < 50 || maxVideos > 350) {
      return NextResponse.json(
        { error: 'maxVideos must be between 50 and 350' },
        { status: 400 }
      );
    }

    // 2. Extract channelId (or identifier) from the provided channelUrl
    const identifier = getChannelIdFromUrl(channelUrl);
    if (!identifier) {
      return NextResponse.json({ error: 'Could not parse channel URL' }, { status: 400 });
    }

    // 3. Resolve the channel ID based on the identifier type
    let channelId: string;
    
    if (identifier.startsWith('UC')) {
      // Direct channel ID
      channelId = identifier;
    } else if (identifier.startsWith('@')) {
      // Handle format
      const username = identifier.slice(1);
      channelId = await resolveChannelIdFromUsername(username);
    } else if (identifier.startsWith('c/')) {
      // Custom URL format
      const customUrl = identifier.slice(2);
      channelId = await resolveChannelIdFromCustomUrl(customUrl);
    } else {
      return NextResponse.json({ error: 'Invalid channel identifier' }, { status: 400 });
    }

    // 4. Fetch videos for that channel
    const videos = await getChannelVideos(channelId, maxVideos);

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
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}

// Helper function to fetch from YouTube API
async function fetchYouTubeAPI(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(`YouTube API responded with status: ${response.status}`) as ApiError;
    error.status = response.status;
    throw error;
  }
  return await response.json();
}

// Function to resolve channel ID from a username/handle
async function resolveChannelIdFromUsername(username: string): Promise<string> {
  // First try the forUsername endpoint
  try {
    const data = await fetchYouTubeAPI(
      `https://www.googleapis.com/youtube/v3/channels?key=${process.env.YOUTUBE_API_KEY}&forUsername=${username}&part=id`
    );
    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }
  } catch {
    console.log('forUsername lookup failed, trying search...');
  }

  // If that fails, try searching for the channel
  return resolveChannelIdFromCustomUrl(username);
}

// Function to resolve channel ID from a custom URL
async function resolveChannelIdFromCustomUrl(customUrl: string): Promise<string> {
  try {
    // Search for the channel
    const searchData = await fetchYouTubeAPI(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(customUrl)}&type=channel&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!searchData.items || searchData.items.length === 0) {
      throw new Error('Channel not found');
    }

    // For each result, verify if it matches our custom URL
    for (const item of searchData.items) {
      const channelId = item.id.channelId;
      
      // Get the channel's custom URL
      const channelData = await fetchYouTubeAPI(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0];
        let channelCustomUrl = channel.snippet.customUrl;
        
        if (channelCustomUrl) {
          // Remove leading '@' if present and convert to lower case (like in your old code)
          channelCustomUrl = channelCustomUrl.replace(/^@/, '').toLowerCase();
          const lowerCustomName = customUrl.toLowerCase();

          if (channelCustomUrl === lowerCustomName) {
            return channelId;
          }
        }
      }
    }

    // If we haven't found a match, try one more time with the channel name
    // This is because sometimes the custom URL might not match exactly
    const channelId = searchData.items[0].id.channelId;
    const channelData = await fetchYouTubeAPI(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (channelData.items && channelData.items.length > 0) {
      return channelId;
    }

    throw new Error('Could not find matching channel');
  } catch (error) {
    console.error('Error resolving custom URL:', error);
    throw new Error('Could not find matching channel');
  }
}

async function getChannelVideos(channelId: string, maxVideos: number = 50) {
  let allVideos: YouTubeVideoItem[] = [];
  let nextPageToken: string | undefined = undefined;
  
  do {
    const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet,id&type=video&maxResults=50&order=date&key=${process.env.YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const data = await fetchYouTubeAPI(url);

    if (!data.items) break;
    
    allVideos = [...allVideos, ...data.items];
    nextPageToken = data.nextPageToken;
    
    if (allVideos.length >= maxVideos) break;
    
  } while (nextPageToken);

  return allVideos;
}

async function getVideoStats(videoId: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.YOUTUBE_API_KEY}`;
  const data = await fetchYouTubeAPI(url);
  return data.items?.[0]?.statistics || {};
}
