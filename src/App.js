import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const MAZE = [
  '.........',
  '.###.###.',
  '...#.....',
  '#..#.###.',
  '#....#...',
  '.###.#.#.',
  '.......#.',
  '.#####.#.',
  '.........',
];

const START = { row: 0, col: 0 };
const EXIT = { row: 8, col: 8 };
const KEYS = [
  { row: 0, col: 6, label: 'Moonstone', color: 'violet' },
  { row: 4, col: 2, label: 'Sunstone', color: 'gold' },
  { row: 8, col: 4, label: 'Starstone', color: 'blue' },
];
const DIRECTIONS = {
  ArrowUp: [-1, 0],
  w: [-1, 0],
  W: [-1, 0],
  ArrowDown: [1, 0],
  s: [1, 0],
  S: [1, 0],
  ArrowLeft: [0, -1],
  a: [0, -1],
  A: [0, -1],
  ArrowRight: [0, 1],
  d: [0, 1],
  D: [0, 1],
};

function Icon({ name, size = 18 }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
    rotate: <><path d="M20 7v5h-5" /><path d="M20 12a8 8 0 1 1-2.3-5.6L20 9" /></>,
    light: <><path d="M9 18h6m-5 4h4" /><path d="M8.2 14.5A7 7 0 1 1 15.8 14.5c-.9.7-1.3 1.6-1.5 2.5h-4.6c-.2-.9-.6-1.8-1.5-2.5Z" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    steps: <><path d="M4 18h5v-5h5V8h6" /><path d="M16 5h4v4" /></>,
    crown: <><path d="m2 8 5 4 5-7 5 7 5-4-2 11H4L2 8Z" /><path d="M4 22h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function findHint(position, collected) {
  const queue = [{ ...position, firstStep: null }];
  const visited = new Set([`${position.row},${position.col}`]);
  const targets = collected.size === KEYS.length
    ? [EXIT]
    : KEYS.filter((key) => !collected.has(`${key.row},${key.col}`));

  while (queue.length) {
    const current = queue.shift();
    if (targets.some((target) => target.row === current.row && target.col === current.col)) {
      return current.firstStep;
    }
    for (const [key, [rowDelta, colDelta]] of Object.entries(DIRECTIONS).filter(([key]) => key.startsWith('Arrow'))) {
      const row = current.row + rowDelta;
      const col = current.col + colDelta;
      const cell = `${row},${col}`;
      if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length || MAZE[row][col] === '#' || visited.has(cell)) continue;
      visited.add(cell);
      queue.push({
        row,
        col,
        firstStep: current.firstStep || { row: rowDelta, col: colDelta, key },
      });
    }
  }
  return null;
}

