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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [users, jobs, submissions] = await Promise.all([
                    adminAPI.getUserCount(),
                    adminAPI.getJobCount(),
                    adminAPI.getSubmissionCount(),
                ]);
                setUserCount(users);
                setJobCount(jobs);
                setSubmissionCount(submissions);
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

                <div className="flex flex-col space-y-4">
                    <button
                        onClick={() => navigate('/simulation')}
                        className="w-fit px-6 py-2 bg-[#39ff14] text-black rounded hover:bg-[#2ecc71] transition-colors"
                    >
                        Go to Simulation Page
                    </button>
                    <button
                        onClick={() => navigate('/container-manager')}
                        className="w-fit px-6 py-2 bg-[#39ff14] text-black rounded hover:bg-[#2ecc71] transition-colors"
                    >
                        Go to Container Manager
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Admin;
