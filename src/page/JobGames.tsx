import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { liveAPI, gameAPI } from "../api";
import { Gamepad2, ArrowLeft, Loader2 } from "lucide-react";

interface JobGameInfo {
  game_id: string;
  game_uuid: string;
}

interface JobGamesResponse {
  message: string;
  job_id: string;
  games: JobGameInfo[];
}

interface GameResult {
  [player_id: string]: number;
}

const JobGamesPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [games, setGames] = useState<JobGameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, GameResult | null>>({});
  const [resultsLoading, setResultsLoading] = useState(false);
  const [jobResult, setJobResult] = useState<GameResult | null>(null);

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line
  }, [jobId]);

  useEffect(() => {
    if (games.length > 0) {
      fetchAllResults();
    }
    // eslint-disable-next-line
  }, [games]);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!jobId) throw new Error("No job ID provided");
      const response: JobGamesResponse = await liveAPI.get_job_games(jobId);
      setGames(response.games);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to load games.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    setResultsLoading(true);
    const newResults: Record<string, GameResult | null> = {};
    let jobLevelResult: GameResult | null = null;
    try {
      if (jobId) {
        // Try to get the job-level result
        const res = await gameAPI.get_job(jobId);
        if (res.result_data) {
          jobLevelResult = res.result_data;
        }
      }
    } catch {
      jobLevelResult = null;
    }
    setJobResult(jobLevelResult);
    // Optionally, you could still fetch per-game results if needed
    setResults(newResults);
    setResultsLoading(false);
  };

  const handleDownloadRawLog = async (gameId: string) => {
    try {
      const data = await liveAPI.get_game_data(gameId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game_${gameId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download raw log.');
    }
  };

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Link to="/games" className="text-[#ff00cc] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-5 h-5" /> Back to Games
        </Link>
      </div>
      <div className="mb-8 border-b border-[#444] pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Gamepad2 className="w-7 h-7 text-[#ff00cc]" />
          <h1 className="text-2xl font-bold font-glitch">
            Games for Job <span className="text-[#39ff14]">{jobId}</span>
          </h1>
        </div>
      </div>
      {jobResult && (
        <div className="mb-10 p-0 border-2 border-[#39ff14] rounded-lg overflow-hidden w-full max-w-2xl mx-auto">
          <div className="px-6 py-3 border-b-2 border-[#39ff14] bg-black/80">
            <span className="text-lg font-mono font-bold tracking-widest text-[#39ff14] uppercase">Job Final Result</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y divide-[#39ff14]">
            {Object.entries(jobResult).map(([player, score]) => (
              <div
                key={player}
                className="flex items-center px-6 py-4 font-mono text-base text-[#39ff14] whitespace-nowrap border-[#39ff14] bg-black/60"
                style={{ borderBottom: '1px solid #39ff14', borderRight: '1px solid #39ff14' }}
              >
                <a
                  href={`/profile/${player}`}
                  className="font-bold mr-2 underline underline-offset-2 hover:text-white transition-colors"
                >
                  {player}
                </a>:
                <span className="text-white font-extrabold ml-1">{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#ff00cc] animate-spin" />
          <span className="ml-3 text-gray-400">Loading games...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}
      {!loading && !error && games.length > 0 && (
        <div className="space-y-4">
          {games.map((game) => (
            <div key={game.game_id} className="bg-black/30 border border-[#444] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <span className="font-mono text-white">Game ID: </span>
                <span className="font-mono text-[#ff00cc]">{game.game_id}</span>
              </div>
              <div>
                <span className="font-mono text-gray-400">UUID: </span>
                <span className="font-mono text-[#39ff14]">{game.game_uuid}</span>
              </div>
              <div className="flex gap-3 mt-2 md:mt-0">
                <button
                  className="px-3 py-1 border border-[#ff00cc] text-[#ff00cc] font-mono rounded hover:bg-[#ff00cc] hover:text-black transition-colors text-sm"
                  onClick={() => handleDownloadRawLog(game.game_id)}
                >
                  Get Raw Log
                </button>
                <button
                  className="px-3 py-1 border border-[#39ff14] text-[#39ff14] font-mono rounded hover:bg-[#39ff14] hover:text-black transition-colors text-sm"
                  onClick={() => navigate(`/replay/${game.game_id}`)}
                >
                  View Game
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobGamesPage; 