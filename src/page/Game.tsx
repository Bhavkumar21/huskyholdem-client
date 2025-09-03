import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { liveAPI, llmAPI } from "../api";
import { Gamepad2, Users, Calendar, Clock, Trophy, RefreshCw, ArrowUpDown } from "lucide-react";

interface JobWithPlayers {
  job_id: string;
  players: string[];
  first_game_created_at: string;
  is_public?: boolean;
  batch_id?: string; // Optional batch_id from pagination response
  gameNumber?: number; // Add game number for display within batch
  batchNumber?: number; // Add batch number for grouping
}

interface PaginatedJobIdsResponse {
  message: string;
  jobs: JobWithPlayers[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}


interface BatchMetadata {
  batch_id: string;
  metadata_id?: string;
  batch_metadata: Record<string, any>;
  batch_entries_count?: number;
  created_at?: string;
}

type SortOrder = 'newest' | 'oldest' | 'none';

const GamePage: React.FC = () => {
  const [jobs, setJobs] = useState<JobWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Cache for batch ID to batch number mapping
  const [batchCache, setBatchCache] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      const response: PaginatedJobIdsResponse = await liveAPI.get_public_job_ids_paginated(1, 100);
      
      // Sort jobs by creation time (newest first - server already returns newest first)
      const sortedJobs = response.jobs.sort((a, b) => {
        const dateA = new Date(a.first_game_created_at).getTime();
        const dateB = new Date(b.first_game_created_at).getTime();
        return dateB - dateA; // Newest first (descending order)
      });
      
      // Don't assign game numbers here - they will be assigned within batches
      setJobs(sortedJobs);
      setHasNext(response.has_next);
      
      // Fetch batch metadata for each job and assign batch-specific game numbers
      await fetchBatchMetadataForJobs(sortedJobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load games. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchMetadataForJobs = async (jobs: JobWithPlayers[]) => {
    const newBatchIds = new Set<string>();
    
    // First pass: collect all unique batch IDs from the jobs
    jobs.forEach(job => {
      if (job.batch_id && !batchCache.has(job.batch_id)) {
        newBatchIds.add(job.batch_id);
      }
    });
    
    // Fetch metadata for new batch IDs only
    const newBatchMetadata = new Map<string, number>();
    if (newBatchIds.size > 0) {
      const metadataPromises = Array.from(newBatchIds).map(async (batchId) => {
        try {
          const metadata: BatchMetadata = await llmAPI.getBatchMetadata(batchId);
          return {
            batchId,
            batchNumber: metadata.batch_metadata?.batch_number || 1
          };
        } catch (err) {
          console.error(`Failed to fetch metadata for batch ${batchId}:`, err);
          return {
            batchId,
            batchNumber: 1
          };
        }
      });
      
      const metadataResults = await Promise.all(metadataPromises);
      metadataResults.forEach(({ batchId, batchNumber }) => {
        newBatchMetadata.set(batchId, batchNumber);
      });
      
      // Update cache with new batch metadata
      setBatchCache(prevCache => {
        const newCache = new Map(prevCache);
        newBatchMetadata.forEach((batchNumber, batchId) => {
          newCache.set(batchId, batchNumber);
        });
        return newCache;
      });
    }
    
    // Assign batch numbers using cache and new metadata
    const jobsWithBatchInfo: JobWithPlayers[] = jobs.map(job => {
      let batchNumber = -1; // Default for jobs without batch_id
      
      if (job.batch_id) {
        // Check cache first, then new metadata
        batchNumber = batchCache.get(job.batch_id) || newBatchMetadata.get(job.batch_id) || 1;
      }
      
      return {
        ...job,
        batchNumber
      };
    });
    
    // Recalculate all game numbers within batches
    const finalJobs = recalculateGameNumbers(jobsWithBatchInfo);
    setJobs(finalJobs);
  };

  const recalculateGameNumbers = (allJobs: JobWithPlayers[]) => {
    // Group jobs by batch and assign game numbers within each batch
    const jobsGroupedByBatch = allJobs.reduce((acc, job) => {
      const batchNum = job.batchNumber || 1;
      if (!acc[batchNum]) {
        acc[batchNum] = [];
      }
      acc[batchNum].push(job);
      return acc;
    }, {} as Record<number, JobWithPlayers[]>);
    
    // Sort jobs within each batch by creation time (newest first) and assign descending game numbers
    const finalJobs: JobWithPlayers[] = [];
    Object.keys(jobsGroupedByBatch).sort((a, b) => Number(a) - Number(b)).forEach(batchNum => {
      const batchJobs = jobsGroupedByBatch[Number(batchNum)];
      // Sort by creation time within the batch (newest first - server already returns newest first)
      const sortedBatchJobs = batchJobs.sort((a, b) => {
        const dateA = new Date(a.first_game_created_at).getTime();
        const dateB = new Date(b.first_game_created_at).getTime();
        return dateB - dateA; // Newest first (descending order)
      });
      
      // Assign ascending game numbers within this batch (1, 2, 3, etc.)
      sortedBatchJobs.forEach((job, index) => {
        finalJobs.push({
          ...job,
          gameNumber: index + 1 // Use simple ascending index starting from 1
        });
      });
    });
    
    return finalJobs;
  };

  const loadMoreGames = async () => {
    if (!hasNext || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response: PaginatedJobIdsResponse = await liveAPI.get_public_job_ids_paginated(nextPage, 100);
      
      // Sort new jobs by creation time (newest first - server already returns newest first)
      const sortedNewJobs = response.jobs.sort((a, b) => {
        const dateA = new Date(a.first_game_created_at).getTime();
        const dateB = new Date(b.first_game_created_at).getTime();
        return dateB - dateA; // Newest first (descending order)
      });
      
      // Fetch batch metadata for new jobs using cache
      const newBatchIds = new Set<string>();
      
      // First pass: collect all unique batch IDs from the jobs
      sortedNewJobs.forEach(job => {
        if (job.batch_id && !batchCache.has(job.batch_id)) {
          newBatchIds.add(job.batch_id);
        }
      });
      
      // Fetch metadata for new batch IDs only
      const newBatchMetadata = new Map<string, number>();
      if (newBatchIds.size > 0) {
        const metadataPromises = Array.from(newBatchIds).map(async (batchId) => {
          try {
            const metadata: BatchMetadata = await llmAPI.getBatchMetadata(batchId);
            return {
              batchId,
              batchNumber: metadata.batch_metadata?.batch_number || 1
            };
          } catch (err) {
            console.error(`Failed to fetch metadata for batch ${batchId}:`, err);
            return {
              batchId,
              batchNumber: 1
            };
          }
        });
        
        const metadataResults = await Promise.all(metadataPromises);
        metadataResults.forEach(({ batchId, batchNumber }) => {
          newBatchMetadata.set(batchId, batchNumber);
        });
        
        // Update cache with new batch metadata
        setBatchCache(prevCache => {
          const newCache = new Map(prevCache);
          newBatchMetadata.forEach((batchNumber, batchId) => {
            newCache.set(batchId, batchNumber);
          });
          return newCache;
        });
      }
      
      // Assign batch numbers using cache and new metadata
      const jobsWithBatchInfo: JobWithPlayers[] = sortedNewJobs.map(job => {
        let batchNumber = -1; // Default for jobs without batch_id
        
        if (job.batch_id) {
          // Check cache first, then new metadata
          batchNumber = batchCache.get(job.batch_id) || newBatchMetadata.get(job.batch_id) || 1;
        }
        
        return {
          ...job,
          batchNumber
        };
      });
      
      // Combine existing jobs with new jobs
      const allJobs = [...jobs, ...jobsWithBatchInfo];
      
      // Recalculate all game numbers within batches
      const finalJobs = recalculateGameNumbers(allJobs);
      
      setJobs(finalJobs);
      setCurrentPage(nextPage);
      setHasNext(response.has_next);
    } catch (err) {
      console.error("Error loading more games:", err);
      setError("Failed to load more games. Please try again later.");
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string) => {
    let isoString = dateString;
    // If it has a T but no Z or timezone, treat as UTC by appending Z
    if (
      isoString.includes('T') &&
      !isoString.endsWith('Z') &&
      !/[+-][0-9]{2}:[0-9]{2}$/.test(isoString)
    ) {
      isoString += 'Z';
    }
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const handleSortToggle = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'newest';
      if (prev === 'newest') return 'oldest';
      return 'none';
    });
  };

  const getSortedJobs = () => {
    if (sortOrder === 'none') return jobs;
    
    return [...jobs].sort((a, b) => {
      const dateA = new Date(a.first_game_created_at).getTime();
      const dateB = new Date(b.first_game_created_at).getTime();
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  };

  const getSortButtonText = () => {
    switch (sortOrder) {
      case 'newest': return 'NEWEST FIRST';
      case 'oldest': return 'OLDEST FIRST';
      case 'none': return 'SORT BY DATE';
      default: return 'SORT BY DATE';
    }
  };

  const sortedJobs = getSortedJobs();

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-[#444] pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Gamepad2 className="w-8 h-8 text-[#559CF8]" />
          <h1 className="text-3xl font-bold font-glitch">
            Game <span className="text-[#FFFFFF]">Replay</span>
          </h1>
        </div>
        <p className="text-gray-300">
          Full tournament results with clickable game analysis: watch any 1,000-hand match and examine exactly how each bot performed across all competitive tables.
        </p>
              </div>

        {/* Refresh Button */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#559CF8] text-black hover:bg-[#559CF8]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        
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

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#559CF8] mb-4"></div>
            <p className="text-gray-400">Loading games...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-black/30 border border-[#444] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-[#559CF8]" />
                <span className="text-sm text-gray-400">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{jobs.length}</p>
            </div>
            
            <div className="bg-black/30 border border-[#444] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-[#FFFFFF]" />
                <span className="text-sm text-gray-400">Total Players</span>
              </div>
              <p className="text-2xl font-bold text-white">
                13
              </p>
            </div>
            
            <div className="bg-black/30 border border-[#444] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Recent Games</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {jobs.filter(job => {
                  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return new Date(job.first_game_created_at) > dayAgo;
                }).length}
              </p>
            </div>
          </div>

          {/* Games List */}
          {sortedJobs.length === 0 ? (
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No games found</p>
              <p className="text-gray-500 text-sm">Games will appear here once they are run</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedJobs.map((job, index) => (
                <div
                  key={job.job_id}
                  className="bg-black/30 border border-[#444] rounded-lg p-6 hover:border-[#559CF8]/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-[#559CF8]/20 p-2 rounded-lg">
                          <Gamepad2 className="w-5 h-5 text-[#559CF8]" />
                        </div>
                        <div>
                          <Link
                            to={`/games/${job.job_id}?gameNumber=${job.gameNumber || index + 1}`}
                            className="font-bold text-white font-mono underline underline-offset-4 hover:text-[#559CF8] transition-colors"
                          >
                            {job.batchNumber ? `Batch #${job.batchNumber}` : 'Batch #1'} Game #{job.gameNumber || index + 1} 
                          </Link>
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            ID: {job.job_id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-[#7C98B8]">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{job.players.length} player{job.players.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(job.first_game_created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {job.players.map((player, index) => (
                        <span
                          key={index}
                          className="border border-[#7C98B8] px-2 py-1 text-[#FFFFFF] rounded text-sm font-mono"
                        >
                          {player}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasNext && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMoreGames}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-[#559CF8] text-black hover:bg-[#559CF8]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    Loading More Games...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Load More Games
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GamePage; 