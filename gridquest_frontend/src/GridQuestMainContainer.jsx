import React, { useState, useRef, useEffect } from "react";
import "./GridQuestMainContainer.css";

/**
 * Colors and constants (per requirements)
 */
const COLORS = {
  primary: "#4CAF50",
  secondary: "#FFC107",
  accent: "#2196F3",
  cellBg: "#FAFAFA",
  shadow: "#e0e0e0",
  gridBorder: "#ddd",
  cellEmpty: "#fff",
  // Piece colors use accent/secondary/primary for variety
  piece1: "#4CAF50",
  piece2: "#FFC107",
  piece3: "#2196F3",
};

const GRID_SIZE = 8;
const PIECE_SIZE = 3;
const INITIAL_SCORE = 0;

/**
 * Generate a random game piece (variety of shapes).
 */
function generateRandomPiece() {
  // Predefined Tetris/block shapes (3x3 grid for each)
  // 1: Single block, 2: line, 3: L, 4: Square, 5: zigzag, 6: corner
  const variants = [
    [[1, 0, 0], [0, 0, 0], [0, 0, 0]],
    [[1, 1, 1], [0, 0, 0], [0, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 0, 0]],
    [[1, 1, 0], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 0, 0]],
    // Add more shapes as needed
  ];
  const idx = Math.floor(Math.random() * variants.length);
  // Pick a color
  const colorOptions = [COLORS.piece1, COLORS.piece2, COLORS.piece3];
  return {
    shape: variants[idx],
    color: colorOptions[idx % colorOptions.length],
    id: Math.random().toString(36).substr(2, 8),
  };
}

/**
 * Compute if a piece fits at a specified grid position
 * without overlap.
 */
function canPlacePiece(grid, piece, gridRow, gridCol) {
  for (let r = 0; r < PIECE_SIZE; r++) {
    for (let c = 0; c < PIECE_SIZE; c++) {
      if (piece.shape[r][c]) {
        const gr = gridRow + r;
        const gc = gridCol + c;
        if (
          gr < 0 ||
          gr >= GRID_SIZE ||
          gc < 0 ||
          gc >= GRID_SIZE ||
          grid[gr][gc].filled
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Place a piece on the grid and return the new grid state.
 */
function placePieceOnGrid(grid, piece, gridRow, gridCol) {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  for (let r = 0; r < PIECE_SIZE; r++) {
    for (let c = 0; c < PIECE_SIZE; c++) {
      if (piece.shape[r][c]) {
        newGrid[gridRow + r][gridCol + c] = {
          filled: true,
          color: piece.color,
        };
      }
    }
  }
  return newGrid;
}

/**
 * Check and clear full rows/columns
 */
function clearLines(grid) {
  let cleared = 0;
  // Rows
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every((cell) => cell.filled)) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = { filled: false, color: COLORS.cellEmpty };
      }
      cleared++;
    }
  }
  // Columns
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (!grid[r][c].filled) {
        full = false;
        break;
      }
    }
    if (full) {
      for (let r = 0; r < GRID_SIZE; r++) {
        grid[r][c] = { filled: false, color: COLORS.cellEmpty };
      }
      cleared++;
    }
  }
  return { grid: grid, cleared };
}

/**
 * Check possible moves left for given grid and array of pieces.
 */
function hasMoveAvailable(grid, pieces) {
  return pieces.some((piece) => {
    for (let r = 0; r <= GRID_SIZE - PIECE_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE - PIECE_SIZE; c++) {
        if (canPlacePiece(grid, piece, r, c)) {
          return true;
        }
      }
    }
    return false;
  });
}

/**
 * Render a block piece in the Hold Box or anywhere as small block grid.
 */
function RenderPieceGrid({ piece, isDimmed, label }) {
  // piece: { shape, color }
  if (!piece) {
    return (
      <div className={"gq-piece-empty gq-holdbox-piece-empty"}>
        {label && <div className="gq-holdbox-label">{label}</div>}
      </div>
    );
  }
  return (
    <div
      className="gq-piece gq-holdbox-piece"
      style={{
        opacity: isDimmed ? 0.45 : 1,
        minWidth: 62, minHeight: 62,
        cursor: "pointer",
        boxShadow: "0 2px 8px #eed",
        background: isDimmed ? "#eee" : "var(--gq-bg-light)",
      }}
      tabIndex={0}
      draggable={false}
    >
      {piece.shape.map((row, rIdx) => (
        <div className="gq-piece-row" key={rIdx}>
          {row.map((block, cIdx) => (
            <div
              key={cIdx}
              className="gq-piece-cell"
              style={{
                backgroundColor: block ? piece.color : "transparent",
                opacity: block ? 1 : 0,
              }}
            />
          ))}
        </div>
      ))}
      {label && <div className="gq-holdbox-label">{label}</div>}
    </div>
  );
}

