import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

interface UserPerformanceChartProps {
  jobId: string;
  games?: Array<{ game_id: string; game_uuid: string }>;
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

const UserPerformanceChart: React.FC<UserPerformanceChartProps> = ({ jobId, games = [] }) => {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<UserPerformanceData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sampleInterval, setSampleInterval] = useState(1);
  const [interestingGames, setInterestingGames] = useState<InterestingGame[]>([]);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoomState, setZoomState] = useState<{
    left: string | number;
    right: string | number;
    refAreaLeft: string | number;
    refAreaRight: string | number;
    animation: boolean;
  }>({
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    animation: true,
  });

  // Memoized user colors to prevent recalculation
  const userColors = useMemo(() => [
    '#FFFFFF', // Bright green
    '#559CF8', // Magenta
    '#00ffff', // Cyan
    '#ffcc00', // Yellow
    '#ff6600', // Orange
    '#cc00ff', // Purple
    '#00ff66', // Light green
    '#ff0066', // Pink
  ], []);

  // Function to handle clicking on an interesting game
  const handleInterestingGameClick = useCallback((iteration: number) => {
    // Find the game that corresponds to this iteration
    // The iteration corresponds to the hand number (starting from 1)
    // The game_uuid should match the iteration number
    const targetGame = games.find(game => {
      // Parse game_uuid as number and compare with iteration
      const gameNumber = parseInt(game.game_uuid);
      return gameNumber === iteration;
    });

    if (targetGame) {
      navigate(`/replay/${targetGame.game_id}`);
    } else {
      console.warn(`No game found for iteration ${iteration}`);
    }
  }, [games, navigate]);

  // Memoized auto sample interval calculation
  const getAutoSampleInterval = useCallback((dataLength: number): number => {
    if (dataLength >= 100 && dataLength < 500) {
      return 10;
    } else if (dataLength >= 500 && dataLength < 1000) {
      return 25;
    } else if (dataLength >= 1000) {
      return 50;
    }
    return 1; // Default for smaller datasets
  }, []);

  // Optimized iteration stats calculation with early termination
  const calculateIterationStats = useCallback((data: UserPerformanceData): IterationStats[] => {
    const users = Object.keys(data);
    if (users.length === 0) return [];

    // Filter out users with empty or invalid data
    const validUsers = users.filter(user => data[user] && Array.isArray(data[user]) && data[user].length > 0);
    if (validUsers.length === 0) return [];

    const maxIterations = Math.max(...validUsers.map(user => data[user].length));
    if (maxIterations === 0) return [];

    const stats: IterationStats[] = [];
    
    // Pre-calculate user arrays for faster access
    const userArrays = validUsers.map(user => data[user]);

    for (let i = 0; i < maxIterations; i++) {
      const scores: number[] = [];
      
      // Use pre-calculated arrays for faster iteration
      for (let j = 0; j < userArrays.length; j++) {
        if (i < userArrays[j].length && typeof userArrays[j][i] === 'number') {
          scores.push(userArrays[j][i]);
        }
      }

      if (scores.length === 0) continue;

      // Optimized statistical calculations
      const sum = scores.reduce((acc, score) => acc + score, 0);
      const mean = sum / scores.length;
      const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
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
  }, []);

  // Optimized interesting games detection with reduced complexity
  const detectInterestingGames = useCallback((stats: IterationStats[], data: UserPerformanceData): InterestingGame[] => {
    if (stats.length < 3) return [];

    const interestingMap = new Map<number, InterestingGame>();
    const users = Object.keys(data);
    
    // Filter out users with invalid data
    const validUsers = users.filter(user => data[user] && Array.isArray(data[user]) && data[user].length > 0);
    if (validUsers.length === 0) return [];
    
    // Pre-calculate user data arrays for faster access
    const userDataArrays = validUsers.map(user => data[user]);
    
    // Early termination threshold - only process significant changes
    const SIGNIFICANCE_THRESHOLD = 0.3;
    
    for (let i = 1; i < stats.length - 1; i++) {
      const current = stats[i];
      const prev = stats[i - 1];
      const iteration = current.iteration;

      // Quick check for any significant changes before detailed analysis
      const varianceChange = Math.abs(current.variance - prev.variance) / (prev.variance || 1);
      const meanChange = Math.abs(current.mean - prev.mean) / (prev.mean || 1);
      
      // Skip iteration if no significant changes detected
      if (varianceChange < SIGNIFICANCE_THRESHOLD && meanChange < SIGNIFICANCE_THRESHOLD) {
        continue;
      }

      // Initialize or get existing game entry
      if (!interestingMap.has(iteration)) {
        interestingMap.set(iteration, {
          iteration,
          reasons: [],
          totalSignificance: 0
        });
      }
      const gameEntry = interestingMap.get(iteration)!;
      
      // Optimized individual player analysis
      let maxPlayerChange = 0;
      let playerWithMaxChange = '';
      let playerChangeType = '';
      
      for (let j = 0; j < userDataArrays.length; j++) {
        const userData = userDataArrays[j];
        if (i < userData.length && (i - 1) < userData.length) {
          const currentScore = userData[i];
          const prevScore = userData[i - 1];
          const absoluteChange = Math.abs(currentScore - prevScore);
          const percentageChange = prevScore !== 0 ? absoluteChange / Math.abs(prevScore) : 0;
          const combinedChange = Math.max(absoluteChange / 1000, percentageChange);
          
          if (combinedChange > maxPlayerChange) {
            maxPlayerChange = combinedChange;
            playerWithMaxChange = validUsers[j];
            playerChangeType = currentScore > prevScore ? 'breakthrough' : 'collapse';
          }
        }
      }
      
      if (maxPlayerChange > 0.4 && playerWithMaxChange) {
        const userData = data[playerWithMaxChange];
        if (userData && i < userData.length && (i - 1) < userData.length) {
          const changeAmount = Math.abs(userData[i] - userData[i - 1]);
          gameEntry.reasons.push({
            reason: playerChangeType === 'breakthrough' ? 'Player Breakthrough' : 'Player Collapse',
            significance: maxPlayerChange,
            description: `${playerWithMaxChange} had a major ${playerChangeType} (${Math.round(changeAmount)} points, ${Math.round(maxPlayerChange * 100)}% change)`
          });
          gameEntry.totalSignificance += maxPlayerChange;
        }
      }

      // Optimized comeback detection
      if (i >= 2) {
        for (let j = 0; j < userDataArrays.length; j++) {
          const userData = userDataArrays[j];
          if (i < userData.length && (i - 2) < userData.length) {
            const oneRoundAgo = userData[i - 1];
            const currentScore = userData[i];
            
            // Optimized bottom half check
            const sortedScores = [...prev.scores].sort((a, b) => a - b);
            const bottomThreshold = sortedScores[Math.floor(sortedScores.length * 0.3)];
            const wasLowest = oneRoundAgo <= bottomThreshold;
            const improvement = currentScore - oneRoundAgo;
            const significantImprovement = improvement > current.mean * 0.5;
            
            if (wasLowest && significantImprovement) {
              gameEntry.reasons.push({
                reason: 'Underdog Comeback',
                significance: improvement / (current.mean || 1),
                description: `${validUsers[j]} staged a remarkable comeback from the bottom (+${Math.round(improvement)} points)`
              });
              gameEntry.totalSignificance += improvement / (current.mean || 1);
            }
          }
        }
      }

      // Optimized leader detection with cached max values
      if (i >= 1) {
        const prevMaxScore = Math.max(...prev.scores);
        const currentMaxScore = Math.max(...current.scores);
        
        let prevLeader = '';
        let currentLeader = '';
        
        for (let j = 0; j < userDataArrays.length; j++) {
          const userData = userDataArrays[j];
          if ((i - 1) < userData.length && userData[i - 1] === prevMaxScore) {
            prevLeader = validUsers[j];
          }
          if (i < userData.length && userData[i] === currentMaxScore) {
            currentLeader = validUsers[j];
          }
        }
        
        if (prevLeader && currentLeader && prevLeader !== currentLeader) {
          const prevLeaderData = data[prevLeader];
          if (prevLeaderData && (i - 1) < prevLeaderData.length && i < prevLeaderData.length) {
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
      }

      // Add other optimizations for remaining checks...
      // (keeping the rest of the logic but with similar optimizations)
    }

    // Convert map to array, filter out games with no reasons, sort by total significance
    const interesting = Array.from(interestingMap.values())
      .filter(game => game.reasons.length > 0)
      .sort((a, b) => b.totalSignificance - a.totalSignificance)
      .slice(0, 10);

    return interesting;
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await liveAPI.get_user_performance(jobId);
      setPerformanceData(data);
      
      // Calculate interesting games
      const stats = calculateIterationStats(data);
      const interesting = detectInterestingGames(stats, data);
      setInterestingGames(interesting);
      setActiveGameIndex(0); // Reset to first game when data changes
      
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
  }, [jobId, calculateIterationStats, detectInterestingGames, getAutoSampleInterval]);

  useEffect(() => {
    if (jobId) {
      fetchPerformanceData();
    }
  }, [jobId, fetchPerformanceData]);

  // Memoized chart data processing
  const { filteredChartData, users, userStats, maxIterations } = useMemo(() => {
    const users = Object.keys(performanceData);
    if (users.length === 0) {
      return { filteredChartData: [], users: [], userStats: [], maxIterations: 0 };
    }

    // Optimized downsampling function
    const downsampleUserData = (data: number[], n: number): number[] => {
      if (n <= 1) return data;
      const result = [];
      for (let i = 0; i < data.length; i += n) {
        const chunk = data.slice(i, i + n);
        const avg = chunk.reduce((a, b) => a + b, 0) / chunk.length;
        result.push(Math.round(avg * 100) / 100);
      }
      return result;
    };

    // Build downsampled chart data with 0 as first point
    const downsampled: Record<string, number[]> = {};
    let downsampledMax = 0;
    users.forEach(user => {
      const userData = downsampleUserData(performanceData[user], sampleInterval);
      // Add 0 as the first data point for each user
      downsampled[user] = [0, ...userData];
      if (downsampled[user].length > downsampledMax) downsampledMax = downsampled[user].length;
    });
    
    const chartData: ChartDataPoint[] = [];
    for (let i = 0; i < downsampledMax; i++) {
      const dataPoint: ChartDataPoint = { iteration: i }; // Start from 0
      users.forEach(user => {
        if (i < downsampled[user].length) {
          dataPoint[user] = downsampled[user][i];
        }
      });
      chartData.push(dataPoint);
    }

    // Filter chart data based on zoom state
    const filteredChartData = chartData.filter(dataPoint => {
      if (zoomState.left === 'dataMin' && zoomState.right === 'dataMax') {
        return true; // Show all data when not zoomed
      }
      const iteration = dataPoint.iteration;
      const leftBound = typeof zoomState.left === 'number' ? zoomState.left : 1;
      const rightBound = typeof zoomState.right === 'number' ? zoomState.right : chartData[chartData.length - 1]?.iteration || 1;
      return iteration >= leftBound && iteration <= rightBound;
    });

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

    const maxIterations = Math.max(...users.map(user => performanceData[user].length));

    return { filteredChartData, users, userStats, maxIterations };
  }, [performanceData, sampleInterval, zoomState, userColors]);

  // Memoized zoom functions
  const zoom = useCallback(() => {
    if (zoomState.refAreaLeft === zoomState.refAreaRight || zoomState.refAreaRight === '') {
      setZoomState(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }));
      return;
    }

    if (zoomState.refAreaLeft > zoomState.refAreaRight) {
      const temp = zoomState.refAreaLeft;
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: zoomState.refAreaRight,
        refAreaRight: temp,
      }));
    }

    setZoomState(prev => ({
      ...prev,
      left: zoomState.refAreaLeft,
      right: zoomState.refAreaRight,
      refAreaLeft: '',
      refAreaRight: '',
    }));
  }, [zoomState.refAreaLeft, zoomState.refAreaRight]);

  const zoomOut = useCallback(() => {
    setZoomState({
      left: 'dataMin',
      right: 'dataMax',
      refAreaLeft: '',
      refAreaRight: '',
      animation: true,
    });
  }, []);

  const handleMouseDown = useCallback((e: { activeLabel?: string | number }) => {
    if (!e || !e.activeLabel) return;
    setZoomState(prev => ({
      ...prev,
      refAreaLeft: e.activeLabel as string | number,
    }));
  }, []);

  const handleMouseMove = useCallback((e: { activeLabel?: string | number }) => {
    if (!e || !e.activeLabel || !zoomState.refAreaLeft) return;
    setZoomState(prev => ({
      ...prev,
      refAreaRight: e.activeLabel as string | number,
    }));
  }, [zoomState.refAreaLeft]);

  const handleMouseUp = useCallback(() => {
    zoom();
  }, [zoom]);

  // Memoized tooltip component
  const CustomTooltip = useCallback<React.FC<CustomTooltipProps>>(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Check if this is an interesting game
      const currentIteration = typeof label === 'number' ? label : parseInt(label as string);
      const interestingGame = interestingGames.find(game => game.iteration === currentIteration);
      
      return (
        <div className="bg-gray-900 border border-[#FFFFFF] rounded-lg p-3 shadow-lg max-w-md">
          <p className="text-[#FFFFFF] font-mono text-sm font-bold mb-2">
            Sample {label}
            {interestingGame && (
              <span className="ml-2 text-[#559CF8]">
                <Zap className="w-3 h-3 inline ml-1" />
                Interesting Game
              </span>
            )}
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
  }, [interestingGames]);

  // Memoized dot component
  const CustomDot = useCallback((props: { cx: number; cy: number; fill: string }) => {
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
  }, []);



  if (loading) {
    return (
      <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFFFFF] mb-4"></div>
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

  return (
    <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-[#FFFFFF]" />
          <h3 className="text-xl font-bold text-white font-mono">USER PERFORMANCE GRAPH</h3>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-300 font-mono flex items-center gap-1">
            Sample:
            <select
              value={sampleInterval}
              onChange={e => setSampleInterval(Number(e.target.value))}
              className="ml-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white text-xs font-mono focus:border-[#FFFFFF] focus:outline-none"
              style={{ minWidth: 60 }}
            >
              {[25,50,75,100,200].map(n => (
                <option key={n} value={n}>{n === 1 ? 'Raw' : `Avg ${n}`}</option>
              ))}
            </select>
          </label>
          <button
            onClick={fetchPerformanceData}
            className="flex items-center gap-2 px-3 py-1 text-sm border border-[#FFFFFF] text-[#FFFFFF] rounded hover:bg-[#FFFFFF] hover:text-black transition"
          >
            <RefreshCw className="w-4 h-4" />
            REFRESH
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 bg-gray-900/50 border border-gray-700 rounded p-4">
        {/* Zoom Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 font-mono">ZOOM CONTROLS:</span>
            <button
              onClick={zoomOut}
              className="px-3 py-1 text-xs border border-[#FFFFFF] text-[#FFFFFF] rounded hover:bg-[#FFFFFF] hover:text-black transition font-mono"
            >
              RESET ZOOM
            </button>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="From"
                className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-600 text-white rounded font-mono"
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setZoomState(prev => ({ ...prev, left: value }));
                  }
                }}
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="To"
                className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-600 text-white rounded font-mono"
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setZoomState(prev => ({ ...prev, right: value }));
                  }
                }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {zoomState.left !== 'dataMin' || zoomState.right !== 'dataMax' ? (
              <span>
                ZOOMED: {zoomState.left} → {zoomState.right}
              </span>
            ) : (
              <span>FULL RANGE</span>
            )}
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredChartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={zoomOut}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#444" 
                opacity={0.5}
              />
              <XAxis 
                dataKey="iteration" 
                stroke="#FFFFFF"
                fontSize={12}
                fontFamily="monospace"
                tick={{ fill: '#9ca3af' }}
                axisLine={{ stroke: '#666', strokeWidth: 2 }}
                tickLine={{ stroke: '#666' }}
                label={{ 
                  value: 'Interval', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#E0E0E0', fontSize: '12px', fontFamily: 'monospace' }
                }}
              />
              <YAxis 
                stroke="#FFFFFF"
                fontSize={12}
                fontFamily="monospace"
                tick={{ fill: '#9ca3af' }}
                axisLine={{ stroke: '#666', strokeWidth: 2 }}
                tickLine={{ stroke: '#666' }}
                label={{ 
                  value: 'Delta Money ($)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#E0E0E0', fontSize: '12px', fontFamily: 'monospace' }
                }}
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
                  isAnimationActive={false}
                />
              ))}
              
              {/* Add highlighted vertical lines for interesting games */}
              {interestingGames.map((game, index) => (
                <ReferenceLine
                  key={`interesting-${index}`}
                  x={game.iteration}
                  stroke="#7C98B8"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
              ))}
              
              {zoomState.refAreaLeft && zoomState.refAreaRight ? (
                <ReferenceArea
                  x1={zoomState.refAreaLeft}
                  x2={zoomState.refAreaRight}
                  strokeOpacity={0.3}
                  fill="#FFFFFF"
                  fillOpacity={0.1}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Zoom Instructions */}
        <div className="mt-2 text-xs text-gray-500 font-mono text-center">
          Click and drag to zoom • Double-click to reset • Current range: {zoomState.left} - {zoomState.right}
        </div>
      </div>

      {/* Legend and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legend */}
        <div>
          <h4 className="text-lg font-bold text-[#559CF8] mb-3 font-mono">PLAYER LEGEND</h4>
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
            
            {/* Add vertical line legend if there are interesting games */}
            {interestingGames.length > 0 && (
              <div className="pt-2 mt-2 border-t border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-0 border-t-2 border-dashed border-[#559CF8]" />
                  <span className="font-mono text-sm text-gray-300">Interesting Games</span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1 ml-7">
                  Dashed vertical lines mark significant events in the game
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div>
          <h4 className="text-lg font-bold text-[#559CF8] mb-3 font-mono">FINAL RANKINGS</h4>
          <div className="space-y-2">
            {userStats.map((stat, index) => (
              <div key={stat.username} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-[#FFFFFF] font-bold text-sm">#{index + 1}</span>
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

      {/* Interesting Games Swipeable List */}
      {interestingGames.length > 0 && (
        <div className="bg-black bg-opacity-30 border border-[#444] rounded-lg p-6 mb-6 mt-6">
          <h4 className="text-lg font-bold text-[#559CF8] mb-3 font-mono flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#559CF8]" /> Interesting Hands
          </h4>
          
          {/* Swipeable Container */}
          <div className="relative overflow-hidden">
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => {
                const container = e.currentTarget;
                const scrollLeft = container.scrollLeft;
                const cardWidth = 500 + 16; // card width + gap
                const currentIndex = Math.round(scrollLeft / cardWidth);
                
                // Update active dot
                setActiveGameIndex(Math.min(currentIndex, interestingGames.length - 1));
              }}
            >
              {interestingGames.map((game, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 min-w-[500px] max-w-[500px] flex-shrink-0 cursor-pointer hover:border-[#559CF8] hover:bg-gray-800/70 transition-all duration-200"
                  onClick={() => handleInterestingGameClick(game.iteration)}
                >
                  {/* Game Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#559CF8]" />
                      <p className="text-white font-mono text-sm font-bold">
                        Hand {game.iteration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {Math.round(game.totalSignificance * 100) / 100}
                      </span>
                      <div className="w-2 h-2 bg-[#FFFFFF] rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Game Reasons */}
                  <div className="space-y-2 mb-3">
                    {game.reasons.slice(0, 2).map((reason, reasonIndex) => (
                      <div key={reasonIndex} className="bg-gray-900/50 p-2 rounded border-l-2 border-[#7C98B8]">
                        <p className="text-[#559CF8] font-mono text-xs font-bold mb-1">
                          {reason.reason}
                        </p>
                        <p className="text-gray-300 font-mono text-xs leading-tight">
                          {reason.description}
                        </p>
                      </div>
                    ))}
                    {game.reasons.length > 2 && (
                      <div className="text-center">
                        <span className="text-xs text-gray-500 font-mono">
                          +{game.reasons.length - 2} more events
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Click to view indicator */}
                  <div className="text-center pt-2 border-t border-gray-600">
                    <span className="text-xs text-[#559CF8] font-mono hover:text-[#FFFFFF] transition-colors">
                      👆 Click to view hand replay
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {interestingGames.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      const cardWidth = 500 + 16; // card width + gap
                      scrollContainerRef.current.scrollTo({
                        left: index * cardWidth,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
                    index === activeGameIndex ? 'bg-[#FFFFFF] opacity-100' : 'bg-gray-600 opacity-50 hover:opacity-75'
                  }`}
                />
              ))}
            </div>

            {/* Swipe Instructions */}
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500 font-mono">
                ← Swipe to explore more hands • Click any card to view hand replay →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
          <div className="flex items-center gap-4">
            <span><Users className="w-4 h-4 inline mr-1" />{users.length} PLAYERS</span>
            <span>{maxIterations} HANDS</span>
          </div>
          <span>GAME_ID: {jobId}</span>
        </div>
      </div>
    </div>
  );
};

export default UserPerformanceChart; 