import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { liveAPI, gameAPI, llmAPI } from "../api";
import { Gamepad2, ArrowLeft, Loader2, ArrowUpDown } from "lucide-react";
import UserPerformanceChart from "../components/UserPerformanceChart";

interface JobGameInfo {
  game_id: string;
  game_uuid: string;
}

// interface JobGamesResponse {
//   message: string;
//   job_id: string;
//   games: JobGameInfo[];
//   total_count?: number;
//   page?: number;
//   page_size?: number;
//   has_next?: boolean;
//   has_previous?: boolean;
// }

interface GameResult {
  [player_id: string]: number;
}

interface BatchOrderResponse {
  game_log_id: string;
  batch_id: string;
  batch_order: number;
  total_batches: number;
}



type SortOrder = 'uuid-asc' | 'uuid-desc' | 'none';

const JobGamesPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState<JobGameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobResult, setJobResult] = useState<GameResult | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [batchOrders, setBatchOrders] = useState<Record<string, BatchOrderResponse | null>>({});
  
  // PAGINATION STATE VARIABLES COMMENTED OUT FOR NOW
  // const [page, setPage] = useState<number>(1);
  // const [pageSize] = useState<number>(100);
  // const [hasNext, setHasNext] = useState<boolean>(false);
  // const [_hasPrevious, setHasPrevious] = useState<boolean>(false);
  // const [loadingMore, setLoadingMore] = useState<boolean>(false);
  
  // Get game number from URL parameter
  const gameNumber = searchParams.get('gameNumber');

  useEffect(() => {
    // reset on job change
    setGames([]);
    fetchGames();
    // eslint-disable-next-line
  }, [jobId]);

  useEffect(() => {
    if (games.length > 0) {
      fetchAllResults();
      fetchBatchOrders();
    }
    // eslint-disable-next-line
  }, [games]);

  // Scroll to specific game if hash is present
  useEffect(() => {
    if (!loading && games.length > 0) {
      const hash = window.location.hash;
      if (hash) {
        const gameId = hash.substring(1); // Remove the # symbol
        const targetElement = document.getElementById(gameId);
        if (targetElement) {
          // Add a small delay to ensure the page is fully rendered
          setTimeout(() => {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // Add a highlight effect
            targetElement.style.border = '2px solid #FFFFFF';
            targetElement.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.5)';
            setTimeout(() => {
              targetElement.style.border = '';
              targetElement.style.boxShadow = '';
            }, 3000);
          }, 500);
        }
      }
    }
  }, [loading, games]);

  const fetchGames = async () => {
    setError(null);
    try {
      if (!jobId) throw new Error("No job ID provided");
      setLoading(true);
      // Use regular API call instead of paginated one to get all games
      const response = await liveAPI.get_job_games(jobId);
      setGames(response.games || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to load games.");
    } finally {
      setLoading(false);
    }
  };

  // PAGINATION LOAD MORE FUNCTION COMMENTED OUT FOR NOW
  // const handleLoadMore = async () => {
  //   if (!hasNext || loadingMore) return;
  //   setLoadingMore(true);
  //   try {
  //     await fetchGames(page + 1, pageSize, true);
  //   } finally {
  //     setLoadingMore(false);
  //   }
  // };

  const fetchAllResults = async () => {
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
  };

  const fetchBatchOrders = async () => {
    if (games.length === 0) return;
    
    try {
      // Since all games in a job have the same batch order, fetch once using the first game
      const firstGame = games[0];
      const res: BatchOrderResponse = await llmAPI.get_batch_order_for_game_log(firstGame.game_id);
      
      // Apply the same batch order to all games
      const newBatchOrders: Record<string, BatchOrderResponse | null> = {};
      games.forEach(game => {
        newBatchOrders[game.game_id] = res;
      });
      
      setBatchOrders(newBatchOrders);
    } catch (err: any) {
      // If batch order fetch fails, set all games to null
      const newBatchOrders: Record<string, BatchOrderResponse | null> = {};
      games.forEach(game => {
        newBatchOrders[game.game_id] = null;
      });
      setBatchOrders(newBatchOrders);
      console.error(`Failed to fetch batch order for job:`, err);
    }
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

  const handleSortToggle = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'uuid-asc';
      if (prev === 'uuid-asc') return 'uuid-desc';
      return 'none';
    });
  };

  const getSortedGames = () => {
    if (sortOrder === 'none') return games;
    
    return [...games].sort((a, b) => {
      const uuidA = parseInt(a.game_uuid);
      const uuidB = parseInt(b.game_uuid);
      
      if (sortOrder === 'uuid-asc') {
        return uuidA - uuidB;
      } else {
        return uuidB - uuidA;
      }
    });
  };

  const getSortButtonText = () => {
    switch (sortOrder) {
      case 'uuid-asc': return 'UUID ASC';
      case 'uuid-desc': return 'UUID DESC';
      case 'none': return 'SORT BY UUID';
      default: return 'SORT BY UUID';
    }
  };

  const sortedGames = getSortedGames();

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Link to="/games" className="text-[#559CF8] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-5 h-5" /> Back to Games
        </Link>
      </div>
      <div className="mb-8 border-b border-[#444] pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Gamepad2 className="w-7 h-7 text-[#559CF8]" />
          <h1 className="text-2xl font-bold font-glitch">
            Live Gameplay for {gameNumber ? `Game #${gameNumber}` : 'Game'}: <span className="text-[#FFFFFF]">{jobId}</span>
          </h1>
        </div>
      </div>
      {jobResult && (
        <div className="mb-10 p-0 border-2 border-[#FFFFFF] rounded-lg overflow-hidden w-full max-w-6xl mx-auto">
          <div className="px-6 py-3 border-b-2 border-[#FFFFFF] bg-black/80">
            <span className="text-lg font-mono font-bold tracking-widest text-[#FFFFFF] uppercase">Job Final Result</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y divide-[#FFFFFF]">
            {Object.entries(jobResult).map(([player, score]) => (
              <div
                key={player}
                className="flex items-center px-6 py-4 font-mono text-base text-[#FFFFFF] whitespace-nowrap border-[#FFFFFF] bg-black/60"
                style={{ borderBottom: '1px solid #FFFFFF', borderRight: '1px solid #FFFFFF' }}
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

      {/* User Performance Chart */}
      {jobId && (
        <div className="mb-8">
          <UserPerformanceChart jobId={jobId} games={games} />
        </div>
      )}
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#559CF8] animate-spin" />
          <span className="ml-3 text-gray-400">Loading games...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}
      {!loading && !error && sortedGames.length > 0 && (
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleSortToggle}
              className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                sortOrder === 'none' 
                  ? 'border-[#FFFFFF] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-black' 
                  : 'border-[#559CF8] text-[#559CF8] hover:bg-[#559CF8] hover:text-black'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              {getSortButtonText()}
            </button>
          </div>

          {/* Games List */}
          {sortedGames.map((game, index) => {
            const batchOrder = batchOrders[game.game_id];
            return (
              <div 
                key={game.game_id} 
                id={`game-${game.game_uuid}`}
                className="bg-black/30 border border-[#444] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <div>
                  <span className="font-mono text-white">Hand #{index + 1}: </span>
                  <span className="font-mono text-[#559CF8]">{game.game_id}</span>
                </div>
                <div>
                  <span className="font-mono text-gray-400">
                    {batchOrder ? `Batch ${batchOrder.batch_order}` : 'No Batch Info'}
                  </span>
                </div>
                <div className="flex gap-3 mt-2 md:mt-0">
                  <button
                    className="px-3 py-1 border border-[#559CF8] text-[#559CF8] font-mono rounded hover:bg-[#559CF8] hover:text-black transition-colors text-sm"
                    onClick={() => handleDownloadRawLog(game.game_id)}
                  >
                    Get Raw Log
                  </button>
                  <button
                    className="px-3 py-1 border border-[#FFFFFF] text-[#FFFFFF] font-mono rounded hover:bg-[#FFFFFF] hover:text-black transition-colors text-sm"
                    onClick={() => navigate(`/replay/${game.game_id}`)}
                  >
                    View Hand
                  </button>
                </div>
              </div>
            );
          })}

          {/* PAGINATION COMMENTED OUT FOR NOW */}
          {/* {hasNext && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-[#FFFFFF] text-[#FFFFFF] rounded hover:bg-[#FFFFFF] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

export default JobGamesPage; 