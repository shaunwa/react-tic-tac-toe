import http from 'http';
import express from 'express';
import path from 'path';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import getNextGameState from './getNextGameState.js';
import {
    RUNNING,
    PLAYER_X_WINS,
    PLAYER_O_WINS,
    CATS_GAME,
} from './gameStates.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let expressApp = express();

expressApp.use(express.static(path.join(__dirname, '../../front-end/build')));
expressApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../front-end/build/index.html'))
});

let server = http.createServer(expressApp);
let io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const getStartingMatrix = () => {
    return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
}

let gamesInProgress = {};

function createNewGame(isAutoJoin) {
    return {
        id: uuid(),
        playerXSocket: null,
        playerOSocket: null,
        playerXMoves: getStartingMatrix(),
        playerOMoves: getStartingMatrix(),
        currentPlayer: 'X',
        isAutoJoin,
    };
}

io.on('connection', socket => {
    const { shouldCreateGame, gameId } = socket.handshake.query;
    console.log({ shouldCreateGame, gameId });

    let existingGame;

    if (gameId) {
        existingGame = gamesInProgress[gameId];
    } else {
        existingGame = Object.values(gamesInProgress)
            .find(game => game.isAutoJoin && game.playerXSocket && !game.playerOSocket);
    }
    let game;

    if (existingGame && !shouldCreateGame) {
        game = existingGame;
        game.playerOSocket = socket;
        game.playerOSocket.emit('start');
        game.playerXSocket.emit('start');
        game.playerOSocket.emit('other player turn');
        game.playerXSocket.emit('your turn');
        console.log(`Player O has joined game ${game.id}! Starting the game...`);

        socket.on('disconnect', () => {
            game.playerOSocket = undefined;

            if (game.playerXSocket) {
                game.playerXSocket.emit('info', 'The other player has disconnected, ending the game...');
                game.playerXSocket.disconnect();
                game.playerXSocket = undefined;
            }

            delete gamesInProgress[game.id];
        });
    } else {
        const newGame = createNewGame(!shouldCreateGame);
        gamesInProgress[newGame.id] = newGame;

        if (shouldCreateGame) {
            socket.emit('gameId', newGame.id);
        }

        newGame.playerXSocket = socket;
        console.log(`Player X has joined game ${newGame.id}! Waiting for player O`);

        socket.on('disconnect', () => {
            newGame.playerXSocket = undefined;

            if (newGame.playerOSocket) {
                newGame.playerOSocket.emit('info', 'The other player has disconnected, ending the game...');
                newGame.playerOSocket.disconnect();
                newGame.playerOSocket = undefined;
            }

            delete gamesInProgress[newGame.id];
        });

        game = newGame;
    }

    socket.on('new move', (row, column) => {
        const {
            currentPlayer,
            playerXSocket,
            playerOSocket,
            playerXMoves,
            playerOMoves,
        } = game;

        if (currentPlayer === 'X' && socket === playerXSocket) {
            playerXMoves[row][column] = 1;
            game.currentPlayer = 'O';
        } else if (currentPlayer === 'O' && socket === playerOSocket) {
            playerOMoves[row][column] = 1;
            game.currentPlayer = 'X';
        }

        const nextGameState = getNextGameState(playerXMoves, playerOMoves);

        playerOSocket.emit('updated moves', playerXMoves, playerOMoves);
        playerXSocket.emit('updated moves', playerXMoves, playerOMoves);

        if (nextGameState === RUNNING) {
            let currentPlayerSocket = currentPlayer === 'X'
                ? playerXSocket
                : playerOSocket;
            let otherPlayerSocket = currentPlayer === 'X'
                ? playerOSocket
                : playerXSocket;

            currentPlayerSocket.emit('your turn');
            otherPlayerSocket.emit('other player turn');
        }

        if (nextGameState === PLAYER_X_WINS) {
            playerXSocket.emit('win');
            playerOSocket.emit('lose');
            playerXSocket.disconnect();
            playerOSocket.disconnect();
            delete gamesInProgress[game.id];
        }

        if (nextGameState === PLAYER_O_WINS) {
            playerXSocket.emit('lose');
            playerOSocket.emit('win');
            playerXSocket.disconnect();
            playerOSocket.disconnect();
            delete gamesInProgress[game.id];
        }

        if (nextGameState === CATS_GAME) {
            playerXSocket.emit('tie');
            playerOSocket.emit('tie');
            playerXSocket.disconnect();
            playerOSocket.disconnect();
            delete gamesInProgress[game.id];
        }
    });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});