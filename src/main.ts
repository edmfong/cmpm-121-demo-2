import "./style.css";

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
buttonContainer.id = "buttonContainer"; // Optional: Give the div an ID for styling or future reference
app.append(buttonContainer); // Append the div to your main app container

// Interface for storing actions for buttons
interface Actions {
    name: string;
    button: HTMLButtonElement | null;
    onClick: () => void;
}

const buttons: Actions[] = [
    {
        name: "undo",
        button: null,
        onClick: undoCanvas,
    },
    {
        name: "redo",
        button: null,
        onClick: redoCanvas,
    },
    {
        name: "clear",
        button: null,
        onClick: clearCanvas,
    },
    {
        name: "export",
        button: null,
        onClick: exportCanvas,
    },
];

// Variables for drawing state
let isDrawing = false;
let x = 0;
let y = 0;
let currentStroke: Array<{ x: number, y: number }> = []; // Store current stroke points
let displayList: Array<Array<{ x: number, y: number }>> = []; // Stack for complete strokes
let redoStack: Array<Array<{ x: number, y: number }>> = []; // Stack for redo states

// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
    currentStroke = [{ x, y }]; // Start a new array of points for the current stroke
});

// Function to draw on the canvas
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        x = e.offsetX;
        y = e.offsetY;
        currentStroke.push({ x, y }); // Save the new point in the current stroke
        dispatchDrawingChanged(); // Dispatch the event
    }
});

globalThis.addEventListener("mouseup", (e) => {
    if (isDrawing) {
        x = e.offsetX;
        y = e.offsetY;
        currentStroke.push({ x, y }); // Save the last point in the current stroke
        displayList.push(currentStroke); // Save the completed stroke
        currentStroke = []; // Clear the current stroke for the next drawing
        redrawFromDisplayList(); // Redraw all strokes
        isDrawing = false;
    }
});

// Dispatch a custom event to notify observers of drawing changes
function dispatchDrawingChanged() {
    const event = new CustomEvent("drawing-changed", { detail: currentStroke });
    canvas.dispatchEvent(event);
}

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", (event) => {
    const points = (event as CustomEvent).detail; // Assert event as CustomEvent
    redrawCanvas(points);
});

// Function to redraw the canvas based on the stored points
function redrawCanvas(points: Array<{ x: number, y: number }>) {
    if (points.length < 2) return;
    context!.beginPath();
    context!.strokeStyle = "black";
    context!.lineWidth = 1;
    context!.moveTo(points[0].x, points[0].y);
    for (const point of points) {
        context!.lineTo(point.x, point.y);
    }
    context!.stroke();
    context!.closePath();
}

// Create the action buttons and associated elements
function createActionButton(index: number) {
    // Create button
    const action = buttons[index];
    const actionButton = document.createElement("button");
    actionButton.textContent = action.name;
    actionButton.addEventListener("click", action.onClick);

    buttonContainer.append(actionButton);

    // Store references in the action data
    action.button = actionButton;
}

// Initialize action buttons
buttons.forEach((_, index) => {
    createActionButton(index);
});

// Function to handle undo action
function undoCanvas() {
    if (displayList.length > 0) {
        const lastStroke = displayList.pop(); // Get the last drawn stroke
        if (lastStroke) {
            redoStack.push(lastStroke); // Push to redo stack
        }
        redrawFromDisplayList(); // Redraw all remaining strokes
    }
}

// Function to handle redo action
function redoCanvas() {
    if (redoStack.length > 0) {
        const strokeToRedo = redoStack.pop(); // Get the last undone stroke
        if (strokeToRedo) {
            displayList.push(strokeToRedo); // Push to display list
        }
        redrawFromDisplayList(); // Redraw all strokes including the redone stroke
    }
}

// Helper function to redraw the canvas from displayList
function redrawFromDisplayList() {
    context!.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    context!.fillStyle = 'white'; // Set fill color
    context!.fillRect(0, 0, canvas.width, canvas.height); // Fill background
    // Redraw all previous strokes
    displayList.forEach(stroke => redrawCanvas(stroke)); // Redraw all strokes
}

// Clear canvas function
function clearCanvas() {
    context!.clearRect(0, 0, canvas.width, canvas.height);
    context!.fillStyle = 'white'; // Set fill color
    context!.fillRect(0, 0, 256, 256);
    displayList = []; // Clear display list
    redoStack = []; // Clear redo stack
}

// Export function (not implemented)
function exportCanvas() {
    // Export functionality
}
