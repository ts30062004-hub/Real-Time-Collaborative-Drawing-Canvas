// websocket.js
// ==========================
// This module handles all WebSocket communication between the client and the server
// using Socket.IO. It synchronizes drawing actions (strokes, undo, redo, clear) and
// keeps track of the number of users connected in real-time.
// ==========================

import { strokes, undoneStrokes, drawAll } from "./canvas.js";
export const socket = io(); // Establish connection with the server via Socket.IO

// ==========================
// When a new user joins, the server sends the current canvas state.
// The client replaces its local state with that data.
// ==========================
socket.on("load-canvas", (data) => {
    // Safety: clear arrays before updating (avoids duplication)
    strokes.length = 0;
    strokes.push(...(data?.strokes || []));
    undoneStrokes.length = 0;
    undoneStrokes.push(...(data?.undoneStrokes || []));
    drawAll(); // Re-render the canvas with updated strokes
});

// ==========================
// When another user draws a new stroke, this event updates all clients.
// ==========================
socket.on("draw-stroke", (stroke) => {
    strokes.push(stroke); // Add the new stroke to the canvas history
    drawAll(); // Re-render with the new stroke
});

// ==========================
// When someone clears the entire canvas, this resets everyone's canvas.
// ==========================
socket.on("clear-canvas", () => {
    strokes.length = 0;
    undoneStrokes.length = 0;
    drawAll();
});

// ==========================
// Updates the number of online users in real-time.
// ==========================
socket.on("update-users", (count) => {
    document.getElementById("userCount").textContent = `👥 ${count} users online`;
});

// ==========================
// Undo operation broadcasted by the server (syncs all clients).
// ==========================
socket.on("update-undo", (data) => {
    strokes.length = 0;
    strokes.push(...(data?.strokes || []));
    undoneStrokes.length = 0;
    undoneStrokes.push(...(data?.undoneStrokes || []));
    drawAll(); // Redraw after undo
});

// ==========================
// Redo operation broadcasted by the server (syncs all clients).
// ==========================
socket.on("update-redo", (data) => {
    strokes.length = 0;
    strokes.push(...(data?.strokes || []));
    undoneStrokes.length = 0;
    undoneStrokes.push(...(data?.undoneStrokes || []));
    drawAll(); // Redraw after redo
});

// ==========================
// Helper functions to emit user actions to the server.
// ==========================

// Send a completed stroke (line, brush, shape, or text)
export function sendStroke(stroke) { 
    socket.emit("draw-stroke", stroke); 
}

// Request to clear the entire canvas for all users
export function clearCanvas() { 
    socket.emit("clear-canvas"); 
}

// Request an undo operation (handled by the server)
export function undoStroke() { 
    socket.emit("undo-request"); 
}

// Request a redo operation (handled by the server)
export function redoStroke() { 
    socket.emit("redo-request"); 
}
