import React from 'react';
import { Shield, CheckCircle, ExternalLink, Users } from 'lucide-react';

interface User {
  username: string;
  email: string;
  admin: boolean;
  is_verified: boolean;
}

interface UserListProps {
  users: User[];
  currentUser?: { username: string } | null;
  onToggleAdmin: (username: string) => void;
  onUserClick: (username: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  currentUser,
  onToggleAdmin,
  onUserClick
}) => {
  return (
    <div className="bg-black bg-opacity-30 border-l-4 border-[#00ffff] p-6 my-8 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-6 h-6 text-[#00ffff]" />
          USER MANAGEMENT MATRIX
        </h2>
        <div className="text-sm text-gray-400">
          Total Users: <span className="text-[#00ffff] font-mono">{users.length}</span>
        </div>
      </div>

      <div className="h-96 overflow-y-auto">
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.username}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-[#00ffff] transition-colors duration-200 flex items-center justify-between"
            >
              {/* Left side - User Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-[#00ffff] font-bold text-lg">{u.username}</h3>
                  <button
                    onClick={() => onUserClick(u.username)}
                    className="text-gray-400 hover:text-[#00ffff] transition-colors"
                    title="View Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-gray-400 text-sm">
                  {u.email}
                </div>
                
                {/* Status Tags */}
                <div className="flex gap-2">
                  {u.admin && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-opacity-20 border border-[#ff00cc] text-[#ff00cc] text-xs rounded font-bold">
                      <Shield className="w-3 h-3" />
                      ADMIN
                    </span>
                  )}
                  {u.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1  bg-opacity-20 border border-[#39ff14] text-[#39ff14] text-xs rounded font-bold">
                      <CheckCircle className="w-3 h-3" />
                      VERIFIED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-opacity-20 border border-red-500 text-red-400 text-xs rounded font-bold">
                      UNVERIFIED
                    </span>
                  )}
                </div>
              </div>

              {/* Right side - Actions */}
              {u.username !== currentUser?.username && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleAdmin(u.username)}
                    className={`px-4 py-2 text-xs rounded border transition-colors duration-200 font-semibold ${
                      u.admin
                        ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-black'
                        : 'border-[#ffcc00] text-[#ffcc00] hover:bg-[#ffcc00] hover:text-black'
                    }`}
                  >
                    {u.admin ? 'REVOKE ADMIN' : 'GRANT ADMIN'}
                  </button>
                  <button
                    onClick={() => onUserClick(u.username)}
                    className="px-4 py-2 text-xs rounded border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors duration-200 font-semibold"
                  >
                    VIEW
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserList; 