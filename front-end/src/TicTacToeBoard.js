import { useState, useEffect } from 'react';

const TicTacToeBoard = ({
    playerXMoves,
    playerOMoves,
    onClickCell,
}) => {
    const spaceIsTaken = (row, column) => {
        return playerXMoves[row][column]
            || playerOMoves[row][column];
    }

    const cellStyles = [
        ['', 'vertical-lines', ''],
        ['horizontal-lines', 'vertical-lines horizontal-lines', 'horizontal-lines'],
        ['', 'vertical-lines', ''],
    ];

    return (
        <>
        <table>
            <tbody>
                {[0, 1, 2].map(row => (
                    <tr key={row}>
                        {[0, 1, 2].map(column => (
                            <td
                                key={`${row},${column}`}
                                className={`${cellStyles[row][column]} ${spaceIsTaken(row, column) || !onClickCell ? '' : 'empty-cell'}`}
                                onClick={() => {
                                    if (!spaceIsTaken(row, column) && onClickCell) {
                                        onClickCell(row, column);
                                    }
                                }}
                            >
                                {playerXMoves[row][column] ? 'X' : ''}
                                {playerOMoves[row][column] ? 'O' : ''}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
        </>
    );
}

export default TicTacToeBoard;