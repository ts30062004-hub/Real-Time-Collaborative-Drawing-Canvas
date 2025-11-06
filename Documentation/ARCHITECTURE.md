#  Architecture – Real-Time Collaborative Canvas

## Overview
Each client connects to the server via WebSocket. The server relays drawing updates to all connected clients using Socket.io.

## Data Flow
1. User draws → stroke captured in `canvas.js`
2. Client emits `draw-stroke` event
3. Server receives, stores, and broadcasts to all other clients
4. Each client updates canvas accordingly

## Undo/Redo
Server maintains two arrays: `strokes` and `undoneStrokes`. Clients synchronize based on server broadcasts.

## Future Scope
- Add per-user cursors
- Save canvas to file
- Add mobile gesture support
