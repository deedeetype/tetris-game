'use client'

import { useEffect, useCallback, useState } from 'react'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BLOCK_SIZE = 30

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
}

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
}

type ShapeType = keyof typeof SHAPES
type Board = (ShapeType | null)[][]

export default function Tetris() {
  const [board, setBoard] = useState<Board>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  )
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][]
    type: ShapeType
    x: number
    y: number
  } | null>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const createNewPiece = useCallback(() => {
    const types = Object.keys(SHAPES) as ShapeType[]
    const type = types[Math.floor(Math.random() * types.length)]
    return {
      shape: SHAPES[type],
      type,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0
    }
  }, [])

  const rotate = (shape: number[][]) => {
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse())
    return newShape
  }

  const checkCollision = useCallback((piece: typeof currentPiece, offsetX = 0, offsetY = 0) => {
    if (!piece) return false
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX
          const newY = piece.y + y + offsetY
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true
          }
          if (newY >= 0 && board[newY][newX]) {
            return true
          }
        }
      }
    }
    return false
  }, [board])

  const mergePiece = useCallback(() => {
    if (!currentPiece) return

    const newBoard = board.map(row => [...row])
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y
          const boardX = currentPiece.x + x
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.type
          }
        }
      }
    }

    let linesCleared = 0
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1)
        newBoard.unshift(Array(BOARD_WIDTH).fill(null))
        linesCleared++
        y++
      }
    }

    setBoard(newBoard)
    setScore(prev => prev + linesCleared * 100)
    
    const newPiece = createNewPiece()
    if (checkCollision(newPiece)) {
      setGameOver(true)
    } else {
      setCurrentPiece(newPiece)
    }
  }, [currentPiece, board, createNewPiece, checkCollision])

  const moveDown = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return

    if (checkCollision(currentPiece, 0, 1)) {
      mergePiece()
    } else {
      setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 })
    }
  }, [currentPiece, checkCollision, mergePiece, isPaused, gameOver])

  const moveHorizontal = useCallback((dir: number) => {
    if (!currentPiece || isPaused || gameOver) return
    if (!checkCollision(currentPiece, dir, 0)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x + dir })
    }
  }, [currentPiece, checkCollision, isPaused, gameOver])

  const rotatePiece = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return
    const rotated = { ...currentPiece, shape: rotate(currentPiece.shape) }
    if (!checkCollision(rotated)) {
      setCurrentPiece(rotated)
    }
  }, [currentPiece, checkCollision, isPaused, gameOver])

  const drop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return
    let newY = currentPiece.y
    while (!checkCollision({ ...currentPiece, y: newY + 1 }, 0, 0)) {
      newY++
    }
    setCurrentPiece({ ...currentPiece, y: newY })
    setTimeout(mergePiece, 50)
  }, [currentPiece, checkCollision, mergePiece, isPaused, gameOver])

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createNewPiece())
    }
  }, [currentPiece, createNewPiece, gameOver])

  useEffect(() => {
    const interval = setInterval(moveDown, 1000)
    return () => clearInterval(interval)
  }, [moveDown])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return
      
      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontal(-1)
          break
        case 'ArrowRight':
          moveHorizontal(1)
          break
        case 'ArrowDown':
          moveDown()
          break
        case 'ArrowUp':
          rotatePiece()
          break
        case ' ':
          drop()
          break
        case 'p':
          setIsPaused(p => !p)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [moveHorizontal, moveDown, rotatePiece, drop, gameOver])

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} style={{ display: 'flex' }}>
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            style={{
              width: `${BLOCK_SIZE}px`,
              height: `${BLOCK_SIZE}px`,
              backgroundColor: cell ? COLORS[cell] : '#1e293b',
              border: '1px solid #334155'
            }}
          />
        ))}
      </div>
    ))
  }

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)))
    setCurrentPiece(null)
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <h1 className="text-5xl font-bold text-white mb-8">Tetris</h1>
      
      <div className="flex gap-8 items-start flex-wrap justify-center">
        <div className="bg-slate-800 p-4 rounded-lg shadow-2xl">
          <div style={{ display: 'inline-block' }}>
            {renderBoard()}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow-2xl min-w-[200px]">
          <h2 className="text-2xl font-bold text-white mb-4">Score</h2>
          <p className="text-4xl font-bold text-primary mb-8">{score}</p>

          {gameOver && (
            <div className="mb-6">
              <p className="text-xl text-red-400 font-bold mb-4">Game Over!</p>
              <button
                onClick={resetGame}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
              >
                New Game
              </button>
            </div>
          )}

          {!gameOver && (
            <button
              onClick={() => setIsPaused(p => !p)}
              className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 transition mb-4"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          <div className="text-slate-400 text-sm space-y-2 mt-8">
            <h3 className="text-white font-bold mb-2">Controls</h3>
            <p>← → : Move</p>
            <p>↓ : Soft drop</p>
            <p>↑ : Rotate</p>
            <p>Space : Hard drop</p>
            <p>P : Pause</p>
          </div>
        </div>
      </div>
    </div>
  )
}
