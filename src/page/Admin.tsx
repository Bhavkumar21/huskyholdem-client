import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          className="px-6 py-2 bg-[#39ff14] text-black rounded hover:bg-[#2ecc71] transition-colors"
        >
          Go to Simulation Page
        </button>
      </div>
    </div>
  );
};

export default Admin; 