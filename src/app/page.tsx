"use client";

import { useState } from "react";
import { decodeHtmlEntities } from "@/lib/utils";

export default function HomePage() {
  const [channelUrl, setChannelUrl] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchVideos(sortMode: "likes" | "ratio") {
    try {
      setLoading(true);
      setError(null);
      setVideos([]);

      const queryParams = new URLSearchParams({
        channelUrl: channelUrl.trim(),
        sortMode: sortMode === "ratio" ? "ratio" : "likes",
      });

      const res = await fetch(`/api/videos?${queryParams}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      setVideos(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                         text-transparent bg-clip-text mb-4">
            YouTube Video Sorter
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Discover your channel's most engaging content through likes and engagement metrics
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-3xl mx-auto 
                      border border-gray-100 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste YouTube Channel URL here"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                         transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchVideos("likes")}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium 
                         px-6 py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 
                         transition-all duration-200 shadow-sm hover:shadow-md 
                         active:scale-[0.98]"
              >
                Sort by Likes
              </button>
              <button
                onClick={() => fetchVideos("ratio")}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white 
                         font-medium px-6 py-3.5 rounded-xl hover:from-purple-700 
                         hover:to-purple-800 transition-all duration-200 shadow-sm 
                         hover:shadow-md active:scale-[0.98]"
              >
                Sort by Like:View Ratio
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-700">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"/>
                <span>Analyzing channel videos...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-red-50 text-red-700">
              Error: {error}
            </div>
          </div>
        )}

        {/* Results Table */}
        {videos.length > 0 && (
          <div className="mt-12 w-full overflow-hidden rounded-2xl border border-gray-200 
                        bg-white shadow-xl">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 font-semibold text-gray-900">Video Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Likes</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Views</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Ratio (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {videos.map((v, idx) => {
                  const ratio = v.views === 0 ? 0 : ((v.likes / v.views) * 100).toFixed(2);
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.videoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {decodeHtmlEntities(v.title)}
                        </a>
                      </td>
                      <td className="px-6 py-4 font-mono">{v.likes.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono">{v.views.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono">{ratio}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
