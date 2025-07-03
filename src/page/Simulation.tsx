import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { submissionAPI, userAPI, gameAPI } from "../api";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;  

const SimulationPage = () => {
  const navigate = useNavigate();  

  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [userFinalMap, setUserFinalMap] = useState({});
  const [page, setPage] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortHasFinal, setSortHasFinal] = useState(false);

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const fetchUsersSubStatus = async () => {
    setUsersLoading(true)
    try {
      // Get all users and list of users with final sub
      const users = await userAPI.getAllUsers();
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


  const fetchJobs = async () => {
    try {
      const data = await gameAPI.get_jobs();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setJobsLoading(false); 
    }
  };

  const runSimulation = async () => {
    try {
      await gameAPI.submitSimulationUserJob(selectedUsers);
      setSelectedUsers([]);
      fetchJobs();
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsersSubStatus();
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 15000);
    return () => clearInterval(interval);
  }, []);


  /* ---- pagination helpers ---- */
  const baseEntries = Object.entries(userFinalMap) as [string, boolean][];

  const entries = sortHasFinal
    ? [...baseEntries].sort((a, b) =>
        a[1] === b[1] ? 0 : a[1] ? -1 : 1
      )
    : baseEntries;

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
    /**
     * Checkbox logic
     * - If there is no final sub disable toggle
     * - Only allow max 6 checkbox checked at a time
     */
    if (!hasFinal) return;
    setSelectedUsers(prev => {
      if (prev.includes(username)) return prev.filter(u => u !== username);
      if (prev.length >= 6) return prev;
      return [...prev, username];
    });
  };




  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/admin")}
        className="mb-4 text-sm px-3 py-1 border border-[#39ff14] text-[#39ff14] rounded hover:bg-[#39ff14] hover:text-black transition"
      >
        ← Back to Admin Dashboard
      </button>

      {/* Users List -------------------------------------------------------------------------------------- */}
      <div className="bg-black bg-opacity-30 border-l-4 border-transparent p-6 my-6 rounded-md">
        {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">All Users</h2>
            <button onClick={fetchUsersSubStatus}
            className="text-sm border border-[#39ff14] text-[#39ff14] px-3 py-1 rounded 
            hover:bg-[#39ff14] hover:text-black transition">
              Refresh
            </button>
          </div>

        {/* Two-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column */}
          <div className="w-full lg:w-[65%]">
            <h3 className="text-white text-lg mb-2">Submissions</h3>
            <div className="bg-gray-800 p-4 rounded text-white">
              {usersLoading ? (
                <p className="text-gray-400">Loading users…</p>
              ) : entries.length === 0 ? (
                <p className="text-gray-500">No users found.</p>
              ) : (
                <div className="text-sm text-white flex flex-col min-h-[400px] justify-between">
                  <div>
                    {/* Header grid */}
                    <div className="grid grid-cols-3 gap-4 font-semibold py-1 border-b border-gray-700">
                      <div>Select</div>
                      <div>Username</div>
                      <div className="flex items-center space-x-1">
                        <span>Final Submission</span>
                        <button onClick={() => setSortHasFinal(v => !v)}>
                          <ChevronDown
                            className={
                              sortHasFinal
                                ? "w-4 h-4 rotate-180 transition"
                                : "w-4 h-4 transition"
                            }
                          />
                        </button>
                      </div>
                    </div>

                    {/* Data rows */}
                    {pageRows.map(([username, hasFinal]) => (
                      <div
                        key={username}
                        className="grid grid-cols-3 gap-4 py-1 items-center border-t border-gray-700"
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(username)}
                            disabled={!hasFinal}
                            onChange={() => toggle(username, hasFinal)}
                            className={!hasFinal ? "cursor-not-allowed" : ""}
                          />
                        </div>
                        <div>{username}</div>
                        <div>{hasFinal ? "Yes" : "No"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pager */}
                  {pageCount > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={prev}
                        disabled={page === 0}
                        className="px-3 py-1 border rounded disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span>
                        Page {page + 1} of {pageCount}
                      </span>
                      <button
                        onClick={next}
                        disabled={page === pageCount - 1}
                        className="px-3 py-1 border rounded disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>




          {/* Right Column */}
          <div className="w-full lg:w-[35%]">
            <h3 className="text-white text-lg mb-2">Details</h3>
            <div className="bg-gray-800 p-4 rounded space-y-2">
              {/* selected-user list */}
              <h4 className="font-semibold">
                Selected users ({selectedUsers.length}/6)
              </h4>

              {selectedUsers.length === 0 ? (
                <p className="text-gray-400">None selected</p>
              ) : (
                <>
                  <ul className="space-y-1">
                    {selectedUsers.map(u => (
                      <li key={u} className="flex items-center justify-between">
                        <span>{u}</span>
                        <button
                          onClick={() => removeUser(u)}
                          className="hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-sm text-red-300 hover:text-red-500 transition mt-2"
                  >
                    Clear All
                  </button>
                </>
              )}
              {/* Only allow click button when 6 users selected */}
              <button
                disabled={selectedUsers.length !== 6}
                className="w-full mt-4 px-3 py-2 rounded bg-[#39ff14] text-black disabled:opacity-40 hover:bg-black 
                hover:text-[#39ff14] disabled:opacity-40 transition-colors duration-200"
                onClick={runSimulation}
              >
                Run Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
      

      {/* Jobs Status List -------------------------------------------------------------------------------------- */}
      <div className="bg-black bg-opacity-30 border-l-4 border-transparent p-6 my-6 rounded-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Job Status</h2>
            <button onClick={() => {
              setJobsLoading(true);
              fetchJobs();
            }}
            className="text-sm border border-[#39ff14] text-[#39ff14] px-3 py-1 rounded hover:bg-[#39ff14] hover:text-black transition">
              Refresh
            </button>
          </div>


          {jobsLoading ? (
            <p className="text-gray-400">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-gray-500">No jobs submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed border-collapse">
                <thead>
                  <tr className="text-left text-[#ff00cc] border-b border-[#333]">
                    <th className="px-3 py-2 w-[25%]">Job ID</th>
                    <th className="px-3 py-2 w-[13%]">Status</th>
                    <th className="px-3 py-2 w-[42%]">Result</th>
                    <th className="px-3 py-2 w-[20%]">Message</th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map(j => (
                    <tr key={j.job_id} className="border-b border-[#222]">
                      <td className="px-3 py-2 font-mono text-xs break-all w-2/5">
                        {j.job_id}
                      </td>

                      <td className="px-3 py-2 w-1/6">
                        <span
                          className={
                            j.job_status === "Finished"
                              ? "text-green-400"
                              : j.job_status === "Pending"
                              ? "text-yellow-400"
                              : j.job_status === "Failed"
                              ? "text-red-500"
                              : "text-white"
                          }
                        >
                          {j.job_status}
                        </span>
                      </td>

                      <td className="px-3 py-2 break-words text-xs whitespace-pre-wrap w-1/4">
                        {j.result_data ? JSON.stringify(j.result_data) : "-"}
                      </td>

                      <td className="px-3 py-2 break-words text-xs whitespace-pre-wrap w-1/4">
                        {j.message ? JSON.stringify(j.message) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      </div>
    </div>
  );
};

export default SimulationPage;