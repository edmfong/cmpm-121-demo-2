import "./style.css";
import { Stroke } from "./stroke.ts"; // Import the MarkerLine class

const APP_NAME = "Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Create title
const h1: HTMLElement = document.createElement('h1');
h1.textContent = 'Sketchpad';
app.appendChild(h1);

// Create canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

// Fill in canvas with white background
const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
context!.clearRect(0, 0, canvas.width, canvas.height);
context!.fillStyle = 'white'; // Set fill color
context!.fillRect(0, 0, 256, 256);

// Create a div to store the buttons
const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";
app.append(buttonContainer);

// Variables for drawing state
let isDrawing = false;
let x = 0;
let y = 0;
let currentStroke: Stroke | null = null; // Use MarkerLine instance
let displayList: Stroke[] = [];
let redoStack: Stroke[] = [];

// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
    currentStroke = new Stroke(x, y); // Start a new MarkerLine
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && currentStroke) {
        x = e.offsetX;
        y = e.offsetY;
        currentStroke.drag(x, y); // Add points to the stroke

        // Redraw to show the current stroke while dragging
        redrawFromDisplayList(); // Redraw all existing strokes
        currentStroke.display(context!); // Display the current stroke
    }
});


globalThis.addEventListener("mouseup", () => {
    if (isDrawing && currentStroke) {
        displayList.push(currentStroke); // Add the completed stroke to the display list
        currentStroke = null; // Reset current stroke
        redrawFromDisplayList(); // Redraw all strokes
        isDrawing = false;
    }
});

// Helper function to redraw the canvas
function redrawFromDisplayList() {
    context!.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    context!.fillStyle = 'white'; // Set fill color
    context!.fillRect(0, 0, canvas.width, canvas.height); // Fill background
    displayList.forEach(stroke => stroke.display(context!)); // Redraw all strokes
}

// Create buttons for undo, redo, clear, and export
const buttons: { name: string, onClick: () => void }[] = [
    { name: "undo", onClick: undoCanvas },
    { name: "redo", onClick: redoCanvas },
    { name: "clear", onClick: clearCanvas },
    { name: "export", onClick: exportCanvas }
];

// Create buttons
buttons.forEach(({ name, onClick }) => {
    const button = document.createElement("button");
    button.textContent = name;
    button.addEventListener("click", onClick);
    buttonContainer.appendChild(button);
});

// Undo functionality
function undoCanvas() {
    if (displayList.length > 0) {
        const lastStroke = displayList.pop();
        if (lastStroke) {
            redoStack.push(lastStroke);
        }
        redrawFromDisplayList();
    }
}

// Redo functionality
function redoCanvas() {
    if (redoStack.length > 0) {
        const strokeToRedo = redoStack.pop();
        if (strokeToRedo) {
            displayList.push(strokeToRedo);
        }
        redrawFromDisplayList();
    }
}

// Clear the canvas
function clearCanvas() {
    context!.clearRect(0, 0, canvas.width, canvas.height);
    context!.fillStyle = 'white'; // Set fill color
    context!.fillRect(0, 0, canvas.width, canvas.height);
    displayList = [];
    redoStack = [];
}

// Export canvas (placeholder function)
function exportCanvas() {
    console.log("Export functionality not implemented yet");
}
