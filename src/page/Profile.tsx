import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { profileAPI } from "../api";
import { Trophy, TrendingUp, Clock, User, Award } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  score: number;
  tag: string;
  time_created: string;
}

interface Profile {
  username: string;
  email?: string | null;
  name?: string | null;
  github?: string | null;
  discord_username?: string | null;
  about?: string | null;
  admin?: boolean;
}

interface ProfileApiResponse {
  profile: Profile;
  leaderboard_entries: LeaderboardEntry[];
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { username } = useParams(); 

  const isSelf = !username || username === user?.username;
  console.log(username);
    

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            if (!username || username === user.username) {
                const data: ProfileApiResponse = await profileAPI.getProfileSelf();
                setProfile(data.profile);
                setLeaderboardEntries(data.leaderboard_entries || []);
            } else {                
                const data: ProfileApiResponse = await profileAPI.getProfilePublic(username);
                setProfile(data.profile);
                setLeaderboardEntries(data.leaderboard_entries || []);
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, username]);

  const getScoreStats = () => {
    if (leaderboardEntries.length === 0) {
      return {
        totalSubmissions: 0,
        bestScore: 0,
        latestScore: 0,
        latestDate: "N/A",
      };
    }

    const sortedByScore = [...leaderboardEntries].sort((a, b) => b.score - a.score);
    const sortedByDate = [...leaderboardEntries].sort((a, b) => 
      new Date(b.time_created).getTime() - new Date(a.time_created).getTime()
    );

    return {
      totalSubmissions: leaderboardEntries.length,
      bestScore: sortedByScore[0]?.score || 0,
      latestScore: sortedByDate[0]?.score || 0,
      latestDate: sortedByDate[0] ? new Date(sortedByDate[0].time_created).toLocaleString() : "N/A",
    };
  };

  const stats = getScoreStats();

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-4xl mx-auto">
      <div className="mb-10 border-b border-[#444] pb-6">
        <h1 className="text-3xl font-bold mb-2 font-glitch">
          Profile —{" "}
          <span className="text-[#ff00cc]">
            {isSelf ? "You" : profile?.username}
          </span>
          {profile?.admin && (
            <span className="ml-2 text-sm bg-yellow-500 text-black px-2 py-1 rounded">
              ADMIN
            </span>
          )}
        </h1>
      </div>
  
      {loading ? (
        <p className="text-gray-400">Loading profile...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="bg-gray-900 border border-[#ff00cc] rounded-lg p-6">
            <h2 className="text-xl font-bold text-[#ff00cc] mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Info
            </h2>
            <p><span className="text-[#39ff14]">Username:</span> {profile?.username || "N/A"}</p>
            <p><span className="text-[#39ff14]">Name:</span> {profile?.name || "N/A"}</p>
            <p><span className="text-[#39ff14]">GitHub:</span> {profile?.github || "N/A"}</p>
            <p><span className="text-[#39ff14]">Discord:</span> {profile?.discord_username || "N/A"}</p>
            <div className="mt-4">
              <p className="text-[#39ff14] font-semibold">About Me:</p>
              <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded mt-2">
                {profile?.about || "This user hasn't written anything yet."}
              </p>
            </div>
          </div>
  
          {/* Score Stats */}
          <div className="bg-gray-900 border border-[#39ff14] rounded-lg p-6">
            <h2 className="text-xl font-bold text-[#39ff14] mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Performance Stats
            </h2>
            <p className="flex items-center mb-2">
              <Award className="h-5 w-5 mr-2 text-yellow-300" />
              Total submissions:
              <span className="ml-2 font-mono">{stats.totalSubmissions}</span>
            </p>
            <p className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
              Best score:
              <span className="ml-2 font-mono">{stats.bestScore}</span>
            </p>
            <p className="flex items-center mb-2">
              <Trophy className="h-5 w-5 mr-2 text-blue-400" />
              Latest score:
              <span className="ml-2 font-mono">{stats.latestScore}</span>
            </p>
            <p className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-cyan-400" />
              Last submission:
              <span className="ml-2 font-mono text-xs">{stats.latestDate}</span>
            </p>
          </div>

          {/* Recent Scores - Show for both self and public profiles */}
          {leaderboardEntries.length > 0 && (
            <div className="bg-gray-900 border border-[#00ffff] rounded-lg p-6 md:col-span-2">
              <h2 className="text-xl font-bold text-[#00ffff] mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Recent Scores
              </h2>
              <div className="space-y-2 mt-8">
                {leaderboardEntries
                  .sort((a, b) => new Date(b.time_created).getTime() - new Date(a.time_created).getTime())
                  .map((entry, index) => (
                    <div 
                      key={`${entry.time_created}-${index}`}
                      className="flex justify-between items-center bg-gray-800 p-3 rounded border-l-4 border-[#00ffff]"
                    >
                      <div>
                        <span className="font-mono text-lg">
                          Score: {entry.score}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({entry.tag})
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.time_created).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