/**
 * No usage of PUBLIC_URL in this file.
 * If the build error persists, check index.html or script injection config.
 */
// PUBLIC_INTERFACE
function GridQuestMainContainer() {
  /**
   * Main game state hooks
   */
  const [grid, setGrid] = useState(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ filled: false, color: COLORS.cellEmpty }))
      )
  );
  const [pieces, setPieces] = useState(() => [
    generateRandomPiece(),
    generateRandomPiece(),
    generateRandomPiece(),
  ]);
  // Hold Box state: null means empty; else stores a piece object
  const [holdPiece, setHoldPiece] = useState(null);
  const [holdJustSwapped, setHoldJustSwapped] = useState(false); // restrict swap to once per pick/turn

  const [draggedPieceIdx, setDraggedPieceIdx] = useState(null);
  const [score, setScore] = useState(INITIAL_SCORE);
  const [gameOver, setGameOver] = useState(false);
  const [dropHint, setDropHint] = useState({ row: null, col: null, valid: false });

  const audioRef = useRef(null);

  // Play sound (if enabled and available)
  const playScoreSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  /**
   * Handle putting a piece into hold, or swapping with what is being held.
   * Only allowed if not just swapped (only one per "pick").
   * If hold is empty, stores selected. If already filled, swaps.
   * idx - the piece index (0,1,2) to hold/swap.
   */
  // PUBLIC_INTERFACE
  function handleHold(idx) {
    if (gameOver) return;
    if (holdJustSwapped) return; // only allow hold 1x per placement
    const selected = pieces[idx];
    if (!selected) return;
    let nextPieces;
    if (!holdPiece) {
      // Place in hold (remove from pieces)
      nextPieces = pieces.slice();
      nextPieces[idx] = null;
      setHoldPiece(selected);
    } else {
      // Swap picked with hold
      nextPieces = pieces.slice();
      nextPieces[idx] = holdPiece;
      setHoldPiece(selected);
    }
    setPieces(nextPieces);
    setDraggedPieceIdx(null);
    setHoldJustSwapped(true);
  }

  /**
   * Keyboard shortcut handler: 'H' for hold, or 1/2/3 to swap/cycle if possible.
   */
  useEffect(() => {
    function handleKeyDown(ev) {
      if (gameOver) return;
      if (
        ["h", "H"].includes(ev.key) &&
        draggedPieceIdx != null
      ) {
        handleHold(draggedPieceIdx);
      }
      if (
        ["1", "2", "3"].includes(ev.key) &&
        holdPiece != null
      ) {
        const idx = parseInt(ev.key, 10) - 1;
        if (pieces[idx]) handleHold(idx);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [draggedPieceIdx, holdPiece, pieces, gameOver]);

  /**
   * Handle Drag Start of Piece
   */
  const onPieceDragStart = (idx) => {
    setDraggedPieceIdx(idx);
  };

  /**
   * Handle Drop on Grid cell
   */
  const onGridDrop = (row, col) => {
    if (draggedPieceIdx === null) return;
    const selected = pieces[draggedPieceIdx];
    if (canPlacePiece(grid, selected, row, col)) {
      let newGrid = placePieceOnGrid(grid, selected, row, col);

      // Clear lines and update score
      const clearedResult = clearLines(newGrid);
      newGrid = clearedResult.grid;
      let scoreInc = 0;
      for (let r = 0; r < PIECE_SIZE; r++) {
        for (let c = 0; c < PIECE_SIZE; c++) {
          if (selected.shape[r][c]) scoreInc += 1;
        }
      }
      scoreInc += clearedResult.cleared * 10;

      // Remove used piece, replace with null or new set
      const newPieces = pieces.slice();
      newPieces[draggedPieceIdx] = null;
      let nextPieces = newPieces;
      let clearHoldSwap = false;
      if (newPieces.every((p) => !p)) {
        nextPieces = [
          generateRandomPiece(),
          generateRandomPiece(),
          generateRandomPiece(),
        ];
        clearHoldSwap = true;
      }

      setGrid(newGrid);
      setScore((s) => s + scoreInc);
      setPieces(nextPieces);

      setHoldJustSwapped(false); // allow swap again after piece placement
      if (clearHoldSwap) setHoldJustSwapped(false);

      playScoreSound();
      setDraggedPieceIdx(null);
      setDropHint({ row: null, col: null, valid: false });
    }
  };

  /**
   * Drag Over grid cell: for visual highlighting
   */
  const handleDragOverCell = (row, col, e) => {
    e.preventDefault();
    if (draggedPieceIdx === null) return;
    const canDrop = canPlacePiece(grid, pieces[draggedPieceIdx], row, col);
    setDropHint({ row, col, valid: canDrop });
  };

  /**
   * Drag Leave grid cell
   */
  const handleDragLeaveCell = () => {
    setDropHint({ row: null, col: null, valid: false });
  };

  /**
   * Reset grid and game, including hold
   */
  // PUBLIC_INTERFACE
  function handleRestart() {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() =>
          Array(GRID_SIZE)
            .fill(null)
            .map(() => ({ filled: false, color: COLORS.cellEmpty }))
        )
    );
    setScore(INITIAL_SCORE);
    setPieces([generateRandomPiece(), generateRandomPiece(), generateRandomPiece()]);
    setGameOver(false);
    setDraggedPieceIdx(null);
    setDropHint({ row: null, col: null, valid: false });
    setHoldPiece(null);
    setHoldJustSwapped(false);
  }

  /**
   * Game Over Detection
   */
  useEffect(() => {
    if (!hasMoveAvailable(grid, pieces.filter(Boolean))) {
      setGameOver(true);
    }
  }, [grid, pieces]);

  /**
   * Render grid cells with optional drop highlight
   */
  function renderGridCells() {
    let highlightCells = [];
    if (
      dropHint.row !== null &&
      dropHint.col !== null &&
      draggedPieceIdx !== null &&
      dropHint.valid
    ) {
      // get list of [r, c] for highlight
      for (let r = 0; r < PIECE_SIZE; r++) {
        for (let c = 0; c < PIECE_SIZE; c++) {
          if (pieces[draggedPieceIdx]?.shape[r][c]) {
            const gr = dropHint.row + r;
            const gc = dropHint.col + c;
            if (
              gr >= 0 && gr < GRID_SIZE &&
              gc >= 0 && gc < GRID_SIZE
            ) {
              highlightCells.push(gr + "-" + gc);
            }
          }
        }
      }
    }
    return (
      <div className="gq-grid">
        {grid.map((row, rIdx) => (
          <div className="gq-grid-row" key={rIdx}>
            {row.map((cell, cIdx) => {
              const highlight =
                highlightCells.includes(rIdx + "-" + cIdx) && dropHint.valid;
              return (
                <div
                  key={cIdx}
                  className={
                    "gq-grid-cell" +
                    (cell.filled ? " filled" : "") +
                    (highlight ? " drop-preview" : "")
                  }
                  style={{
                    backgroundColor: cell.filled
                      ? cell.color
                      : highlight
                        ? COLORS.accent + "55"
                        : COLORS.cellBg,
                  }}
                  onDragOver={(e) =>
                    handleDragOverCell(rIdx, cIdx, e)
                  }
                  onDragLeave={handleDragLeaveCell}
                  onDrop={() => onGridDrop(rIdx, cIdx)}
                  onDragEnter={(e) => e.preventDefault()}
                  draggable={false}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  /**
   * Render Hold Box section for holding/swapping pieces
   */
  function renderHoldBox() {
    return (
      <div className="gq-holdbox-wrapper">
        <div className={"gq-holdbox-title"}>Hold Box</div>
        <button
          className={
            "gq-holdbox-btn" +
            (holdJustSwapped || gameOver ? " disabled" : "")
          }
          tabIndex={-1}
          aria-label={holdPiece ? "Swap hold" : "Hold a piece"}
          title={
            holdJustSwapped || gameOver
              ? holdPiece
                ? "Swap (disabled this turn)"
                : "Hold (disabled this turn)"
              : holdPiece
              ? "Click a piece or here to swap"
              : "Click a piece or here to hold"
          }
          disabled={holdJustSwapped || gameOver}
          onClick={() => {
            // For accessibility: if a piece is selected, swap with hold
            if (
              !gameOver &&
              draggedPieceIdx != null &&
              pieces[draggedPieceIdx]
            ) {
              handleHold(draggedPieceIdx);
            }
          }}
          // Support drag from piece to holdbox
          onDragOver={e => {
            e.preventDefault();
          }}
          onDrop={e => {
            if (
              !gameOver &&
              draggedPieceIdx != null &&
              pieces[draggedPieceIdx]
            ) {
              handleHold(draggedPieceIdx);
            }
          }}
        >
          <RenderPieceGrid
            piece={holdPiece}
            isDimmed={holdJustSwapped || gameOver}
            label={holdPiece ? undefined : "+"}
          />
        </button>
        <div className="gq-holdbox-tip">
          {holdPiece
            ? holdJustSwapped
              ? "Swapped! Place a piece to allow swap again."
              : "Click a piece (or drag to Hold Box) to swap."
            : "Drag/tap a piece here to hold."}
        </div>
      </div>
    );
  }

  /**
   * Render draggable pieces below grid with hold button per piece
   */
  function renderAvailablePieces() {
    return (
      <div className="gq-pieces-row">
        {pieces.map((piece, idx) =>
          piece ? (
            <div
              className="gq-piece"
              key={piece.id}
              draggable={!gameOver}
              onDragStart={() => onPieceDragStart(idx)}
              onDragEnd={() => setDraggedPieceIdx(null)}
              tabIndex={0}
              aria-grabbed={draggedPieceIdx === idx}
              title="Drag to grid"
              style={{
                opacity: draggedPieceIdx === idx ? 0.5 : 1,
                cursor: gameOver ? "not-allowed" : "grab",
                outline:
                  draggedPieceIdx === idx
                    ? `2px solid ${COLORS.primary}`
                    : "none",
                position: "relative",
              }}
            >
              {piece.shape.map((row, rIdx) => (
                <div className="gq-piece-row" key={rIdx}>
                  {row.map((block, cIdx) => (
                    <div
                      key={cIdx}
                      className="gq-piece-cell"
                      style={{
                        backgroundColor: block
                          ? piece.color
                          : "transparent",
                        opacity: block ? 1 : 0,
                      }}
                    ></div>
                  ))}
                </div>
              ))}
              {/* Hold button below piece for quick hold */}
              <button
                className={
                  "gq-holdbox-smallbtn" +
                  ((holdJustSwapped || gameOver) ? " disabled" : "")
                }
                onClick={e => {
                  e.stopPropagation();
                  handleHold(idx);
                }}
                aria-label="Hold this piece"
                tabIndex={-1}
                disabled={holdJustSwapped || gameOver}
                title={
                  holdJustSwapped || gameOver
                    ? "Hold/Swap disabled"
                    : holdPiece
                      ? "Swap with hold"
                      : "Hold"
                }
              >
                {holdPiece ? <>&#8645;</> : "+"}
              </button>
            </div>
          ) : (
            <div className="gq-piece-empty" key={idx}></div>
          )
        )}
      </div>
    );
  }

  /**
   * Game Over Dialog
   */
  const renderGameOver = () =>
    gameOver ? (
      <div className="gq-gameover-modal">
        <div className="gq-gameover-content">
          <div className="gq-go-title">Game Over</div>
          <div className="gq-go-score">Final Score: {score}</div>
          <button className="gq-btn gq-restart-btn" onClick={handleRestart}>
            Restart
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="gq-main-container">
      {/* Audio element with graceful fallback and source validation */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: "none" }}
      >
        <source src="https://cdn.pixabay.com/audio/2022/07/26/audio_124b6b2a7c.mp3" type="audio/mpeg" />
        {/* Fallback text in case audio cannot be played */}
        Your browser does not support the audio element.
      </audio>
      <div className="gq-header">
        <h2 className="gq-title">
          <span style={{ color: COLORS.primary }}>Grid</span>
          <span style={{ color: COLORS.accent }}>Quest</span>
        </h2>
        <div
          className="gq-score"
          style={{
            background: COLORS.secondary,
            color: COLORS.primary,
            borderColor: COLORS.accent,
          }}
        >
          Score: <span className="gq-score-val">{score}</span>
        </div>
      </div>

      <div className="gq-toprow-flex">
        <div className="gq-game-area">{renderGridCells()}</div>
        {renderHoldBox()}
      </div>
      <div className="gq-pieces-area">{renderAvailablePieces()}</div>
      {renderGameOver()}
    </div>
  );
}

export default GridQuestMainContainer;
