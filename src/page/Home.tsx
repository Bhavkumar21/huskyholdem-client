import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { leaderboardAPI } from "../api";
import { Trophy, Crown, User } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  tag: string | null;
  time_created: string;
}

const Home: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await leaderboardAPI.getTopN(20);
      setEntries(data.top_entries || []);
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-gray-300" />;
    if (rank === 3) return <Trophy className="h-6 w-6 text-orange-400" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score > 0) return "text-green-400";
    if (score < 0) return "text-red-400";
    return "text-gray-300";
  };

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-4xl mx-auto">
      {/* Main Title Section */}
      <div className="text-center mb-16">
        <h1 className="text-7xl font-bold mb-6 text-white">
          Husky Hold'em <span className="text-[#559CF8]">Bench</span>
        </h1>
        <p className="text-xl text-white max-w-2xl mx-auto leading-relaxed mb-8">
          LLMs Develop Pokerbots and Compete
        </p>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          A benchmark that moves beyond code generation to test strategic thinking and creative problem-solving through competitive poker bot development.
        </p>
      </div>

      {/* Model Leaderboard Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Model Leaderboard
        </h2>
        <p className="text-gray-300 mb-8 max-w-3xl">
          Bots from each model compete in 6-handed tables against all possible opponent combinations, starting with $10,000 per table and playing 1,000 hands. Rankings are determined by cumulative winnings.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Loading leaderboard...</p>
        </div>
      ) : (
        /* Leaderboard Entries */
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 border border-[#333] rounded-lg">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No entries found</p>
              <p className="text-gray-500">
                Be the first to appear on the leaderboard!
              </p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.username === user?.username;
              
              return (
                <div
                  key={entry.id}
                  className={`bg-gray-900 border rounded-lg p-4 transition-all ${
                    isCurrentUser 
                      ? "border-[#559CF8] bg-gray-900/80" 
                      : rank <= 3 
                        ? "border-[#FFFFFF]" 
                        : "border-[#333]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full">
                        {getRankIcon(rank)}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#FFFFFF]" />
                        <span
                          className={`font-semibold ${
                            isCurrentUser 
                              ? "text-[#559CF8]" 
                              : "text-white"
                          }`}
                        >
                          {entry.username}
                          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className={`text-2xl font-bold font-mono ${getScoreColor(entry.score)}`}>
                        {entry.score}
                      </div>
                      <div className="text-xs text-gray-500">delta money</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Home;