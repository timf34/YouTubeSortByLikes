"use client";

import { useState } from "react";
import { decodeHtmlEntities } from "@/lib/utils";

/**
 * A modern, single-page UI for "YouTube Sort By Likes",
 * created by Tim (https://github.com/timf34).
 *
 * Monospace-inspired design with blocky elements and fun interactions.
 */
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
    <div className="relative min-h-screen flex flex-col bg-[#FFFDF8] text-gray-900 font-mono">
      {/* GitHub Banner */}
      <div className="w-full bg-[#ffc480] border-b-[3px] border-gray-900">
        <div className="container mx-auto px-4 py-2 flex items-center justify-center">
          <a
            href="https://github.com/timf34/YouTubeSortByLikes"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 text-gray-900 hover:-translate-y-px transition-transform"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-medium">View on GitHub</span>
          </a>
        </div>
      </div>

      {/* Main content container */}
      <main className="flex-1 z-10 container mx-auto px-6 py-12 flex flex-col items-center">
        {/* Title Box */}
        <div className="relative mb-12">
          <div className="w-full h-full absolute inset-0 bg-gray-900 rounded-xl translate-y-2 translate-x-2"></div>
          <div className="bg-[#fff4da] rounded-xl border-[3px] border-gray-900 p-8 relative z-20">
            <h1 className="text-4xl md:text-5xl font-bold text-center tracking-tight">
              YouTube Sort By Likes
            </h1>
            <p className="mt-4 text-center text-gray-700">
              Quickly find the top-liked or highest like:view ratio videos from
              any channel. Paste a YouTube channel URL below to get started!
            </p>
          </div>
        </div>

        {/* Input + Buttons */}
        <div className="w-full max-w-2xl relative">
          <div className="w-full h-full absolute inset-0 bg-gray-900 rounded-xl translate-y-2 translate-x-2"></div>
          <div className="bg-[#fff4da] rounded-xl border-[3px] border-gray-900 p-6 relative z-20">
            <div className="space-y-4">
              <div className="relative">
                <div className="w-full h-full rounded bg-gray-900 translate-y-1 translate-x-1 absolute inset-0"></div>
                <input
                  type="text"
                  placeholder="e.g. https://www.youtube.com/@MarkRober"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="block w-full rounded border-[3px] border-gray-900 px-4 py-3 bg-white
                           relative z-10 focus:outline-none focus:translate-x-0 focus:translate-y-0
                           transition-transform placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="w-full h-full rounded bg-gray-900 translate-y-1 translate-x-1 absolute inset-0"></div>
                  <button
                    onClick={() => fetchVideos("likes")}
                    className="w-full bg-[#ffc480] text-gray-900 font-medium px-4 py-3 rounded
                             border-[3px] border-gray-900 relative z-10 group-hover:-translate-y-px
                             group-hover:-translate-x-px transition-transform"
                  >
                    Sort by Likes
                  </button>
                </div>
                <div className="relative group">
                  <div className="w-full h-full rounded bg-gray-900 translate-y-1 translate-x-1 absolute inset-0"></div>
                  <button
                    onClick={() => fetchVideos("ratio")}
                    className="w-full bg-[#5CF1A4] text-gray-900 font-medium px-4 py-3 rounded
                             border-[3px] border-gray-900 relative z-10 group-hover:-translate-y-px
                             group-hover:-translate-x-px transition-transform"
                  >
                    Sort by Like:View Ratio
                  </button>
                </div>
              </div>
            </div>

            {/* Loading or Error */}
            {loading && (
              <div className="mt-4 text-center animate-pulse">
                <div className="inline-block w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Loading...</span>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border-[3px] border-gray-900 rounded text-red-700">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        {videos.length > 0 && (
          <div className="mt-10 w-full max-w-4xl relative">
            <div className="w-full h-full absolute inset-0 bg-gray-900 rounded-xl translate-y-2 translate-x-2"></div>
            <div className="bg-[#fff4da] rounded-xl border-[3px] border-gray-900 p-4 relative z-20">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-[3px] border-gray-900">
                      <th className="px-4 py-3 text-left font-bold">Video Title</th>
                      <th className="px-4 py-3 text-left font-bold">Likes</th>
                      <th className="px-4 py-3 text-left font-bold">Views</th>
                      <th className="px-4 py-3 text-left font-bold">Ratio (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((v, idx) => {
                      const ratio = v.views === 0 ? 0 : ((v.likes / v.views) * 100).toFixed(2);
                      return (
                        <tr
                          key={idx}
                          className="border-b border-gray-900 last:border-b-0 hover:bg-[#FFC480]/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <a
                              href={`https://www.youtube.com/watch?v=${v.videoId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-900 hover:text-[#FE4A60] underline underline-offset-2"
                            >
                              {decodeHtmlEntities(v.title)}
                            </a>
                          </td>
                          <td className="px-4 py-3 font-medium">{v.likes.toLocaleString()}</td>
                          <td className="px-4 py-3">{v.views.toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium">{ratio}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t-[3px] border-gray-900 mt-12">
        <div className="container mx-auto px-6 py-4 flex flex-col items-center justify-center">
          <p className="text-gray-700">
            Created by{" "}
            <a
              className="text-gray-900 font-medium hover:text-[#FE4A60] underline underline-offset-2"
              href="https://github.com/timf34"
              target="_blank"
              rel="noreferrer"
            >
              Tim
            </a>
            . © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}