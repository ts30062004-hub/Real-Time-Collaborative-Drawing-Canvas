// main.js
// ==========================================
// This script manages the **toolbar and UI interactions** for the collaborative canvas app.
// It connects user interface elements (buttons, sliders, color pickers) with the drawing logic
// from canvas.js and the real-time synchronization from websocket.js.
// ==========================================

import { strokes, undoneStrokes, setColor, setSize, setTool, drawAll } from "./canvas.js";
import { sendStroke, clearCanvas, undoStroke, redoStroke, socket } from "./websocket.js";

document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Tool Buttons - for selecting drawing modes
    // ===============================
    const brushBtn = document.getElementById("brushBtn");   // Freehand drawing
    const eraserBtn = document.getElementById("eraserBtn"); // Erases parts of the canvas
    const lineBtn = document.getElementById("lineBtn");     // Straight line tool
    const rectBtn = document.getElementById("rectBtn");     // Rectangle shape
    const circleBtn = document.getElementById("circleBtn"); // Circle shape
    const textBtn = document.getElementById("textBtn");     // Text insertion tool

    // ===============================
    // Color & Brush Size Controls
    // ===============================
    const colorPicker = document.getElementById("colorPicker"); // Color selector input
    const sizeSlider = document.getElementById("sizeSlider");   // Brush size adjustment

    // ===============================
    // Canvas Action Buttons
    // ===============================
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    const clearBtn = document.getElementById("clearBtn");

    // ===============================
    // TOOL SELECTION HANDLERS
    // Each button changes the active drawing mode.
    // ===============================
    brushBtn.onclick = () => setTool("brush");
    eraserBtn.onclick = () => setTool("eraser");
    lineBtn.onclick = () => setTool("line");
    rectBtn.onclick = () => setTool("rect");
    circleBtn.onclick = () => setTool("circle");
    textBtn.onclick = () => setTool("text");

    // ===============================
    // COLOR & SIZE CHANGE HANDLERS
    // Updates current brush color and stroke thickness.
    // ===============================
    colorPicker.onchange = (e) => setColor(e.target.value);
    sizeSlider.oninput = (e) => setSize(parseInt(e.target.value));

    // ===============================
    // UNDO ACTION
    // Requests the server to undo the last stroke globally.
    // (Server emits `update-undo` event back to all clients)
    // ===============================
    undoBtn.onclick = () => {
        undoStroke();  // Request undo from the server
    };

    // ===============================
    // REDO ACTION
    // Requests the server to redo the previously undone stroke.
    // (Server emits `update-redo` event back to all clients)
    // ===============================
    redoBtn.onclick = () => {
        redoStroke();  // Request redo from the server
    };

    // ===============================
    // CLEAR CANVAS ACTION
    // Wipes all drawings locally and sends a clear event to the server
    // so that all connected clients reset together.
    // ===============================
    clearBtn.onclick = () => {
        // Clear local canvas data
        strokes.length = 0;
        undoneStrokes.length = 0;
        drawAll();
        // Notify the server to broadcast a clear command
        clearCanvas();
    };

    // NOTE:
    // No need for global mouseup listeners here since
    // canvas.js already handles finalizing and sending strokes.
});
