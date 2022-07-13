import { useState, useEffect } from 'react';
import socketIoClient from 'socket.io-client';
import TicTacToeBoard from './TicTacToeBoard';

const getStartingMatrix = () => {
    return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
}

const TicTacToeGame = ({ isHost, gameId }) => {
    const [playerXMoves, setPlayerXMoves] = useState(getStartingMatrix());
    const [playerOMoves, setPlayerOMoves] = useState(getStartingMatrix());
    const [playerIsWinner, setPlayerIsWinner] = useState(false);
    const [playerIsLoser, setPlayerIsLoser] = useState(false);
    const [gameIsTie, setGameIsTie] = useState(false);

    const [socket, setSocket] = useState(null);
    const [playerIsWaiting, setPlayerIsWaiting] = useState(true);
    const [isPlayersTurn, setIsPlayersTurn] = useState(false);
    const [createdGameId, setCreatedGameId] = useState('');

    useEffect(() => {
        const serverUrl = process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8080'
            : 'https://react-tic-tac-toe-shaun.herokuapp.com/';
        let newSocket = socketIoClient(serverUrl, {
            query: {
                shouldCreateGame: isHost ? true : '',
                gameId,
            },
        });
        setSocket(newSocket);

        newSocket.on('info', data => {
            console.log(data);
        });

        newSocket.on('start', () => {
            setPlayerIsWaiting(false);
        });

        newSocket.on('gameId', gameId => {
            setCreatedGameId(gameId);
        });

        newSocket.on('other player turn', () => {
            setIsPlayersTurn(false);
        });

        newSocket.on('your turn', () => {
            setIsPlayersTurn(true);
        });

        newSocket.on('updated moves', (newPlayerXMoves, newPlayerOMoves) => {
            setPlayerXMoves(newPlayerXMoves);
            setPlayerOMoves(newPlayerOMoves);
        });

        newSocket.on('win', () => {
            setPlayerIsWinner(true);
        });

        newSocket.on('lose', () => {
            setPlayerIsLoser(true);
        });

        newSocket.on('tie', () => {
            setGameIsTie(true);
        });

        return () => { newSocket.disconnect() };
    }, []);

    const handleTurn = (row, column) => {
        socket.emit('new move', row, column);
    }

    if (playerIsWaiting) {
        return (
            <>
            <h1>Waiting for another player to join...</h1>
            {createdGameId && <h3>The game id is: {createdGameId}</h3>}
            </>
        );
    }

    const gameIsOver = playerIsWinner || playerIsLoser || gameIsTie;

    return (
        <>
        <h1>Tic-Tac-Toe</h1>
        <TicTacToeBoard
            playerXMoves={playerXMoves}
            playerOMoves={playerOMoves}
            onClickCell={handleTurn} />
        {playerIsWinner && <h3>You are the winner!!</h3>}
        {playerIsLoser && <h3>You are NOT the winner!!</h3>}
        {gameIsTie && <h3>Cats' Game! Neither player wins!</h3>}
        {gameIsOver || (isPlayersTurn
            ? <h3>It's your turn</h3>
            : <h3>Waiting for the other player's input...</h3>)}
        </>
    );
}

export default TicTacToeGame;