function App() {
  const [player, setPlayer] = useState(START);
  const [collected, setCollected] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [won, setWon] = useState(false);

  const keysRemaining = KEYS.length - collected.size;
  const move = useCallback((rowDelta, colDelta) => {
    if (won) return;
    const row = player.row + rowDelta;
    const col = player.col + colDelta;
    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length || MAZE[row][col] === '#') return;
    setPlayer({ row, col });
    setMoves((count) => count + 1);
    setHint(null);
    const keyId = `${row},${col}`;
    if (KEYS.some((key) => key.row === row && key.col === col)) {
      setCollected((previous) => new Set(previous).add(keyId));
    }
    if (row === EXIT.row && col === EXIT.col && collected.size === KEYS.length) setWon(true);
  }, [player, collected.size, won]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = DIRECTIONS[event.key];
      if (direction) {
        event.preventDefault();
        if (!won) move(...direction);
      }
      if (event.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, won]);

  useEffect(() => {
    if (won) return undefined;
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [won]);

  const hintLabel = useMemo(() => {
    if (!hint) return '';
    if (hint.row < 0) return 'UP';
    if (hint.row > 0) return 'DOWN';
    if (hint.col < 0) return 'LEFT';
    return 'RIGHT';
  }, [hint]);

  const restart = () => {
    setPlayer(START);
    setCollected(new Set());
    setMoves(0);
    setElapsed(0);
    setHint(null);
    setWon(false);
  };

  const giveHint = () => {
    const nextStep = findHint(player, collected);
    setHint(nextStep);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="Lumen Lab home">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">LUMEN<span>LAB</span></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> PUZZLE NO. 001 <span className="topbar-divider">/</span> THE FIRST LIGHT</div>
        <button className="icon-button help-button" type="button" onClick={() => setShowGuide(true)} aria-label="Open how to play">
          <span>?</span>
        </button>
      </header>

      <section className="game-layout" id="game">
        <div className="game-main">
          <div className="eyebrow"><span>AN ATMOSPHERIC MAZE</span><span className="eyebrow-line" /></div>
          <div className="title-row">
            <div>
              <h1>Find your way<br /><span>back to the light.</span></h1>
              <p className="subtitle">A quiet little maze. Three lost stars. One way home.</p>
            </div>
            <div className="level-badge"><span>01</span><small>CHAPTER</small></div>
          </div>

          <div className="scene-frame">
            <div className="scene-topline">
              <span><span className="scene-indicator" /> MAZE 01 <span className="scene-slash">/</span> THE GARDEN</span>
              <span className="scene-coordinates">{String(player.col + 1).padStart(2, '0')} : {String(player.row + 1).padStart(2, '0')}</span>
            </div>
            <div className="scene">
              <div className="scene-glow scene-glow-one" />
              <div className="scene-glow scene-glow-two" />
              <div className="star-field" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="maze-board" role="grid" aria-label="Three-dimensional maze. Use arrow keys or WASD to move.">
                {MAZE.flatMap((line, row) => line.split('').map((cell, col) => {
                  const isPlayer = player.row === row && player.col === col;
                  const key = KEYS.find((item) => item.row === row && item.col === col);
                  const isExit = EXIT.row === row && EXIT.col === col;
                  const isCollected = key && collected.has(`${row},${col}`);
                  const onHint = hint && player.row + hint.row === row && player.col + hint.col === col;
                  const classes = ['maze-cell', cell === '#' ? 'wall-cell' : 'path-cell'];
                  if (isPlayer) classes.push('player-cell');
                  if (onHint) classes.push('hint-cell');
                  return (
                    <div
                      className={classes.join(' ')}
                      key={`${row}-${col}`}
                      role="gridcell"
                      aria-label={cell === '#' ? 'Wall' : `${row + 1}, ${col + 1}${isPlayer ? ', your position' : ''}${key && !isCollected ? `, ${key.label}` : ''}${isExit ? ', exit' : ''}`}
                    >
                      {cell === '#' && <span className="wall-block" />}
                      {key && !isCollected && <span className={`key-crystal ${key.color}`} aria-label={key.label}><span /></span>}
                      {isExit && <span className={`exit-gate ${keysRemaining ? 'is-locked' : 'is-open'}`}><span /></span>}
                      {isPlayer && <span className="player-orb"><i /><b /></span>}
                    </div>
                  );
                }))}
              </div>
              <span className="scene-corner corner-tl" />
              <span className="scene-corner corner-br" />
              {won && (
                <div className="win-overlay" role="status">
                  <div className="win-card">
                    <span className="win-icon"><Icon name="crown" size={23} /></span>
                    <span className="win-kicker">THE GARDEN REMEMBERS</span>
                    <h2>You found the light.</h2>
                    <p>{formatTime(elapsed)} <span>·</span> {moves} steps</p>
                    <button className="play-again-button" type="button" onClick={restart}>WANDER AGAIN <Icon name="arrow" size={16} /></button>
                  </div>
                </div>
              )}
            </div>
            <div className="scene-caption">
              <span><i /> {keysRemaining ? `${keysRemaining} STARS LEFT TO FIND` : 'THE EXIT IS OPEN — FIND THE GATE'}</span>
              <span className="caption-tip">DRAG YOURSELF TOWARD THE LIGHT</span>
            </div>
          </div>

          <div className="bottom-bar">
            <div className="controls-hint">
              <span className="keycap">↑</span>
              <span className="keycap">←</span><span className="keycap">↓</span><span className="keycap">→</span>
              <span className="controls-label">MOVE AROUND</span>
            </div>
            <button className="text-button" type="button" onClick={restart}><Icon name="rotate" size={15} /> START OVER</button>
          </div>
        </div>

        <aside className="game-sidebar" aria-label="Game information">
          <div className="sidebar-top">
            <div className="side-heading"><span className="side-heading-icon"><Icon name="compass" size={15} /></span><span>YOUR JOURNEY</span></div>
            <span className="status-pill"><i /> IN PROGRESS</span>
          </div>

          <div className="objective-card">
            <span className="card-overline">THE QUEST</span>
            <h2>Gather the<br />lost stars.</h2>
            <p>Find all three star keys to awaken the exit. The garden will show you the way.</p>
            <div className="quest-progress"><div><span>YOUR PROGRESS</span><b>{collected.size}<i> / 3</i></b></div><span className="progress-track"><i style={{ width: `${(collected.size / 3) * 100}%` }} /></span></div>
          </div>

          <div className="collectibles-section">
            <div className="section-title"><span>STAR KEYS</span><span>{collected.size} <i>/</i> 3</span></div>
            <div className="collectible-list">
              {KEYS.map((key, index) => {
                const found = collected.has(`${key.row},${key.col}`);
                return (
                  <div className={`collectible ${found ? 'found' : ''}`} key={key.label}>
                    <span className={`collectible-icon ${key.color}`}><span /></span>
                    <span className="collectible-name"><b>{key.label}</b><small>{found ? 'FOUND · GLOWING' : 'SOMEWHERE IN THE GARDEN'}</small></span>
                    {found ? <span className="found-check">✓</span> : <span className="collectible-number">0{index + 1}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-cell"><span className="stat-icon"><Icon name="clock" size={15} /></span><span className="stat-copy"><small>TIME</small><b>{formatTime(elapsed)}</b></span></div>
            <span className="stat-divider" />
            <div className="stat-cell"><span className="stat-icon"><Icon name="steps" size={15} /></span><span className="stat-copy"><small>STEPS</small><b>{String(moves).padStart(2, '0')}</b></span></div>
          </div>

          <button className={`hint-button ${hint ? 'hint-active' : ''}`} type="button" onClick={giveHint} disabled={won}>
            <span className="hint-icon"><Icon name="light" size={18} /></span>
            <span className="hint-copy"><b>{hint ? `Try going ${hintLabel.toLowerCase()}` : 'Need a little light?'}</b><small>{hint ? 'ONE STEP CLOSER TO A STAR' : 'GET A GENTLE NUDGE'}</small></span>
            <Icon name="arrow" size={16} />
          </button>

          <div className="mobile-controls" aria-label="Movement controls">
            <button type="button" onClick={() => move(-1, 0)} aria-label="Move up">↑</button>
            <div><button type="button" onClick={() => move(0, -1)} aria-label="Move left">←</button><button type="button" onClick={() => move(1, 0)} aria-label="Move down">↓</button><button type="button" onClick={() => move(0, 1)} aria-label="Move right">→</button></div>
          </div>

          <button className="how-to-button" type="button" onClick={() => setShowGuide(true)}><span>HOW TO PLAY</span><span>↗</span></button>
        </aside>
      </section>

      <footer className="footer"><span>MADE FOR THE JOY OF GETTING A LITTLE LOST</span><span>TAKE YOUR TIME <i>✳</i></span></footer>

      {showGuide && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowGuide(false)}>
          <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowGuide(false)} aria-label="Close instructions"><Icon name="close" /></button>
            <span className="card-overline">A NOTE BEFORE YOU WANDER</span>
            <h2 id="guide-title">How to play</h2>
            <p>Find the three glowing star keys hidden throughout the garden. Once you have them all, make your way to the exit in the far corner.</p>
            <div className="guide-control"><span className="keycap">↑</span><span className="keycap">←</span><span className="keycap">↓</span><span className="keycap">→</span><span>Use arrow keys or WASD to move</span></div>
            <p className="guide-note">The little light bulb offers a gentle nudge if you need one. There is no rush here.</p>
            <button className="play-again-button guide-start" type="button" onClick={() => setShowGuide(false)}>LET'S WANDER <Icon name="arrow" size={16} /></button>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
