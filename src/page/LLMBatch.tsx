import { ChevronDown, X, Zap, Users, Play, Trash2, RefreshCw, Edit3, Save, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { submissionAPI, userAPI, llmAPI } from "../api";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

interface Batch {
  batch_id: string;
  created_at: string;
  jobs: Array<{
    job_id: string;
    status: string;
    username: string;
    users_to_run: string[];
  }>;
  total_jobs: number;
  job_statuses: Record<string, number>;
}

interface BatchMetadata {
  batch_id: string;
  metadata_id?: string;
  batch_metadata: Record<string, any>;
  batch_entries_count?: number;
  created_at?: string;
}

const LLMBatchPage = () => {
  const navigate = useNavigate();

  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [userFinalMap, setUserFinalMap] = useState({});
  const [page, setPage] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortHasFinal, setSortHasFinal] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [deletingBatch, setDeletingBatch] = useState<Record<string, boolean>>({});
  const [processingLeaderboard, setProcessingLeaderboard] = useState<Record<string, boolean>>({});
  const [removingLeaderboard, setRemovingLeaderboard] = useState<Record<string, boolean>>({});
  const [allAddedMap, setAllAddedMap] = useState<Record<string, boolean>>({});
  
  // Metadata state
  const [batchMetadata, setBatchMetadata] = useState<Record<string, BatchMetadata>>({});
  const [editingMetadata, setEditingMetadata] = useState<Record<string, boolean>>({});
  const [metadataText, setMetadataText] = useState<Record<string, string>>({});
  const [updatingMetadata, setUpdatingMetadata] = useState<Record<string, boolean>>({});
  const [metadataValidationErrors, setMetadataValidationErrors] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const fetchUsersSubStatus = async () => {
    setUsersLoading(true);
    try {
      // Fetch first page to get total pages
      const firstPage = await userAPI.getAllUsers(1, 25);
      let users = firstPage.users;
      const totalPages = firstPage.total_pages || 1;

      if (totalPages > 1) {
        // Fetch all remaining pages in parallel
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(userAPI.getAllUsers(page, 25));
        }
        const results = await Promise.all(pagePromises);
        for (const res of results) {
          users = users.concat(res.users);
        }
      }

      const finals = await submissionAPI.getUsersWithFinalSubmission();
      const finalsSet = new Set(finals.users_list || []);
      // Store user -> has_final
      const map: { [key: string]: boolean } = {};
      for (const user of users) {
        map[user.username] = finalsSet.has(user.username);
      }
      setUserFinalMap(map);
      setPage(0);
      setSelectedUsers([]);
      setSortHasFinal(false);
    } catch (err) {
      console.error("Error fetching user submission status:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await llmAPI.listBatches();
      setBatches(data.batches || []);
      const ids: string[] = (data.batches || []).map((b: Batch) => b.batch_id);
      if (ids.length > 0) {
        // Fetch arena statuses and metadata in parallel
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const [statusResult, metadataResult] = await Promise.allSettled([
                llmAPI.getBatchArenaStatus(id),
                llmAPI.getBatchMetadata(id)
              ]);
              
              const arenaStatus = statusResult.status === 'fulfilled' ? statusResult.value : null;
              const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
              
              return {
                id,
                arenaAdded: !!arenaStatus?.all_added,
                metadata: metadata
              };
            } catch {
              return {
                id,
                arenaAdded: false,
                metadata: null
              };
            }
          })
        );
        
        const arenaMap: Record<string, boolean> = {};
        const metadataMap: Record<string, BatchMetadata> = {};
        
        for (const result of results) {
          arenaMap[result.id] = result.arenaAdded;
          if (result.metadata) {
            metadataMap[result.id] = result.metadata;
            // Initialize metadata text for editing
            setMetadataText(prev => ({
              ...prev,
              [result.id]: JSON.stringify(result.metadata.batch_metadata, null, 2)
            }));
          }
        }
        
        setAllAddedMap(arenaMap);
        setBatchMetadata(metadataMap);
      } else {
        setAllAddedMap({});
        setBatchMetadata({});
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setBatchesLoading(false);
    }
  };

  const runBatch = async () => {
    if (selectedUsers.length < 6) return;
    
    setSubmittingBatch(true);
    try {
      await llmAPI.batchRun(selectedUsers);
      setSelectedUsers([]);
      fetchBatches();
    } catch (err: any) {
      console.error(err);
      alert("Failed to create batch: " + (err?.response?.data?.detail || err.message || "Unknown error"));
    } finally {
      setSubmittingBatch(false);
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch and all related jobs?")) return;
    
    setDeletingBatch(prev => ({ ...prev, [batchId]: true }));
    try {
      await llmAPI.deleteBatch(batchId);
      fetchBatches(); // Refresh the batches list
    } catch (err: any) {
      console.error("Failed to delete batch:", err);
      alert("Failed to delete batch: " + (err?.response?.data?.detail || err.message || "Unknown error"));
    } finally {
      setDeletingBatch(prev => ({ ...prev, [batchId]: false }));
    }
  };

  const addBatchToLeaderboard = async (batchId: string) => {
    setProcessingLeaderboard(prev => ({ ...prev, [batchId]: true }));
    try {
      await llmAPI.processBatchLeaderboard(batchId);
      alert("Batch scores added to LLM leaderboard.");
      // refresh status for this batch
      try {
        const status = await llmAPI.getBatchArenaStatus(batchId);
        setAllAddedMap(prev => ({ ...prev, [batchId]: !!status.all_added }));
      } catch {}
    } catch (err: any) {
      console.error("Failed to process batch to leaderboard:", err);
      alert("Failed to add to leaderboard: " + (err?.response?.data?.detail || err.message || "Unknown error"));
    } finally {
      setProcessingLeaderboard(prev => ({ ...prev, [batchId]: false }));
    }
  };

  const removeBatchFromLeaderboard = async (batchId: string) => {
    setRemovingLeaderboard(prev => ({ ...prev, [batchId]: true }));
    try {
      await llmAPI.deleteBatchLeaderboard(batchId);
      alert("Batch scores removed from LLM leaderboard.");
      // refresh status for this batch
      try {
        const status = await llmAPI.getBatchArenaStatus(batchId);
        setAllAddedMap(prev => ({ ...prev, [batchId]: !!status.all_added }));
      } catch {}
    } catch (err: any) {
      console.error("Failed to delete batch from leaderboard:", err);
      alert("Failed to remove from leaderboard: " + (err?.response?.data?.detail || err.message || "Unknown error"));
    } finally {
      setRemovingLeaderboard(prev => ({ ...prev, [batchId]: false }));
    }
  };

  const validateJSON = (jsonString: string): { isValid: boolean; error?: string } => {
    if (!jsonString.trim()) {
      return { isValid: true }; // Empty string is valid (will be treated as empty object)
    }
    
    try {
      JSON.parse(jsonString);
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON format' 
      };
    }
  };

  const handleMetadataTextChange = (batchId: string, value: string) => {
    setMetadataText(prev => ({ ...prev, [batchId]: value }));
    
    // Validate JSON in real-time
    const validation = validateJSON(value);
    setMetadataValidationErrors(prev => ({
      ...prev,
      [batchId]: validation.isValid ? '' : validation.error || 'Invalid JSON'
    }));
  };

  const startEditingMetadata = (batchId: string) => {
    setEditingMetadata(prev => ({ ...prev, [batchId]: true }));
    // Initialize with current metadata or empty object
    if (!metadataText[batchId]) {
      const currentMetadata = batchMetadata[batchId];
      const initialText = currentMetadata ? JSON.stringify(currentMetadata.batch_metadata, null, 2) : '{}';
      setMetadataText(prev => ({
        ...prev,
        [batchId]: initialText
      }));
      // Clear any existing validation errors
      setMetadataValidationErrors(prev => ({ ...prev, [batchId]: '' }));
    }
  };

  const cancelEditingMetadata = (batchId: string) => {
    setEditingMetadata(prev => ({ ...prev, [batchId]: false }));
    // Reset to original metadata
    const currentMetadata = batchMetadata[batchId];
    if (currentMetadata) {
      setMetadataText(prev => ({
        ...prev,
        [batchId]: JSON.stringify(currentMetadata.batch_metadata, null, 2)
      }));
    }
    // Clear validation errors
    setMetadataValidationErrors(prev => ({ ...prev, [batchId]: '' }));
  };

  const updateBatchMetadata = async (batchId: string) => {
    // Check if JSON is valid before proceeding
    const validation = validateJSON(metadataText[batchId] || '{}');
    if (!validation.isValid) {
      alert(`Invalid JSON format: ${validation.error}`);
      return;
    }

    setUpdatingMetadata(prev => ({ ...prev, [batchId]: true }));
    try {
      let parsedMetadata;
      try {
        parsedMetadata = JSON.parse(metadataText[batchId] || '{}');
      } catch (err) {
        alert("Invalid JSON format. Please check your syntax.");
        return;
      }

      const result = await llmAPI.updateBatchMetadata(batchId, parsedMetadata);
      
      // Update local state
      setBatchMetadata(prev => ({
        ...prev,
        [batchId]: {
          batch_id: batchId,
          metadata_id: result.metadata_id,
          batch_metadata: parsedMetadata,
          batch_entries_count: result.batch_entries_updated,
          created_at: result.metadata_id
        }
      }));
      
      setEditingMetadata(prev => ({ ...prev, [batchId]: false }));
      alert(`Metadata ${result.action} successfully for batch ${batchId}`);
    } catch (err: any) {
      console.error("Failed to update batch metadata:", err);
      alert("Failed to update metadata: " + (err?.response?.data?.detail || err.message || "Unknown error"));
    } finally {
      setUpdatingMetadata(prev => ({ ...prev, [batchId]: false }));
    }
  };

  useEffect(() => {
    fetchUsersSubStatus();
  }, []);

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 15000);
    return () => clearInterval(interval);
  }, []);

  /* ---- pagination helpers ---- */
  const baseEntries = Object.entries(userFinalMap) as [string, boolean][];

  const filteredEntries = baseEntries.filter(([username]) =>
    username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const entries = sortHasFinal
    ? [...filteredEntries].sort((a, b) => (a[1] === b[1] ? 0 : a[1] ? -1 : 1))
    : filteredEntries;

  const pageCount = Math.ceil(entries.length / PAGE_SIZE);

  const pageRows = entries.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  // Logic for the X button
  const removeUser = (username: string) =>
    setSelectedUsers(prev => prev.filter(u => u !== username));

  const next = () => setPage((p) => Math.min(p + 1, pageCount - 1));
  const prev = () => setPage((p) => Math.max(p - 1, 0));

  const toggle = (username: string, hasFinal: boolean) => {
    if (!hasFinal) return;
    setSelectedUsers(prev => {
      if (prev.includes(username)) return prev.filter(u => u !== username);
      return [...prev, username];
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FINISHED": return "text-[#FFFFFF]";
      case "RUNNING": return "text-yellow-400";
      case "FAILED": return "text-red-400";
      case "PENDING": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 text-sm px-4 py-2 border border-[#FFFFFF] text-[#FFFFFF] rounded hover:bg-[#FFFFFF] hover:text-black transition duration-200 flex items-center gap-2"
        >
          ← Back to Admin Dashboard
        </button>
        
        <div className="border-b border-[#444] pb-6">
          <h1 className="text-4xl font-bold mb-3 font-glitch text-[#559CF8]">
            <Zap className="inline w-8 h-8 mr-3" />
            LLM BATCH CONTROL CENTER
          </h1>
          <p className="text-lg text-gray-400">
            Create and manage LLM batch jobs for user combinations
          </p>
        </div>
      </div>

      {/* Protocol Notice */}
      <div className="bg-black bg-opacity-30 border-l-4 border-[#559CF8] pl-6 py-4 my-6 rounded-md">
        <p className="text-[#FFFFFF] font-bold mb-2">⚡ BATCH PROTOCOL ⚡</p>
        <p className="text-gray-300 text-sm mb-2">
          Welcome to the <span className="text-[#559CF8] font-semibold">LLM Batch Processing Arena</span>! 
          Select at least 6 users with final submissions to generate all possible 6-user combinations for batch processing.
        </p>
        <p className="text-gray-400 text-xs">
          <span className="text-yellow-400">⚠️ SYSTEM REQUIREMENT:</span> Only users with final submissions can participate in batch jobs.
        </p>
      </div>

      {/* Users Selection Section */}
      <div className="bg-black bg-opacity-30 border-l-4 border-[#FFFFFF] p-6 my-8 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-[#FFFFFF]" />
            USER SELECTION MATRIX
          </h2>
          <button 
            onClick={fetchUsersSubStatus}
            className="text-sm border border-[#FFFFFF] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#FFFFFF] hover:text-black transition duration-200"
          >
            SYNC DATA
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - User List */}
          <div className="xl:col-span-2">
            <h3 className="text-[#559CF8] text-lg mb-4 font-semibold">REGISTERED PARTICIPANTS</h3>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFFFFF]"></div>
                  <p className="text-gray-400 mt-2">Loading participants...</p>
                </div>
              ) : (
                <div className="text-sm text-white">
                  {/* Search */}
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-[#FFFFFF] focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
              
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-4 font-semibold py-3 border-b-2 border-[#FFFFFF] text-[#FFFFFF]">
                    <div>SELECT</div>
                    <div>USERNAME</div>
                    <div className="flex items-center space-x-2">
                      <span>FINAL SUB</span>
                      <button onClick={() => setSortHasFinal(v => !v)}>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            sortHasFinal ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                    <div>STATUS</div>
                  </div>
              
                  {/* Data rows */}
                  {entries.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No participants found.</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {pageRows.map(([username, hasFinal]) => (
                        <div
                          key={username}
                          className={`grid grid-cols-4 gap-4 py-3 items-center border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                            selectedUsers.includes(username) ? 'bg-gray-800 border-[#FFFFFF]' : ''
                          }`}
                        >
                          <div>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(username)}
                              disabled={!hasFinal}
                              onChange={() => toggle(username, hasFinal)}
                              className={`w-4 h-4 ${!hasFinal ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                            />
                          </div>
                          <div className="font-mono">{username}</div>
                          <div className={hasFinal ? "text-[#FFFFFF]" : "text-red-400"}>
                            {hasFinal ? "✓ YES" : "✗ NO"}
                          </div>
                          <div className={selectedUsers.includes(username) ? "text-[#FFFFFF] font-bold" : "text-gray-400"}>
                            {selectedUsers.includes(username) ? "SELECTED" : "STANDBY"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {pageCount > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-700">
                      <button
                        onClick={prev}
                        disabled={page === 0}
                        className="px-4 py-2 border border-[#FFFFFF] text-[#FFFFFF] rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFFFFF] hover:text-black transition"
                      >
                        PREV
                      </button>
                      <span className="text-[#559CF8] font-mono">
                        PAGE {page + 1} OF {pageCount}
                      </span>
                      <button
                        onClick={next}
                        disabled={page === pageCount - 1}
                        className="px-4 py-2 border border-[#FFFFFF] text-[#FFFFFF] rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFFFFF] hover:text-black transition"
                      >
                        NEXT
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Selected Users & Controls */}
          <div className="xl:col-span-1">
            <h3 className="text-[#559CF8] text-lg mb-4 font-semibold">BATCH ROSTER</h3>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-[#FFFFFF] mb-2">{selectedUsers.length}</div>
                <div className="text-sm text-gray-400">PARTICIPANTS SELECTED</div>
                {selectedUsers.length >= 6 && (
                  <div className="text-xs text-[#559CF8] mt-1">
                    Will generate {Math.floor(selectedUsers.length * (selectedUsers.length - 1) * (selectedUsers.length - 2) * (selectedUsers.length - 3) * (selectedUsers.length - 4) * (selectedUsers.length - 5) / (6 * 5 * 4 * 3 * 2 * 1))} combinations
                  </div>
                )}
              </div>

              {selectedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No participants selected</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {selectedUsers.map((username, index) => (
                    <div key={username} className="flex items-center justify-between bg-gray-800 p-3 rounded border-l-2 border-[#FFFFFF]">
                      <div className="flex items-center gap-3">
                        <span className="text-[#FFFFFF] font-bold text-xs">#{index + 1}</span>
                        <span className="font-mono text-sm">{username}</span>
                      </div>
                      <button
                        onClick={() => removeUser(username)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="w-full text-sm text-red-400 hover:text-red-300 transition mt-4 py-2"
                  >
                    CLEAR ALL
                  </button>
                </div>
              )}

              <button
                disabled={selectedUsers.length < 6 || submittingBatch}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  selectedUsers.length >= 6 && !submittingBatch
                    ? "bg-[#FFFFFF] text-black hover:bg-[#2bff00] hover:shadow-lg hover:shadow-[#FFFFFF]/50"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
                onClick={runBatch}
              >
                {submittingBatch ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    CREATING BATCH...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {selectedUsers.length >= 6 ? "CREATE BATCH JOBS" : "SELECT AT LEAST 6 USERS"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Status Section */}
      <div className="bg-black bg-opacity-30 border-l-4 border-[#559CF8] p-6 my-8 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#559CF8]" />
            ACTIVE BATCH JOBS
          </h2>
          <button 
            onClick={() => {
              setBatchesLoading(true);
              fetchBatches();
            }}
            className="text-sm border border-[#559CF8] text-[#559CF8] px-4 py-2 rounded hover:bg-[#559CF8] hover:text-black transition duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            REFRESH
          </button>
        </div>

        {batchesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#559CF8]"></div>
            <p className="text-gray-400 mt-2">Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No batch jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <div key={batch.batch_id} className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">
                      Batch ID: {batch.batch_id}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Created: {batch.created_at ? formatDate(batch.created_at) : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addBatchToLeaderboard(batch.batch_id)}
                      disabled={!!processingLeaderboard[batch.batch_id] || !!allAddedMap[batch.batch_id]}
                      className="px-2 py-1 text-xs border border-[#559CF8] text-[#559CF8] rounded hover:bg-[#559CF8] hover:text-black transition disabled:opacity-50"
                    >
                      {processingLeaderboard[batch.batch_id] ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Processing...
                        </div>
                      ) : (
                        "Add to Leaderboard"
                      )}
                    </button>
                    <button
                      onClick={() => removeBatchFromLeaderboard(batch.batch_id)}
                      disabled={!!removingLeaderboard[batch.batch_id] || !allAddedMap[batch.batch_id]}
                      className="px-2 py-1 text-xs border border-red-400 text-red-400 rounded hover:bg-red-400 hover:text-black transition disabled:opacity-50"
                    >
                      {removingLeaderboard[batch.batch_id] ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Removing...
                        </div>
                      ) : (
                        "Remove from Leaderboard"
                      )}
                    </button>
                    <button
                      onClick={() => deleteBatch(batch.batch_id)}
                      disabled={deletingBatch[batch.batch_id] || !!allAddedMap[batch.batch_id]}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {deletingBatch[batch.batch_id] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Batch
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{batch.total_jobs}</div>
                    <div className="text-xs text-gray-400">Total Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{batch.job_statuses.PENDING || 0}</div>
                    <div className="text-xs text-gray-400">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{batch.job_statuses.RUNNING || 0}</div>
                    <div className="text-xs text-gray-400">Running</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFFFFF]">{batch.job_statuses.FINISHED || 0}</div>
                    <div className="text-xs text-gray-400">Finished</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{batch.job_statuses.FAILED || 0}</div>
                    <div className="text-xs text-gray-400">Failed</div>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="border-t border-gray-700 pt-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#559CF8] flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Batch Metadata
                    </h4>
                    {!editingMetadata[batch.batch_id] && (
                      <button
                        onClick={() => startEditingMetadata(batch.batch_id)}
                        className="px-3 py-1 text-xs border border-[#559CF8] text-[#559CF8] rounded hover:bg-[#559CF8] hover:text-black transition flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        {batchMetadata[batch.batch_id] ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>
                  
                  {editingMetadata[batch.batch_id] ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={metadataText[batch.batch_id] || '{}'}
                          onChange={(e) => handleMetadataTextChange(batch.batch_id, e.target.value)}
                          placeholder="Enter metadata as JSON..."
                          className={`w-full h-32 px-3 py-2 bg-gray-800 border rounded text-white text-xs font-mono focus:outline-none resize-none ${
                            metadataValidationErrors[batch.batch_id] 
                              ? 'border-red-500 focus:border-red-400' 
                              : 'border-gray-600 focus:border-[#559CF8]'
                          }`}
                        />
                        {metadataValidationErrors[batch.batch_id] && (
                          <div className="absolute -bottom-6 left-0 text-xs text-red-400 flex items-center gap-1">
                            <span>⚠️</span>
                            {metadataValidationErrors[batch.batch_id]}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBatchMetadata(batch.batch_id)}
                          disabled={updatingMetadata[batch.batch_id] || !!metadataValidationErrors[batch.batch_id]}
                          className={`px-3 py-1 text-xs rounded transition flex items-center gap-1 ${
                            updatingMetadata[batch.batch_id] || metadataValidationErrors[batch.batch_id]
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-[#559CF8] text-black hover:bg-[#4a8ae8]'
                          }`}
                        >
                          {updatingMetadata[batch.batch_id] ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => cancelEditingMetadata(batch.batch_id)}
                          className="px-3 py-1 text-xs border border-gray-500 text-gray-300 rounded hover:bg-gray-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      {batchMetadata[batch.batch_id] ? (
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(batchMetadata[batch.batch_id].batch_metadata, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No metadata available</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-[#559CF8] mb-2">Job Details:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {batch.jobs.map((job) => (
                      <div key={job.job_id} className="flex items-center justify-between text-xs bg-gray-800 p-2 rounded">
                        <span className="font-mono">{job.job_id}</span>
                        <span className={`font-semibold ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className="text-gray-400">
                          Users: {job.users_to_run.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMBatchPage;