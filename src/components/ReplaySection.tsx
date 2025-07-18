import React, { useEffect, useState, useMemo } from 'react';
import { liveAPI } from "../api";
import { Play, Pause, SkipBack, SkipForward, Users, TrendingUp, DollarSign, ToggleLeft, ToggleRight, Eye, EyeOff } from "lucide-react";
import './ReplaySection.css';

interface GameRound {
  pot: number;
  bets: { [playerId: string]: number };
  actions: { [playerId: string]: string };
  actionTimes: { [playerId: string]: number };
  action_sequence?: ActionSequence[];
}

interface ActionSequence {
  action: string;
  amount: number;
  player: string | number;
  timestamp: number;
  pot_after_action: number;
  side_pots_after_action?: any[];
  total_pot_after_action?: number;
  total_side_pots_after_action?: any[];
}

interface GameData {
  rounds: { [roundId: string]: GameRound };
  playerNames: { [playerId: string]: string };
  playerHands: { [playerId: string]: string[] };
  finalBoard: string[];
  blinds: { small: number; big: number };
  playerIdToUsername?: { [playerId: string]: string };
  usernameMapping?: { [username: string]: string | number };
}

interface PlayerSeatProps {
  playerId: string;
  style: React.CSSProperties;
  playerStacks: { [playerId: string]: number };
  playerIdToUsername?: { [playerId: string]: string };
  playerHands?: { [playerId: string]: string[] };
  isCurrentPlayer?: boolean;
  showCards?: boolean;
}

interface Position {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform?: string;
}

interface ReplaySectionProps {
  gameId?: string;
}

