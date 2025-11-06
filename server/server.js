// server.js
// ==========================================
// SERVER-SIDE LOGIC FOR REAL-TIME COLLABORATIVE CANVAS
// ==========================================
// This Node.js server uses Express to serve the frontend and Socket.IO
// to handle real-time, bidirectional communication between clients.
// It maintains global stroke and redo stacks to synchronize drawing data
// across all connected users in real time.
// ==========================================

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// --------------------
// SETUP EXPRESS + SOCKET SERVER
// --------------------
const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve the static client files (HTML, JS, CSS)
app.use(express.static("../client"));

// --------------------
// GLOBAL CANVAS STATE
// These arrays hold all strokes and redo data
// shared among all connected clients.
// --------------------
let strokes = [];         // Stores all drawn strokes (lines, shapes, text)
let undoneStrokes = [];   // Stores undone strokes for redo functionality

// --------------------
// SOCKET.IO CONNECTION HANDLERS
// Triggered each time a new client connects to the server
// --------------------
io.on("connection", (socket) => {
    console.log("🟢 User connected");
    io.emit("update-users", io.engine.clientsCount); // Broadcast current user count

    // Send the existing canvas data to the newly connected user
    socket.emit("load-canvas", { strokes, undoneStrokes });

    // ==========================================
    // EVENT: draw-stroke
    // Received when a user finishes drawing a stroke.
    // The server stores it and broadcasts it to all others.
    // ==========================================
    socket.on("draw-stroke", (stroke) => {
        strokes.push(stroke); // Save new stroke to global array
        socket.broadcast.emit("draw-stroke", stroke); // Send to other users
    });

    // ==========================================
    // EVENT: undo-request
    // Removes the last stroke from the global stack
    // and stores it in the redo stack for potential restoration.
    // ==========================================
    socket.on("undo-request", () => {
        if (strokes.length > 0) {
            const popped = strokes.pop(); // Remove last stroke
            undoneStrokes.push(popped);   // Save for redo
        }
        // Notify all clients of updated canvas state
        io.emit("update-undo", { strokes, undoneStrokes });
    });

    // ==========================================
    // EVENT: redo-request
    // Restores the last undone stroke back to the canvas.
    // ==========================================
    socket.on("redo-request", () => {
        if (undoneStrokes.length > 0) {
            const restored = undoneStrokes.pop(); // Retrieve last undone stroke
            strokes.push(restored);               // Add back to canvas
        }
        // Notify all clients of updated canvas state
        io.emit("update-redo", { strokes, undoneStrokes });
    });

    // ==========================================
    // EVENT: clear-canvas
    // Completely resets the shared canvas across all clients.
    // ==========================================
    socket.on("clear-canvas", () => {
        strokes = [];
        undoneStrokes = [];
        io.emit("clear-canvas"); // Notify all connected users
    });

    // ==========================================
    // EVENT: disconnect
    // Triggered when a user leaves; updates the user count display.
    // ==========================================
    socket.on("disconnect", () => {
        console.log("🔴 User disconnected");
        io.emit("update-users", io.engine.clientsCount);
    });
});

// --------------------
// START SERVER
// --------------------
server.listen(3000, () => {
    console.log("✅ Server running at http://localhost:3000");
});
