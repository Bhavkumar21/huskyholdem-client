import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../api";
import { Search, User, Github, MessageCircle, Clock } from "lucide-react";

interface UserSearchResult {
  username: string;
  name?: string | null;
  github?: string | null;
  discord_username?: string | null;
  about?: string | null;
}

const DirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const results = await userAPI.searchUsers(query);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-[#444] pb-6">
        <h1 className="text-3xl font-bold mb-2 font-glitch">
          User Directory —{" "}
          <span className="text-[#ff00cc]">Find Participants</span>
        </h1>
        <p className="text-gray-400">
          Search for users by name or username to view their profiles
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white/5 backdrop-blur-sm border border-[#00ffff] rounded-lg p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent transition-all duration-200"
          />
        </div>
        {loading && (
          <div className="mt-4 text-center text-gray-400">
            <div className="inline-flex items-center">
              <Clock className="animate-spin h-4 w-4 mr-2" />
              Searching...
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white/5 backdrop-blur-sm border border-[#39ff14] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#39ff14] mb-20 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Search Results
            {searchResults.length > 0 && (
              <span className="ml-2 text-sm bg-[#39ff14] text-black px-2 py-1 rounded">
                {searchResults.length} found
              </span>
            )}
          </h2>

          {searchResults.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No users found</p>
              <p className="text-sm">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  onClick={() => handleUserClick(user.username)}
                  className="bg-white/5 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-[#ff00cc] hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#ff00cc] transition-colors">
                          {user.name || user.username}
                        </h3>
                        {user.name && (
                          <span className="ml-2 text-sm text-gray-400">
                            @{user.username}
                          </span>
                        )}
                      </div>
                      
                      {user.about && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {user.about}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        {user.github && (
                          <div className="flex items-center">
                            <Github className="h-4 w-4 mr-1" />
                            <span>{user.github}</span>
                          </div>
                        )}
                        {user.discord_username && (
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span>{user.discord_username}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-[#ff00cc] text-sm font-medium">
                        View Profile →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!hasSearched && !loading && (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            How to Search
          </h2>
          <div className="space-y-2 text-gray-400">
            <p>• Type any part of a username or name to search</p>
            <p>• Click on any result to view their profile</p>
            <p>• Search is case-insensitive and matches partial text</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage; 