import { useState } from 'react';
import './App.css';
import TicTacToeGame from './TicTacToeGame';

function App() {
  const [gameMode, setGameMode] = useState('');
  const [gameIdText, setGameIdText] = useState('');
  const [gameId, setGameId] = useState('');

  return (
    <div className="content-container">
      {gameMode ? null : (
        <>
        <button onClick={() => setGameMode('auto')}>Automatic Match-Up</button>
        <button onClick={() => setGameMode('host')}>Host a Game</button>
        <button onClick={() => setGameMode('join')}>Join a Game by ID</button>
        </>
      )}
      {gameMode === 'auto' && <TicTacToeGame />}
      {gameMode === 'host' && <TicTacToeGame isHost />}
      {gameMode === 'join' && (
        gameId ? (
          <TicTacToeGame gameId={gameId} />
        ) : (
          <>
          <input
            type="text"
            placeholder="Enter the id of the game you want to join"
            value={gameIdText}
            onChange={e => setGameIdText(e.target.value)} />
          <button onClick={() => setGameId(gameIdText)}>Join Game</button>
          </>
        )
      )}
    </div>
  );
}

export default App;
