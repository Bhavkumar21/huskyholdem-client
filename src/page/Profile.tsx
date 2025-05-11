import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { profileAPI } from "../api";
import { Package, Star, Clock } from "lucide-react";

interface Submission {
  id: string;
  player_file: string;
  package_file: string;
  final: boolean;
  created_at: string;
}

interface Profile {
  username: string;
  email?: string | null;
  name?: string | null;
  github?: string | null;
  discord_username?: string | null;
  about?: string | null;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
                const data = await profileAPI.getProfileSelf();
                setProfile(data.profile);
                setSubmissions(data.submissions);
            } else {                
                const profileData = await profileAPI.getProfilePublic(username);
                setProfile(profileData);                
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, username]);

  const getSubmissionStats = () => {
    const total = submissions.length;
    const finalCount = submissions.filter((s) => s.final).length;
    const latest = submissions.reduce((latest, s) => {
      return new Date(s.created_at) > new Date(latest.created_at) ? s : latest;
    }, submissions[0]);

    return {
      total,
      finalCount,
      latestDate: latest ? new Date(latest.created_at).toLocaleString() : "N/A",
    };
  };

  const stats = getSubmissionStats();

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-4xl mx-auto">
      <div className="mb-10 border-b border-[#444] pb-6">
        <h1 className="text-3xl font-bold mb-2 font-glitch">
          Profile —{" "}
          <span className="text-[#ff00cc]">
            {isSelf ? "You" : profile?.username}
          </span>
        </h1>
      </div>
  
      {loading ? (
        <p className="text-gray-400">Loading profile...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="bg-gray-900 border border-[#ff00cc] rounded-lg p-6">
            <h2 className="text-xl font-bold text-[#ff00cc] mb-4">🧠 Profile Info</h2>
            <p><span className="text-[#39ff14]">Name:</span> {profile?.name || "N/A"}</p>
            {isSelf && (
              <p><span className="text-[#39ff14]">Email:</span> {profile?.email || "N/A"}</p>
            )}
            <p><span className="text-[#39ff14]">GitHub:</span> {profile?.github || "N/A"}</p>
            <p><span className="text-[#39ff14]">Discord:</span> {profile?.discord_username || "N/A"}</p>
            <div className="mt-4">
              <p className="text-[#39ff14] font-semibold">About Me:</p>
              <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded mt-2">
                {profile?.about || "This user hasn't written anything yet."}
              </p>
            </div>
          </div>
  
          {/* Submission Stats - only for own profile */}
          {isSelf && (
            <div className="bg-gray-900 border border-[#39ff14] rounded-lg p-6">
              <h2 className="text-xl font-bold text-[#39ff14] mb-4">📦 Submission Stats</h2>
              <p className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-yellow-300" />
                Total submissions:
                <span className="ml-2 font-mono">{stats.total}</span>
              </p>
              <p className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-green-400" />
                Final marked:
                <span className="ml-2 font-mono">{stats.finalCount}</span>
              </p>
              <p className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-cyan-400" />
                Latest:
                <span className="ml-2 font-mono">{stats.latestDate}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
