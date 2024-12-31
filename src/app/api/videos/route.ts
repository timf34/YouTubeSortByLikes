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

interface YouTubeSearchResponse {
  items?: YouTubeVideoItem[];
  nextPageToken?: string;
}

interface InvidiousVideo {
  title: string;
  videoId: string;
  viewCount: number;
  likeCount: number;
}

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de/',
  'https://yewtu.be/'
  // Add more instances as needed
];

// Helper function to fetch from Invidious API with fallback instances
async function fetchInvidiousAPI(endpoint: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params).toString();
  const url = `${endpoint}${searchParams ? `?${searchParams}` : ''}`;

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1${url}`);
      if (!response.ok) {
        continue;
      }
      return await response.json();
    } catch (error) {
      console.log(`Failed to fetch from ${instance}, trying next instance...`);
      continue;
    }
  }
  throw new Error('All Invidious instances failed');
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

export async function GET(request: NextRequest) {
  try {
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
    console.log(identifier);
    if (!identifier) {
      return NextResponse.json({ error: 'Could not parse channel URL' }, { status: 400 });
    }

    try {
      // First try using Invidious API
      const videos = await getVideosFromInvidious(identifier, maxVideos);
      
      // Sort the videos
      let sorted;
      if (sortMode === 'ratio') {
        sorted = videos.sort((a, b) => (b.likeCount / b.viewCount) - (a.likeCount / a.viewCount));
      } else {
        sorted = videos.sort((a, b) => b.likeCount - a.likeCount);
      }

      return NextResponse.json({ data: sorted.map(v => ({
        title: v.title,
        videoId: v.videoId,
        views: v.viewCount,
        likes: v.likeCount
      }))}, { status: 200 });

    } catch (invidiousError) {
      console.error('Invidious API failed, falling back to YouTube API:', invidiousError);
      
      // Fallback to YouTube API if Invidious fails
      if (!process.env.YOUTUBE_API_KEY) {
        return NextResponse.json(
          { error: 'Invidious API failed and YouTube API key is not configured' },
          { status: 500 }
        );
      }

      // Use existing YouTube API logic
      let channelId: string;
      
      if (identifier.startsWith('UC')) {
        channelId = identifier;
      } else if (identifier.startsWith('@')) {
        const username = identifier.slice(1);
        channelId = await resolveChannelIdFromUsername(username);
      } else if (identifier.startsWith('c/')) {
        const customUrl = identifier.slice(2);
        channelId = await resolveChannelIdFromCustomUrl(customUrl);
        console.log("channelId");
        console.log(channelId);
      } else {
        return NextResponse.json({ error: 'Invalid channel identifier' }, { status: 400 });
      }

      const videos = await getChannelVideos(channelId, maxVideos);
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

      let sorted;
      if (sortMode === 'ratio') {
        sorted = videosWithStats.sort((a, b) => b.likes / b.views - a.likes / a.views);
      } else {
        sorted = videosWithStats.sort((a, b) => b.likes - a.likes);
      }

      return NextResponse.json({ data: sorted }, { status: 200 });
    }
  } catch (err: unknown) {
    const error = err as ApiError;
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}

async function getVideosFromInvidious(identifier: string, maxVideos: number): Promise<InvidiousVideo[]> {
  let channelId: string;
  
  // If it's already a channel ID, use it directly
  if (identifier.startsWith('UC')) {
    channelId = identifier;
  } else {
    // Use Invidious search to find the channel
    const searchQuery = identifier.startsWith('@') ? identifier.slice(1) : identifier.replace('c/', '');
    const searchResults = await fetchInvidiousAPI('/search', {
      q: searchQuery,
      type: 'channel'
    });

    if (!searchResults || !searchResults[0] || !searchResults[0].authorId) {
      throw new Error('Channel not found on Invidious');
    }

    channelId = searchResults[0].authorId;
  }

  // Get videos from the channel
  const videos: InvidiousVideo[] = [];
  let page = 1;

  while (videos.length < maxVideos) {
    try {
      const searchResults = await fetchInvidiousAPI('/channels/videos/' + channelId, {
        page: page.toString()
      });

      if (!searchResults || searchResults.length === 0) break;

      // Fetch video details in parallel
      const videoDetails = await Promise.all(
        searchResults.map(async (video: any) => {
          try {
            const details = await fetchInvidiousAPI('/videos/' + video.videoId);
            return {
              title: details.title,
              videoId: details.videoId,
              viewCount: details.viewCount,
              likeCount: details.likeCount
            };
          } catch (error) {
            console.error(`Failed to fetch details for video ${video.videoId}`);
            return null;
          }
        })
      );

      videos.push(...videoDetails.filter((v): v is InvidiousVideo => v !== null));
      page++;

    } catch (error) {
      console.error('Error fetching videos from Invidious:', error);
      break;
    }
  }

  if (videos.length === 0) {
    throw new Error('No videos found on Invidious');
  }

  return videos.slice(0, maxVideos);
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
  } catch (error) {
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
