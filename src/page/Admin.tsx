import React from 'react';
import { useAuth } from '../context/AuthContext';

const Admin: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.username}!</p>
        </div>
      </div>
    </div>
  );
};

export default Admin; 