import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { gameAPI } from "../api";

const FINAL_DEADLINE = new Date("2025-05-01T23:59:59Z"); // <-- Change this to your actual deadline

const Dashboard: React.FC = () => {
    // job
    const [jobs, setJobs] = useState<any[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);

    const fetchJobs = async () => {
    try {
    const data = await gameAPI.get_jobs(); // ✅ use your API
    setJobs(data);
    } catch (err) {
    console.error("Failed to fetch jobs:", err);
    } finally {
    setJobsLoading(false);
    }
    };

    useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 15000); // Refresh every 15s
    return () => clearInterval(interval);
    }, []);



  const { user } = useAuth();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [playerFile, setPlayerFile] = useState<File | null>(null);
  const [requirementsFile, setRequirementsFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = FINAL_DEADLINE.getTime() - now;

      if (diff <= 0) {
        setTimeLeft("Submission closed.");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    for (const file of files) {
      if (file.name === "player.py") {
        setPlayerFile(file);
      } else if (file.name === "requirements.txt") {
        setRequirementsFile(file);
      }
    }
  };

  const submitBot = async () => {
    if (!playerFile || !requirementsFile) {
      setError("Both player.py and requirements.txt must be provided.");
      return;
    }

    const formData = new FormData();
    formData.append("python_file", playerFile);
    formData.append("packages_file", requirementsFile);

    try {
      setStatus("submitting");
      await gameAPI.submitSimulationJob(formData);
      setStatus("success");
      setPlayerFile(null);
      setRequirementsFile(null);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Submission failed. Check your files and try again.");
    }
  };

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-3xl mx-auto">
      {/* Top: User & Countdown */}
      <div className="mb-10 border-b border-[#444] pb-6">
        <h1 className="text-3xl font-bold mb-2 font-glitch">
          Welcome, <span className="text-[#ff00cc]">{user?.username}</span>
        </h1>
        <p className="text-md text-gray-400">
          Time left until final submission:{" "}
          <span className="text-[#39ff14] font-mono">{timeLeft}</span>
        </p>
      </div>

      {/* Drag + Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#ff00cc] bg-black/30 p-6 rounded-lg text-center cursor-pointer hover:bg-white/5 transition"
      >
        <p className="text-lg mb-2">Drag & drop <code>player.py</code> and <code>requirements.txt</code></p>
        <p className="text-sm text-gray-400">Or select files manually below</p>
        <input
          type="file"
          accept=".py,.txt"
          multiple
          onChange={handleFileInput}
          className="mt-4 text-sm text-white file:hidden"
        />
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm">
          <span className="font-mono text-green-400">player.py</span>: {playerFile?.name || "Not selected"}
        </p>
        <p className="text-sm">
          <span className="font-mono text-purple-400">requirements.txt</span>: {requirementsFile?.name || "Not selected"}
        </p>
      </div>

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      {status === "success" && (
        <p className="text-green-400 mt-2 text-sm">Submitted successfully! ✅</p>
      )}

      <button
        onClick={submitBot}
        disabled={status === "submitting"}
        className={`mt-6 w-full py-2 cursor-pointer border border-[#ff00cc] text-[#ff00cc] hover:bg-[#ff00cc] hover:text-black transition-all ${
          status === "submitting" ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {status === "submitting" ? "Submitting..." : "Submit Bot"}
          </button>
          

          {/* --- My Jobs --- */}
<div className="mt-12">
  <h2 className="text-xl font-bold mb-4 border-b border-[#444] pb-2">My Jobs</h2>

  {jobsLoading ? (
    <p className="text-gray-400">Loading jobs...</p>
  ) : jobs.length === 0 ? (
    <p className="text-gray-500">No jobs submitted yet.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="text-left text-[#ff00cc] border-b border-[#333]">
            <th className="p-2">Job ID</th>
            <th className="p-2">Status</th>
            <th className="p-2">Result</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.job_id} className="border-b border-[#222]">
              <td className="p-2 font-mono text-xs text-[#39ff14] break-all">{job.job_id}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    job.job_status === "Completed"
                      ? "text-green-400"
                      : job.job_status === "Pending"
                      ? "text-yellow-400"
                      : job.job_status === "Failed"
                      ? "text-red-500"
                      : "text-white"
                  }`}
                >
                  {job.job_status}
                </span>
              </td>
              <td className="p-2 text-white">{job.result_data ?? "-"}</td>
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

export default Dashboard;
