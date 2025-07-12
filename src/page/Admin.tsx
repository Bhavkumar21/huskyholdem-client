import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';

const Admin: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userCount, setUserCount] = useState<number | null>(null);
    const [jobCount, setJobCount] = useState<number | null>(null);
    const [submissionCount, setSubmissionCount] = useState<number | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersCount, jobsCount, submissionsCount, userList, jobList] = await Promise.all([
                    adminAPI.getUserCount(),
                    adminAPI.getJobCount(),
                    adminAPI.getSubmissionCount(),
                    adminAPI.listUsers(),
                    adminAPI.listJobs()
                ]);
                setUserCount(usersCount);
                setJobCount(jobsCount);
                setSubmissionCount(submissionsCount);
                setUsers(userList);
                setJobs(jobList);
            } catch (err) {
                console.error('Failed to load admin stats', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">Welcome back, {user?.username}!</p>
                </div>

                <button
                    onClick={() => navigate('/simulation')}
                    className="px-6 py-2 bg-[#39ff14] text-black rounded hover:bg-[#2ecc71] transition-colors mb-8"
                >
                    Go to Simulation Page
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900 border border-[#ff00cc] p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-[#ff00cc] mb-2">Users</h2>
                        <p className="text-3xl font-mono">{userCount !== null ? userCount : '...'}</p>
                    </div>

                    <div className="bg-gray-900 border border-[#39ff14] p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-[#39ff14] mb-2">Jobs</h2>
                        <p className="text-3xl font-mono">{jobCount !== null ? jobCount : '...'}</p>
                    </div>

                    <div className="bg-gray-900 border border-[#00ffff] p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-[#00ffff] mb-2">Submissions</h2>
                        <p className="text-3xl font-mono">{submissionCount !== null ? submissionCount : '...'}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">All Users</h2>
                    <ul className="space-y-1 text-sm">
                        {users.map(u => (
                            <li key={u.username} className="bg-gray-800 p-2 rounded">{u.username} - {u.email}</li>
                        ))}
                    </ul>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">All Jobs</h2>
                    <ul className="space-y-1 text-sm">
                        {jobs.map(job => (
                            <li key={job.job_id} className="bg-gray-800 p-2 rounded">
                                {job.job_id} - {job.job_status} - {job.username || 'N/A'}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Admin;