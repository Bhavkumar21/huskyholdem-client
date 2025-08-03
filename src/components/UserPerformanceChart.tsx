import React, { useEffect, useState, useCallback } from 'react';
import { liveAPI } from '../api';
import { TrendingUp, TrendingDown, Users, BarChart3, RefreshCw, Star, Zap } from 'lucide-react';
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

interface TooltipPayload {
  color: string;
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}



interface IterationStats {
  iteration: number;
  mean: number;
  variance: number;
  standardDeviation: number;
  range: number;
  scores: number[];
}

interface InterestingGame {
  iteration: number;
  reasons: Array<{
    reason: string;
    significance: number;
    description: string;
  }>;
  totalSignificance: number;
}

const UserPerformanceChart: React.FC<UserPerformanceChartProps> = ({ jobId }) => {
  const [performanceData, setPerformanceData] = useState<UserPerformanceData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sampleInterval, setSampleInterval] = useState(1);
  const [interestingGames, setInterestingGames] = useState<InterestingGame[]>([]);

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

  const getAutoSampleInterval = (dataLength: number): number => {
    if (dataLength >= 100 && dataLength < 500) {
      return 10;
    } else if (dataLength >= 500 && dataLength < 1000) {
      return 25;
    } else if (dataLength >= 1000) {
      return 50;
    }
    return 1; // Default for smaller datasets
  };

  const calculateIterationStats = (data: UserPerformanceData): IterationStats[] => {
    const users = Object.keys(data);
    if (users.length === 0) return [];

    const maxIterations = Math.max(...users.map(user => data[user].length));
    const stats: IterationStats[] = [];

    for (let i = 0; i < maxIterations; i++) {
      const scores: number[] = [];
      
      users.forEach(user => {
        if (i < data[user].length) {
          scores.push(data[user][i]);
        }
      });

      if (scores.length === 0) continue;

      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      const range = Math.max(...scores) - Math.min(...scores);

      stats.push({
        iteration: i + 1,
        mean,
        variance,
        standardDeviation,
        range,
        scores: [...scores]
      });
    }

    return stats;
  };

  const detectInterestingGames = (stats: IterationStats[]): InterestingGame[] => {
    if (stats.length < 3) return [];

    const interestingMap = new Map<number, InterestingGame>();
    const users = Object.keys(performanceData);
    
    for (let i = 1; i < stats.length - 1; i++) {
      const current = stats[i];
      const prev = stats[i - 1];
      const iteration = current.iteration;

      // Calculate various change metrics
      const varianceChange = Math.abs(current.variance - prev.variance) / (prev.variance || 1);
      const meanChange = Math.abs(current.mean - prev.mean) / (prev.mean || 1);
      
      // Initialize or get existing game entry
      if (!interestingMap.has(iteration)) {
        interestingMap.set(iteration, {
          iteration,
          reasons: [],
          totalSignificance: 0
        });
      }
      const gameEntry = interestingMap.get(iteration)!;
      
      // 1. Individual Player Breakthroughs/Collapses
      let maxPlayerChange = 0;
      let playerWithMaxChange = '';
      let playerChangeType = '';
      
      users.forEach(user => {
        const userData = performanceData[user];
        if (i < userData.length && (i - 1) < userData.length) {
          const currentScore = userData[i];
          const prevScore = userData[i - 1];
          const absoluteChange = Math.abs(currentScore - prevScore);
          const percentageChange = prevScore !== 0 ? Math.abs(currentScore - prevScore) / Math.abs(prevScore) : 0;
          const combinedChange = Math.max(absoluteChange / 1000, percentageChange);
          
          if (combinedChange > maxPlayerChange) {
            maxPlayerChange = combinedChange;
            playerWithMaxChange = user;
            playerChangeType = currentScore > prevScore ? 'breakthrough' : 'collapse';
          }
        }
      });
      
      if (maxPlayerChange > 0.4) {
        const userData = performanceData[playerWithMaxChange];
        const changeAmount = Math.abs(userData[i] - userData[i - 1]);
        gameEntry.reasons.push({
          reason: playerChangeType === 'breakthrough' ? 'Player Breakthrough' : 'Player Collapse',
          significance: maxPlayerChange,
          description: `${playerWithMaxChange} had a major ${playerChangeType} (${Math.round(changeAmount)} points, ${Math.round(maxPlayerChange * 100)}% change)`
        });
        gameEntry.totalSignificance += maxPlayerChange;
      }

      // 2. Comeback Detection (player moving from bottom to competitive)
      if (i >= 2) {
        users.forEach(user => {
          const userData = performanceData[user];
          if (i < userData.length && (i - 2) < userData.length) {
            const oneRoundAgo = userData[i - 1];
            const currentScore = userData[i];
            
            // Check if player was in bottom half and is now rising
            const wasLowest = prev.scores.indexOf(oneRoundAgo) <= prev.scores.length * 0.3;
            const improvement = currentScore - oneRoundAgo;
            const significantImprovement = improvement > current.mean * 0.5;
            
            if (wasLowest && significantImprovement) {
              gameEntry.reasons.push({
                reason: 'Underdog Comeback',
                significance: improvement / (current.mean || 1),
                description: `${user} staged a remarkable comeback from the bottom (+${Math.round(improvement)} points)`
              });
              gameEntry.totalSignificance += improvement / (current.mean || 1);
            }
          }
        });
      }

      // 3. Leader Dethronement
      if (i >= 1) {
        const prevLeader = users.find(user => {
          const userData = performanceData[user];
          return (i - 1) < userData.length && userData[i - 1] === Math.max(...prev.scores);
        });
        
        const currentLeader = users.find(user => {
          const userData = performanceData[user];
          return i < userData.length && userData[i] === Math.max(...current.scores);
        });
        
        if (prevLeader && currentLeader && prevLeader !== currentLeader) {
          const prevLeaderData = performanceData[prevLeader];
          const leadershipLoss = prevLeaderData[i - 1] - prevLeaderData[i];
          if (leadershipLoss > current.mean * 0.3) {
            gameEntry.reasons.push({
              reason: 'Leadership Change',
              significance: leadershipLoss / (current.mean || 1),
              description: `${prevLeader} lost leadership to ${currentLeader} (${Math.round(leadershipLoss)} point drop)`
            });
            gameEntry.totalSignificance += leadershipLoss / (current.mean || 1);
          }
        }
      }

      // 4. Dead Heat Detection (multiple players very close)
      const closeThreshold = current.standardDeviation * 0.2;
      const closeCount = current.scores.filter(score => 
        Math.abs(score - current.mean) <= closeThreshold
      ).length;
      
      if (closeCount >= Math.min(3, users.length) && current.standardDeviation < prev.standardDeviation * 0.7) {
        gameEntry.reasons.push({
          reason: 'Dead Heat Formation',
          significance: closeCount / users.length,
          description: `${closeCount} players bunched together within ${Math.round(closeThreshold)} points`
        });
        gameEntry.totalSignificance += closeCount / users.length;
      }

      // 5. Breakaway Leader
      const sortedCurrentScores = [...current.scores].sort((a, b) => b - a);
      const maxScore = sortedCurrentScores[0];
      const secondMax = sortedCurrentScores[1] || 0;
      const leadGap = maxScore - secondMax;
      
      const sortedPrevScores = [...prev.scores].sort((a, b) => b - a);
      const prevMaxScore = sortedPrevScores[0];
      const prevSecondMax = sortedPrevScores[1] || 0;
      const prevLeadGap = prevMaxScore - prevSecondMax;
      
      if (leadGap > prevLeadGap * 2 && leadGap > current.mean * 0.4) {
        // Find leader more robustly
        let leader = '';
        let maxFoundScore = -Infinity;
        
        users.forEach(user => {
          const userData = performanceData[user];
          if (i < userData.length) {
            const userScore = userData[i];
            if (userScore > maxFoundScore) {
              maxFoundScore = userScore;
              leader = user;
            }
          }
        });
        
        if (leader) {
          gameEntry.reasons.push({
            reason: 'Breakaway Leader',
            significance: leadGap / (current.mean || 1),
            description: `${leader} broke away from the pack (+${Math.round(leadGap - prevLeadGap)} point lead increase)`
          });
          gameEntry.totalSignificance += leadGap / (current.mean || 1);
        }
      }

      // 6. Score Stagnation (everyone stopped improving)
      if (i >= 2) {
        const avgChange = Math.abs(current.mean - prev.mean);
        const prevAvgChange = Math.abs(prev.mean - stats[i - 2].mean);
        
        if (avgChange < prevAvgChange * 0.3 && avgChange < current.mean * 0.05) {
          gameEntry.reasons.push({
            reason: 'Score Stagnation',
            significance: prevAvgChange / (avgChange || 1),
            description: `Competition plateaued - minimal score changes across all players`
          });
          gameEntry.totalSignificance += prevAvgChange / (avgChange || 1);
        }
      }

      // 7. Volatility Spike (scores became very unstable)
      if (i >= 2) {
        const currentVolatility = current.standardDeviation / (current.mean || 1);
        const prevVolatility = prev.standardDeviation / (prev.mean || 1);
        const volatilityIncrease = currentVolatility - prevVolatility;
        
        if (volatilityIncrease > 0.3 && currentVolatility > 0.5) {
          gameEntry.reasons.push({
            reason: 'Volatility Explosion',
            significance: volatilityIncrease,
            description: `Scores became highly unstable - ${Math.round(volatilityIncrease * 100)}% volatility increase`
          });
          gameEntry.totalSignificance += volatilityIncrease;
        }
      }

      // 8. Perfect Game Detection (unusually high scores)
      const exceptionalThreshold = current.mean + (current.standardDeviation * 2.5);
      const exceptionalPlayers = users.filter(user => {
        const userData = performanceData[user];
        return i < userData.length && userData[i] > exceptionalThreshold;
      });
      
      if (exceptionalPlayers.length > 0 && current.standardDeviation > 0) {
        const topPlayer = exceptionalPlayers[0];
        const topScore = performanceData[topPlayer][i];
        gameEntry.reasons.push({
          reason: 'Exceptional Performance',
          significance: (topScore - current.mean) / (current.standardDeviation || 1),
          description: `${topPlayer} achieved exceptional score of ${Math.round(topScore)} (${Math.round((topScore - current.mean) / (current.standardDeviation || 1) * 10) / 10}σ above mean)`
        });
        gameEntry.totalSignificance += (topScore - current.mean) / (current.standardDeviation || 1);
      }

      // Original metrics (refined)
      if (varianceChange > 0.5 && current.variance > prev.variance) {
        gameEntry.reasons.push({
          reason: 'Competition Chaos',
          significance: varianceChange,
          description: `Score distribution exploded - ${Math.round(varianceChange * 100)}% variance increase`
        });
        gameEntry.totalSignificance += varianceChange;
      }

      if (varianceChange > 0.4 && current.variance < prev.variance && current.standardDeviation < 1000) {
        gameEntry.reasons.push({
          reason: 'Pack Convergence',
          significance: varianceChange,
          description: `Players clustered together - ${Math.round(varianceChange * 100)}% variance decrease`
        });
        gameEntry.totalSignificance += varianceChange;
      }

      if (meanChange > 0.3) {
        const direction = current.mean > prev.mean ? 'surged' : 'crashed';
        gameEntry.reasons.push({
          reason: 'Market Movement',
          significance: meanChange,
          description: `All scores ${direction} together - ${Math.round(meanChange * 100)}% average change`
        });
        gameEntry.totalSignificance += meanChange;
      }
    }

    // Convert map to array, filter out games with no reasons, sort by total significance
    const interesting = Array.from(interestingMap.values())
      .filter(game => game.reasons.length > 0)
      .sort((a, b) => b.totalSignificance - a.totalSignificance)
      .slice(0, 10);

    return interesting;
  };

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await liveAPI.get_user_performance(jobId);
      setPerformanceData(data);
      
      // Calculate interesting games
      const stats = calculateIterationStats(data);
      const interesting = detectInterestingGames(stats);
      setInterestingGames(interesting);
      
      // Auto-set sample interval based on data size
      const users = Object.keys(data);
      if (users.length > 0) {
        const maxDataLength = Math.max(...users.map(user => data[user].length));
        const autoInterval = getAutoSampleInterval(maxDataLength);
        setSampleInterval(autoInterval);
      }
    } catch (err: unknown) {
      console.error('Error fetching performance data:', err);
      const errorResponse = err as { response?: { status: number } };
      if (errorResponse.response?.status === 403) {
        setError('PRIVATE');
      } else {
        setError('Failed to load performance data');
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchPerformanceData();
    }
  }, [jobId, fetchPerformanceData]);

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
    const isPrivateError = error === 'PRIVATE';
    return (
      <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
          <p className="text-red-300 text-lg">
            {isPrivateError
              ? 'This performance data is private and cannot be accessed.'
              : error}
          </p>
          {!isPrivateError && (
            <button
              onClick={fetchPerformanceData}
              className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
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
  // Downsample by averaging every n points
  function downsampleUserData(data: number[], n: number): number[] {
    if (n <= 1) return data;
    const result = [];
    for (let i = 0; i < data.length; i += n) {
      const chunk = data.slice(i, i + n);
      const avg = chunk.reduce((a, b) => a + b, 0) / chunk.length;
      result.push(Math.round(avg * 100) / 100);
    }
    return result;
  }

  // Build downsampled chart data
  const downsampled: Record<string, number[]> = {};
  let downsampledMax = 0;
  users.forEach(user => {
    downsampled[user] = downsampleUserData(performanceData[user], sampleInterval);
    if (downsampled[user].length > downsampledMax) downsampledMax = downsampled[user].length;
  });
  const chartData: ChartDataPoint[] = [];
  for (let i = 0; i < downsampledMax; i++) {
    const dataPoint: ChartDataPoint = { iteration: i * sampleInterval + 1 };
    users.forEach(user => {
      if (i < downsampled[user].length) {
        dataPoint[user] = downsampled[user][i];
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
    const changePercent = ((finalValue / 10000) * 100);
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
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-[#39ff14] rounded-lg p-3 shadow-lg">
          <p className="text-[#39ff14] font-mono text-sm font-bold mb-2">
            Iteration {label}
          </p>
          {payload.map((entry: TooltipPayload, index: number) => (
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
  const CustomDot = (props: { cx: number; cy: number; fill: string }) => {
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
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-300 font-mono flex items-center gap-1">
            Sample:
            <select
              value={sampleInterval}
              onChange={e => setSampleInterval(Number(e.target.value))}
              className="ml-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white text-xs font-mono focus:border-[#39ff14] focus:outline-none"
              style={{ minWidth: 60 }}
            >
              {[1,2,3,4,5,10,20,25,50,100].map(n => (
                <option key={n} value={n}>{n === 1 ? 'Raw' : `Avg ${n}`}</option>
              ))}
            </select>
          </label>
          <button
            onClick={fetchPerformanceData}
            className="flex items-center gap-2 px-3 py-1 text-sm border border-[#39ff14] text-[#39ff14] rounded hover:bg-[#39ff14] hover:text-black transition"
          >
            <RefreshCw className="w-4 h-4" />
            REFRESH
          </button>
        </div>
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
                dot={CustomDot}
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

      {/* Interesting Games */}
      {interestingGames.length > 0 && (
        <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6 mb-6">
          <h4 className="text-lg font-bold text-[#ff00cc] mb-3 font-mono flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#ff00cc]" /> Interesting Games
          </h4>
          <div className="space-y-3">
            {interestingGames.map((game, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-mono text-sm font-bold">
                    <Star className="w-4 h-4 text-[#ff00cc] inline mr-2" /> Game {game.iteration}
                  </p>
                  <span className="text-xs text-gray-400 font-mono">
                    Significance: {Math.round(game.totalSignificance * 100) / 100}
                  </span>
                </div>
                <div className="space-y-2">
                  {game.reasons.map((reason, reasonIndex) => (
                    <div key={reasonIndex} className="bg-gray-900/50 p-2 rounded border-l-2 border-[#39ff14]">
                      <p className="text-[#39ff14] font-mono text-xs font-bold mb-1">
                        {reason.reason}
                      </p>
                      <p className="text-gray-300 font-mono text-xs">
                        {reason.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    {stat.changePercent >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span 
                      className={`text-xs font-mono ${
                        stat.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stat.changePercent >= 0 ? '+' : ''}{Math.round(stat.changePercent * 100) / 100}%
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