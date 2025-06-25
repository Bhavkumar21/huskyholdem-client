import React, { useState } from 'react';
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

const ReplaySection: React.FC = () => {
  const gameData: GameData = {
    rounds: {
      0: {
        pot: 0,
        bets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        actions: { 0: " ", 1: " ", 2: " ", 3: " ", 4: " ", 5: " " },
        actionTimes: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      1: {
        pot: 75,
        bets: { 0: 5, 1: 10, 2: 0, 3: 20, 4: 20, 5: 20 },
        actions: { 0: "CALL", 1: "CALL", 2: "FOLD", 3: "RAISE", 4: "CALL", 5: "CALL" },
        actionTimes: { 0: 1200, 1: 800, 2: 2100, 3: 4500, 4: 2800, 5: 1900 }
      },
      2: {
        pot: 175,
        bets: { 0: 25, 1: 30, 2: 0, 3: 45, 4: 45, 5: 30 },
        actions: { 0: "CHECK", 1: "BET", 2: "FOLD", 3: "RAISE", 4: "CALL", 5: "FOLD" },
        actionTimes: { 0: 900, 1: 3200, 2: 0, 3: 6800, 4: 4100, 5: 2500 }
      },
      3: {
        pot: 265,
        bets: { 0: 45, 1: 50, 2: 0, 3: 65, 4: 65, 5: 30 },
        actions: { 0: "FOLD", 1: "CALL", 2: "FOLD", 3: "BET", 4: "CALL", 5: "FOLD" },
        actionTimes: { 0: 8200, 1: 5500, 2: 0, 3: 3900, 4: 7300, 5: 0 }
      },
      4: {
        pot: 365,
        bets: { 0: 45, 1: 100, 2: 0, 3: 115, 4: 115, 5: 30 },
        actions: { 0: "FOLD", 1: "BET", 2: "FOLD", 3: "CALL", 4: "CALL", 5: "FOLD" },
        actionTimes: { 0: 0, 1: 12400, 2: 0, 3: 8600, 4: 15200, 5: 0 }
      }
    },
    playerNames: { 0: "player1", 1: "player2", 2: "player3", 3: "player4", 4: "player5", 5: "player6" },
    playerHands: { 
      0: ["Qh", "Qd"], 
      1: ["9c", "9s"], 
      2: ["6h", "4c"], 
      3: ["Ad", "Ks"], 
      4: ["Jd", "Js"], 
      5: ["8h", "7h"] 
    },
    finalBoard: ["9h", "Jc", "Qc", "2s", "Ac"],
    blinds: { small: 5, big: 10 }
  };

  const [currentRound, setCurrentRound] = useState<number>(0);
  const [showPlayerCards, setShowPlayerCards] = useState<boolean>(false);
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