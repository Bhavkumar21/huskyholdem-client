import React, { useEffect, useState } from 'react';
import { liveAPI } from "../api";
import './ReplaySection.css';

interface GameRound {
  pot: number;
  bets: { [playerId: number]: number };
  actions: { [playerId: number]: string };
  actionTimes: { [playerId: number]: number };
}

interface GameData {
  rounds: { [roundId: number]: GameRound };
  playerNames: { [playerId: number]: string };
  playerHands: { [playerId: number]: string[] };
  finalBoard: string[];
  blinds: { small: number; big: number };
}

interface PlayerSeatProps {
  playerId: string;
  style: React.CSSProperties;
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
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [showPlayerCards, setShowPlayerCards] = useState<boolean>(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (gameId) {
        const data = await liveAPI.get_game_data(gameId);
        setGameData(data.game_data);
      } else {
        // fallback: you can optionally import and use mock data here
        setGameData(null);
      }
    };
    fetchData();
  }, [gameId]);

  if (!gameData) return <div>Loading...</div>;

  const maxRounds = Object.keys(gameData.rounds).length - 1;

  const formatTime = (ms: number): string => {
    return ms > 0 ? `${(ms / 1000).toFixed(1)}s` : '-';
  };

  const getBoardForRound = (round: number): string[] => {
    if (round <= 1) return [];
    if (round <= 2) return gameData.finalBoard.slice(0, 3);
    if (round <= 4) return gameData.finalBoard.slice(0, 4);
    return gameData.finalBoard;
  };

  const playerPositions: Position[] = [
    { top: '10px', left: '50%', transform: 'translateX(-50%)' },
    { top: '25%', right: '10px', transform: 'translateY(-50%)' },
    { top: '75%', right: '10px', transform: 'translateY(-50%)' },
    { bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
    { top: '75%', left: '10px', transform: 'translateY(-50%)' },
    { top: '25%', left: '10px', transform: 'translateY(-50%)' },
  ];

  const currentRoundData = gameData.rounds[currentRound];
  const board = getBoardForRound(currentRound);

  const PlayerSeat: React.FC<PlayerSeatProps> = ({ playerId, style }) => {
    const id = parseInt(playerId);
    const isActive = currentRoundData.actions[id]?.trim() !== "";
    const isFolded = currentRoundData.actions[id] === "FOLD";
    const action = currentRoundData.actions[id]?.trim();
    const bet = currentRoundData.bets[id] || 0;
    
    return (
      <div 
        className={`player-seat ${isFolded ? 'folded' : ''}`}
        style={{ ...style, width: '140px', fontSize: '11px'}}
      >
        <div className="player-cards">
          {showPlayerCards ? (
            gameData.playerHands[id]?.map((card: string, index: number) => (
              <span key={index} className="card visible">
                {card}
              </span>
            ))
          ) : (
            gameData.playerHands[id]?.map((_: string, index: number) => (
              <span key={index} className="card hidden">
                🂠
              </span>
            ))
          )}
        </div>
        
        <div className={`player-tag ${isActive ? 'active' : ''}`}>
          <div className="player-name">
            {gameData.playerNames[id]}
          </div>
          
          <div className="action-bet-info">
            <span className={`action`}>
              {action || "—"}
            </span>
            <span>
              ${bet}
            </span>
          </div>
          
          <div className="action-time">
            {formatTime(currentRoundData.actionTimes[id] || 0)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="poker-replay">
      <div className="info">
        <button
          onClick={() => setCurrentRound(Math.max(0, currentRound - 1))}
          disabled={currentRound === 0}
          className="nav-btn"
        >
          Previous
        </button>
        
        <span className="round-counter">
          {currentRound + 1} / {maxRounds + 1}
        </span>
        
        <button
          onClick={() => setCurrentRound(Math.min(maxRounds, currentRound + 1))}
          disabled={currentRound === maxRounds}
          className="nav-btn"
        >
          Next
        </button>
      </div>

      <div className="info">
          <button
            onClick={() => setShowPlayerCards(!showPlayerCards)}
            className="nav-btn"
          >
            {showPlayerCards ? 'Hide Cards' : 'Show Cards'}
          </button>
        </div>

      <div className="poker-table">
        <div className="table-surface"></div>
        
        <div className="center-area">
          <div className="pot">POT: ${currentRoundData.pot}</div>
          
          <div className="board-cards">
            {board.length > 0 ? (
              board.map((card: string, index: number) => (
                <div key={index} className="board-card">
                  {card}
                </div>
              ))
            ) : (
              <div className="no-cards">Board is empty</div>
            )}
          </div>
        </div>

        {Object.keys(gameData.playerNames).map((playerId: string, index: number) => (
          <PlayerSeat 
            key={playerId} 
            playerId={playerId} 
            style={playerPositions[index]}
          />
        ))}
      </div>

      <div className="info">
        <span><strong>Small Blind:</strong> ${gameData.blinds.small}</span>
        <span><strong>Big Blind:</strong> ${gameData.blinds.big}</span>
      </div>
    </div>
  );
};

export default ReplaySection;