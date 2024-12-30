"use client";

import { useState } from 'react';

export default function HomePage() {
  const [channelUrl, setChannelUrl] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchVideos(sortMode: 'likes' | 'ratio') {
    try {
      setLoading(true);
      setError(null);
      setVideos([]);

      const queryParams = new URLSearchParams({
        channelUrl: channelUrl.trim(),
        sortMode: sortMode === 'ratio' ? 'ratio' : 'likes',
      });

      const res = await fetch(`/api/videos?${queryParams}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setVideos(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ margin: '40px auto', maxWidth: 600, textAlign: 'center' }}>
      <h1>YouTube Video Sorter</h1>
      <input
        style={{ width: '100%', padding: 8 }}
        type="text"
        placeholder="Paste YouTube Channel URL here"
        value={channelUrl}
        onChange={(e) => setChannelUrl(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <button
          style={{ marginRight: 10, padding: '6px 12px' }}
          onClick={() => fetchVideos('likes')}
        >
          Sort by Likes
        </button>
        <button style={{ padding: '6px 12px' }} onClick={() => fetchVideos('ratio')}>
          Sort by Like:View Ratio
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {videos.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 20,
            textAlign: 'left',
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc' }}>Video Title</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Likes</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Views</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Ratio (%)</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v, idx) => {
              const ratio = v.views === 0 ? 0 : ((v.likes / v.views) * 100).toFixed(2);

              return (
                <tr key={idx}>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
                    <a
                      href={`https://www.youtube.com/watch?v=${v.videoId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'blue', textDecoration: 'underline' }}
                    >
                      {v.title}
                    </a>
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
                    {v.likes}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
                    {v.views}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
                    {ratio}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