const ReplaySection: React.FC<ReplaySectionProps> = ({ gameId }) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [actionList, setActionList] = useState<ActionSequence[]>([]);
  const [currentActionIdx, setCurrentActionIdx] = useState<number>(0);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [playerStacks, setPlayerStacks] = useState<{ [playerId: string]: number }>({});
  const [viewMode, setViewMode] = useState<'action' | 'round'>('action');
  const [showPlayerCards, setShowPlayerCards] = useState<boolean>(false);

  // Fetch game data
  useEffect(() => {
    const fetchData = async () => {
      if (gameId) {
        const data = await liveAPI.get_game_data(gameId);
        setGameData(data.game_data);
      } else {
        setGameData(null);
      }
    };
    fetchData();
  }, [gameId]);

  // Build a flat action list from all rounds
  useEffect(() => {
    if (!gameData) return;
    const actions: ActionSequence[] = [];
    Object.values(gameData.rounds).forEach((round) => {
      if (round.action_sequence) {
        actions.push(...round.action_sequence);
      }
    });
    setActionList(actions);
    setCurrentActionIdx(0);
    setCurrentRoundIdx(0);
  }, [gameData]);

  // Helper function to get username from player ID
  const getPlayerUsername = (playerId: string | number) => {
    const numericId = typeof playerId === 'string' ? parseInt(playerId) : playerId;
    // some how the playerId is 1 less than the actual playerId
    return gameData?.playerIdToUsername?.[numericId + 1] || String(playerId);
  };

  // Get player order based on first round action sequence
  const getPlayerOrder = () => {
    if (!gameData) return [];
    
    const firstRoundKey = Object.keys(gameData.rounds).sort((a, b) => parseInt(a) - parseInt(b))[0];
    const firstRound = gameData.rounds[firstRoundKey];
    
    if (firstRound?.action_sequence) {
      // Extract unique player order from action sequence
      const playerOrder: string[] = [];
      const seen = new Set<string>();
      
      for (const action of firstRound.action_sequence) {
        const playerId = String(action.player);
        if (!seen.has(playerId)) {
          playerOrder.push(playerId);
          seen.add(playerId);
        }
      }
      
      return playerOrder;
    }
    
    // Fallback to playerNames keys if no action sequence
    return Object.keys(gameData.playerNames);
  };

  // Calculate player stacks based on view mode
  useEffect(() => {
    if (!gameData) return;
    
    const stacks: { [playerId: string]: number } = {};
    // Initialize stacks for all players
    Object.keys(gameData.playerNames).forEach(pid => { stacks[pid] = 0; });
    
    if (viewMode === 'round') {
      // Calculate stacks up to current round
      const roundKeys = Object.keys(gameData.rounds).sort((a, b) => parseInt(a) - parseInt(b));
      for (let i = 0; i <= currentRoundIdx && i < roundKeys.length; i++) {
        const round = gameData.rounds[roundKeys[i]];
        Object.entries(round.bets).forEach(([playerId, betAmount]) => {
          stacks[playerId] = (stacks[playerId] || 0) - betAmount;
        });
      }
    } else {
      // Calculate stacks up to current action
      if (actionList.length > 0) {
        for (let i = 0; i <= currentActionIdx && i < actionList.length; i++) {
          const action = actionList[i];
          const pid = String(action.player);
          if (action.action === 'CALL' || action.action === 'RAISE' || action.action === 'BET') {
            stacks[pid] = (stacks[pid] || 0) - action.amount;
          }
        }
      }
    }
    
    setPlayerStacks(stacks);
  }, [gameData, actionList, currentActionIdx, currentRoundIdx, viewMode]);

  if (!gameData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff00cc] mb-4"></div>
        <p className="text-gray-400">Loading game replay...</p>
      </div>
    </div>
  );

  const playerIdToUsername = gameData.playerIdToUsername || {};
  const maxActionIdx = actionList.length - 1;
  const roundKeys = Object.keys(gameData.rounds).sort((a, b) => parseInt(a) - parseInt(b));
  const maxRoundIdx = roundKeys.length - 1;
  const currentAction = actionList[currentActionIdx];
  const currentRound = gameData.rounds[roundKeys[currentRoundIdx]];

  // Get board cards based on current round
  const getBoardCards = () => {
    if (!gameData.finalBoard) return [];
    
    let roundForBoard = currentRoundIdx;
    if (viewMode === 'action') {
      // Find which round we're in based on action
      // This is a simplified approach - you might need more complex logic
      // based on your action sequence structure
      if (currentActionIdx < actionList.length / 4) roundForBoard = 0;
      else if (currentActionIdx < actionList.length / 2) roundForBoard = 1;
      else if (currentActionIdx < (actionList.length * 3) / 4) roundForBoard = 2;
      else roundForBoard = 3;
    }
    
    switch (roundForBoard) {
      case 0: return []; // Pre-flop
      case 1: return gameData.finalBoard.slice(0, 3); // Flop
      case 2: return gameData.finalBoard.slice(0, 4); // Turn
      case 3: return gameData.finalBoard.slice(0, 5); // River
      default: return gameData.finalBoard;
    }
  };

  const PlayerSeat: React.FC<PlayerSeatProps> = ({ playerId, style, playerStacks, playerIdToUsername, playerHands, isCurrentPlayer, showCards }) => {
    const username = getPlayerUsername(playerId);
    const stack = playerStacks[playerId] || 0;
    const cards = playerHands?.[playerId] || [];
    
    return (
      <div 
        className={`absolute bg-black/30 border rounded-lg p-2 min-w-[140px] ${
          isCurrentPlayer ? 'border-[#ff00cc] shadow-lg shadow-[#ff00cc]/25' : 'border-[#444]'
        }`}
        style={style}
      >
        <div className="text-center">
          <div className={`font-mono text-sm font-bold ${isCurrentPlayer ? 'text-[#ff00cc]' : 'text-white'}`}>
            {username}
          </div>
          <div className="text-[#39ff14] font-mono text-xs mt-1">
            ${stack}
          </div>
          {/* Player Cards */}
          <div className="flex justify-center gap-1 mt-2">
            {cards.map((card, index) => (
              <div
                key={index}
                className={`w-6 h-8 rounded border text-xs flex items-center justify-center font-mono ${
                  showCards
                    ? 'bg-white text-black border-gray-300'
                    : 'bg-blue-900 text-blue-300 border-blue-700'
                }`}
              >
                {showCards ? card : '🂠'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CALL': return 'text-[#39ff14]';
      case 'RAISE': return 'text-[#ff00cc]';
      case 'BET': return 'text-[#ff00cc]';
      case 'FOLD': return 'text-red-500';
      case 'CHECK': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getRoundName = (roundIdx: number) => {
    switch (roundIdx) {
      case 0: return 'Pre-flop';
      case 1: return 'Flop';
      case 2: return 'Turn';
      case 3: return 'River';
      default: return `Round ${roundIdx + 1}`;
    }
  };

  // Player positions
  const playerPositions: Position[] = [
    { top: '10px', left: '50%', transform: 'translateX(-50%)' },
    { top: '25%', right: '10px', transform: 'translateY(-50%)' },
    { top: '75%', right: '10px', transform: 'translateY(-50%)' },
    { bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
    { top: '75%', left: '10px', transform: 'translateY(-50%)' },
    { top: '25%', left: '10px', transform: 'translateY(-50%)' },
  ];

  const boardCards = getBoardCards();
  const playerOrder = getPlayerOrder();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold font-mono text-[#ff00cc] mb-2">POKER REPLAY</h1>
          <p className="text-gray-400">Step-by-step game analysis</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-black/40 border border-[#444] rounded-xl p-2 flex items-center gap-2">
            <button
              onClick={() => setViewMode('action')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'action' 
                  ? 'bg-[#ff00cc] text-black' 
                  : 'text-[#ff00cc] hover:bg-[#ff00cc]/20'
              }`}
            >
              Action by Action
            </button>
            <button
              onClick={() => setViewMode('round')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'round' 
                  ? 'bg-[#39ff14] text-black' 
                  : 'text-[#39ff14] hover:bg-[#39ff14]/20'
              }`}
            >
              Round by Round
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/40 border border-[#444] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {viewMode === 'action' ? (
                <>
                  <button
                    onClick={() => setCurrentActionIdx(Math.max(0, currentActionIdx - 1))}
                    disabled={currentActionIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ff00cc]/20 border border-[#ff00cc] text-[#ff00cc] rounded-lg hover:bg-[#ff00cc]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="font-mono text-lg">
                    Action <span className="text-[#ff00cc]">{currentActionIdx + 1}</span> of <span className="text-[#39ff14]">{actionList.length}</span>
                  </span>
                  <button
                    onClick={() => setCurrentActionIdx(Math.min(maxActionIdx, currentActionIdx + 1))}
                    disabled={currentActionIdx === maxActionIdx}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ff00cc]/20 border border-[#ff00cc] text-[#ff00cc] rounded-lg hover:bg-[#ff00cc]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <SkipForward className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentRoundIdx(Math.max(0, currentRoundIdx - 1))}
                    disabled={currentRoundIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] rounded-lg hover:bg-[#39ff14]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="font-mono text-lg">
                    <span className="text-[#39ff14]">{getRoundName(currentRoundIdx)}</span> ({currentRoundIdx + 1} of {roundKeys.length})
                  </span>
                  <button
                    onClick={() => setCurrentRoundIdx(Math.min(maxRoundIdx, currentRoundIdx + 1))}
                    disabled={currentRoundIdx === maxRoundIdx}
                    className="flex items-center gap-2 px-4 py-2 bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] rounded-lg hover:bg-[#39ff14]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <SkipForward className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPlayerCards(!showPlayerCards)}
                className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
              >
                {showPlayerCards ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPlayerCards ? 'Hide' : 'Show'} Cards
              </button>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>SB: ${gameData.blinds.small}</span>
                <span>BB: ${gameData.blinds.big}</span>
              </div>
            </div>
          </div>

          {/* Current Info */}
          {viewMode === 'action' && currentAction && (
            <div className="bg-black/60 border border-[#444] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#39ff14]" />
                    <span className="font-mono text-[#39ff14]">
                      {getPlayerUsername(String(currentAction.player))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${getActionColor(currentAction.action)}`}>
                      {currentAction.action}
                    </span>
                    {currentAction.amount > 0 && (
                      <span className="text-white font-mono">${currentAction.amount}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#39ff14]">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-mono">Pot: ${currentAction.pot_after_action}</span>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'round' && currentRound && (
            <div className="bg-black/60 border border-[#444] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#39ff14]" />
                    <span className="font-mono text-[#39ff14] font-bold">
                      {getRoundName(currentRoundIdx)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#39ff14]">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-mono">Pot: ${currentRound.pot}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Poker Table */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 border border-[#444] rounded-xl p-6 relative h-96">
              <div className="absolute inset-4 bg-green-900/20 rounded-full border-2 border-[#39ff14]/30"></div>
              
              {/* Center area with pot and board */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-[#39ff14] font-mono text-2xl font-bold mb-2">
                  ${viewMode === 'action' ? (currentAction?.pot_after_action || 0) : (currentRound?.pot || 0)}
                </div>
                <div className="text-gray-400 text-sm mb-3">POT</div>
                
                {/* Board Cards */}
                <div className="flex justify-center gap-1">
                  {boardCards.length > 0 ? (
                    boardCards.map((card, index) => (
                      <div
                        key={index}
                        className="w-8 h-11 bg-white text-black border border-gray-300 rounded text-xs flex items-center justify-center font-mono font-bold"
                      >
                        {card}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No community cards</div>
                  )}
                </div>
              </div>
              
              {/* Player seats */}
              {playerOrder.map((playerId: string, index: number) => (
                <PlayerSeat
                  key={playerId}
                  playerId={playerId}
                  style={playerPositions[index]}
                  playerStacks={playerStacks}
                  playerIdToUsername={playerIdToUsername}
                  playerHands={gameData.playerHands}
                  showCards={showPlayerCards}
                  isCurrentPlayer={
                    viewMode === 'action' 
                      ? currentAction && String(currentAction.player) === playerId
                      : false
                  }
                />
              ))}
            </div>
          </div>

          {/* Player Stacks */}
          <div className="bg-black/40 border border-[#444] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#39ff14]" />
              <h3 className="font-mono font-bold text-[#39ff14]">PLAYER STACKS</h3>
            </div>
            <div className="space-y-2">
              {playerOrder.map(pid => {
                const stack = playerStacks[pid] || 0;
                const username = getPlayerUsername(pid);
                const isCurrentPlayer = viewMode === 'action' && currentAction && String(currentAction.player) === pid;
                return (
                  <div
                    key={pid}
                    className={`flex justify-between items-center p-2 rounded border font-mono text-sm ${
                      isCurrentPlayer 
                        ? 'border-[#ff00cc] bg-[#ff00cc]/10' 
                        : 'border-[#444] bg-black/30'
                    }`}
                  >
                    <span className={isCurrentPlayer ? 'text-[#ff00cc]' : 'text-white'}>
                      {username}
                    </span>
                    <span className={`font-bold ${stack >= 0 ? 'text-[#39ff14]' : 'text-red-500'}`}>
                      ${stack}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplaySection;