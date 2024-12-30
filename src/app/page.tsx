"use client";

import { useState } from "react";
import { decodeHtmlEntities } from "@/lib/utils";

/**
 * A modern, single-page UI for "YouTube Sort By Likes",
 * created by Tim (https://github.com/timf34).
 *
 * Tailwind classes add gradient backgrounds, subtle shadows,
 * hover transitions, and decorative wave shapes.
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
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-indigo-100 text-gray-800">
      {/* Decorative top wave */}
      <div className="absolute left-0 top-0 w-full overflow-hidden leading-none z-0">
        <svg
          className="block w-full h-[160px] text-indigo-200"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,64L48,69.3C96,75,192,85,288,122.7C384,160,480,224,576,224C672,224,768,160,864,144C960,128,1056,160,1152,154.7C1248,149,1344,75,1392,37.3L1440,0L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      {/* Main content container */}
      <main className="flex-1 z-10 container mx-auto px-6 py-12 flex flex-col items-center">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-6">
          YouTube Sort By Likes
        </h1>
        <p className="max-w-lg text-center text-gray-700 mb-8">
          Quickly find the top-liked or highest like:view ratio videos from
          any channel. Paste a YouTube channel URL below to get started!
        </p>

        {/* Input + Buttons */}
        <div className="w-full max-w-xl bg-white shadow-lg rounded-lg px-6 py-6 relative z-10">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="e.g. https://www.youtube.com/@MarkRober"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-4 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-400 transition 
                         placeholder-gray-400"
            />

            <div className="flex space-x-2">
              <button
                onClick={() => fetchVideos("likes")}
                className="flex-1 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md 
                           hover:bg-blue-700 transition"
              >
                Sort by Likes
              </button>
              <button
                onClick={() => fetchVideos("ratio")}
                className="flex-1 bg-green-600 text-white font-semibold px-4 py-2 rounded-md 
                           hover:bg-green-700 transition"
              >
                Sort by Like:View Ratio
              </button>
            </div>
          </div>

          {/* Loading or Error */}
          {loading && (
            <p className="mt-4 text-sm text-gray-600 animate-pulse">
              Loading...
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-500">Error: {error}</p>
          )}
        </div>

        {/* Results Table */}
        {videos.length > 0 && (
          <div className="mt-10 w-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Video Title
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Likes
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Views
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Ratio (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v, idx) => {
                  const ratio =
                    v.views === 0
                      ? 0
                      : ((v.likes / v.views) * 100).toFixed(2);

                  return (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.videoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {decodeHtmlEntities(v.title)}
                        </a>
                      </td>
                      <td className="px-4 py-3">{v.likes}</td>
                      <td className="px-4 py-3">{v.views}</td>
                      <td className="px-4 py-3">{ratio}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg
          className="block w-full h-[160px] text-indigo-200"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,64L48,69.3C96,75,192,85,288,122.7C384,160,480,224,576,224C672,224,768,160,864,144C960,128,1056,160,1152,154.7C1248,149,1344,75,1392,37.3L1440,0L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-gray-200 mt-6">
        <div className="container mx-auto px-6 py-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500">
            Created by{" "}
            <a
              className="underline hover:text-blue-600"
              href="https://github.com/timf34"
              target="_blank"
              rel="noreferrer"
            >
              Tim
            </a>
            . Inspired by next-level UI designs. © {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
    </div>
  );
}

