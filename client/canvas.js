// ================================
// 🎨 canvas.js
// Core drawing logic for the collaborative whiteboard.
// Handles user drawing, shapes, text input, and rendering.
// Communicates strokes to the server using websocket.js.
// ================================

import { sendStroke } from "./websocket.js";  // Import for sending finalized strokes to the server

// Arrays for storing all strokes and undone strokes (used for undo/redo)
export let strokes = [];
export let undoneStrokes = [];

// Get canvas and its 2D drawing context
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

// Set canvas dimensions to fill the browser window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Drawing state variables
let drawing = false;
let currentStroke = [];
let startX, startY;   // Starting coordinates for shapes
let color = "#1e3a8a"; // Default brush color
let size = 5;          // Default brush size
let tool = "brush";    // Default tool

// Active text input element (for text tool)
let activeTextInput = null;

// === Setter functions for tool, color, and brush size ===
export function setColor(c) { color = c; }
export function setSize(s) { size = s; }
export function setTool(t) { tool = t; }

// === Mouse Event Listeners ===
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseout", () => drawing = false);

// Utility: get mouse position relative to the canvas
function getPos(e) { return { x: e.clientX, y: e.clientY }; }

// === Start Drawing ===
function startDraw(e) {
    drawing = true;
    const { x, y } = getPos(e);
    startX = x;
    startY = y;
    currentStroke = [{ x, y }];
}

// === Draw While Moving ===
function draw(e) {
    if (!drawing) return;
    const { x, y } = getPos(e);

    if (tool === "brush" || tool === "eraser") {
        // Freehand drawing (brush or eraser)
        currentStroke.push({ x, y });
        drawCurrentStroke();
    } else if (tool !== "text") {
        // Shape drawing (line, rect, circle)
        drawAll(); // Redraw all strokes to clear old previews
        drawShape(tool, startX, startY, x, y, color, size);
    }
}

// === Draw the currently active freehand stroke ===
function drawCurrentStroke() {
    drawAll(); // Redraw previous strokes before showing new one
    if (currentStroke.length < 2) return;

    ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
    ctx.lineWidth = size;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }
    ctx.stroke();
}

// === Stop Drawing and Save Stroke ===
function endDraw(e) {
    if (!drawing) return;
    drawing = false;

    // Finalize freehand strokes
    if (tool === "brush" || tool === "eraser") {
        strokes.push({ color, size, tool, points: [...currentStroke] });
        currentStroke = [];
        sendStroke(strokes[strokes.length - 1]);  // Broadcast to others
    } 
    // Finalize shapes
    else if (tool !== "text") {
        const { x, y } = getPos(e);
        strokes.push({ color, size, tool, startX, startY, endX: x, endY: y });
        sendStroke(strokes[strokes.length - 1]);
    }

    // Clear redo stack (new action invalidates future redos)
    undoneStrokes.length = 0;
}

// =======================================
// 🅰️ TEXT TOOL — Add Text on Canvas
// =======================================
canvas.addEventListener("click", (e) => {
    if (tool !== "text") return;

    // Remove any existing text input if active
    if (activeTextInput) {
        if (activeTextInput.parentNode?.contains(activeTextInput)) {
            activeTextInput.remove();
        }
        activeTextInput = null;
    }

    const { x, y } = getPos(e);

    // Create temporary HTML input box at the click position
    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = x + "px";
    input.style.top = y + "px";
    input.style.fontSize = size * 3 + "px";
    input.style.color = color;
    input.style.border = "1px solid #333";
    input.style.background = "transparent";
    input.style.zIndex = 1000;

    document.body.appendChild(input);
    input.focus();
    activeTextInput = input;

    // Function to finalize and render text
    const finishText = () => {
        if (input.value.trim() !== "") {
            // Save text as a stroke for undo/redo
            strokes.push({
                tool: "text",
                text: input.value,
                x,
                y,
                color,
                size
            });
            undoneStrokes.length = 0;
            drawAll();
            sendStroke(strokes[strokes.length - 1]);  // Send to others
        }
        // Safely remove input element
        if (input.parentNode?.contains(input)) {
            input.remove();
        }
        activeTextInput = null;
    };

    // Finalize text on Enter or blur
    input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") finishText();
    });
    input.addEventListener("blur", finishText);
});

// =======================================
// 🔁 Redraw all saved strokes on canvas
// =======================================
export function drawAll() {
    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset to default drawing state to prevent artifacts
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;

    // Iterate over every saved stroke
    for (let s of strokes) {
        if (s.tool === "brush" || s.tool === "eraser") {
            // Redraw freehand strokes
            ctx.strokeStyle = s.tool === "eraser" ? "#fff" : s.color;
            ctx.lineWidth = s.size;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.beginPath();
            s.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        } 
        else if (s.tool === "text") {
            // Render text with solid color
            ctx.fillStyle = s.color;
            ctx.font = `${s.size * 3}px Arial`;
            ctx.fillText(s.text, s.x, s.y);
        } 
        else {
            // Redraw shapes
            drawShape(s.tool, s.startX, s.startY, s.endX, s.endY, s.color, s.size);
        }
    }
}

// =======================================
// 🧩 Helper: Draw basic shapes
// =======================================
function drawShape(tool, x1, y1, x2, y2, color, size) {
    ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
    ctx.lineWidth = size;
    ctx.beginPath();

    if (tool === "line") {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    } else if (tool === "rect") {
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
    } else if (tool === "circle") {
        const r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        ctx.arc(x1, y1, r, 0, Math.PI * 2);
    }
    ctx.stroke();
}
