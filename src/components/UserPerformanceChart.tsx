import React, { useEffect, useState } from 'react';
import { liveAPI } from '../api';
import { TrendingUp, TrendingDown, Users, BarChart3, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface UserPerformanceChartProps {
  jobId: string;
}

interface UserPerformanceData {
  [username: string]: number[];
}

interface ChartDataPoint {
  iteration: number;
  [username: string]: number;
}

const UserPerformanceChart: React.FC<UserPerformanceChartProps> = ({ jobId }) => {
  const [performanceData, setPerformanceData] = useState<UserPerformanceData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userColors = [
    '#39ff14', // Bright green
    '#ff00cc', // Magenta
    '#00ffff', // Cyan
    '#ffcc00', // Yellow
    '#ff6600', // Orange
    '#cc00ff', // Purple
    '#00ff66', // Light green
    '#ff0066', // Pink
  ];

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await liveAPI.get_user_performance(jobId);
      setPerformanceData(data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchPerformanceData();
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39ff14] mb-4"></div>
            <p className="text-gray-400">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-300 text-center">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const users = Object.keys(performanceData);
  if (users.length === 0) {
    return (
      <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No performance data available</p>
          <p className="text-gray-500 text-sm">Performance data will appear here once games are completed</p>
        </div>
      </div>
    );
  }

  // Transform data for Recharts
  const maxIterations = Math.max(...users.map(user => performanceData[user].length));
  const chartData: ChartDataPoint[] = [];
  
  for (let i = 0; i < maxIterations; i++) {
    const dataPoint: ChartDataPoint = { iteration: i + 1 };
    users.forEach(user => {
      if (i < performanceData[user].length) {
        dataPoint[user] = performanceData[user][i];
      }
    });
    chartData.push(dataPoint);
  }

  // Calculate final performance stats
  const userStats = users.map(user => {
    const values = performanceData[user];
    const finalValue = values[values.length - 1];
    const initialValue = values[0];
    const change = finalValue - initialValue;
    const changePercent = initialValue !== 0 ? ((finalValue / 10000) * 100) : 0;
    
    return {
      username: user,
      finalValue,
      initialValue,
      change,
      changePercent,
      color: userColors[users.indexOf(user) % userColors.length]
    };
  }).sort((a, b) => b.finalValue - a.finalValue);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-[#39ff14] rounded-lg p-3 shadow-lg">
          <p className="text-[#39ff14] font-mono text-sm font-bold mb-2">
            Iteration {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-white font-mono text-sm">
              <span style={{ color: entry.color }}>●</span> {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom dot component for better visibility
  const CustomDot = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={fill}
        stroke="#000"
        strokeWidth={1}
        className="drop-shadow-sm"
      />
    );
  };

  return (
    <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-[#39ff14]" />
          <h3 className="text-xl font-bold text-white font-mono">USER PERFORMANCE MATRIX</h3>
        </div>
        <button
          onClick={fetchPerformanceData}
          className="flex items-center gap-2 px-3 py-1 text-sm border border-[#39ff14] text-[#39ff14] rounded hover:bg-[#39ff14] hover:text-black transition"
        >
          <RefreshCw className="w-4 h-4" />
          REFRESH
        </button>
      </div>

      {/* Chart */}
      <div className="mb-6 h-96 bg-gray-900/50 border border-gray-700 rounded p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid 
              strokeDasharray="2 2" 
              stroke="#444" 
              opacity={0.5}
            />
            <XAxis 
              dataKey="iteration" 
              stroke="#39ff14"
              fontSize={12}
              fontFamily="monospace"
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#666', strokeWidth: 2 }}
              tickLine={{ stroke: '#666' }}
            />
            <YAxis 
              stroke="#39ff14"
              fontSize={12}
              fontFamily="monospace"
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#666', strokeWidth: 2 }}
              tickLine={{ stroke: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {users.map((user, index) => (
              <Line
                key={user}
                type="monotone"
                dataKey={user}
                stroke={userColors[index % userColors.length]}
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 5, 
                  stroke: '#000', 
                  strokeWidth: 1,
                  fill: userColors[index % userColors.length]
                }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legend */}
        <div>
          <h4 className="text-lg font-bold text-[#ff00cc] mb-3 font-mono">PLAYER LEGEND</h4>
          <div className="space-y-2">
            {users.map((user, index) => {
              const color = userColors[index % userColors.length];
              return (
                <div key={user} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded border border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-sm text-white">{user}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Stats */}
        <div>
          <h4 className="text-lg font-bold text-[#ff00cc] mb-3 font-mono">FINAL RANKINGS</h4>
          <div className="space-y-2">
            {userStats.map((stat, index) => (
              <div key={stat.username} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-[#39ff14] font-bold text-sm">#{index + 1}</span>
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="font-mono text-sm text-white">{stat.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">{stat.finalValue}</span>
                  <div className="flex items-center gap-1">
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span 
                      className={`text-xs font-mono ${
                        stat.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stat.changePercent >= 0 ? '+' : ''}{Math.round(stat.changePercent)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
          <div className="flex items-center gap-4">
            <span><Users className="w-4 h-4 inline mr-1" />{users.length} PLAYERS</span>
            <span>{maxIterations} ROUNDS</span>
          </div>
          <span>JOB_ID: {jobId}</span>
        </div>
      </div>
    </div>
  );
};

export default UserPerformanceChart; 