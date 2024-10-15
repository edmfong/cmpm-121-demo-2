import "./style.css";

const APP_NAME = "Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// create title
const h1: HTMLElement = document.createElement('h1');
h1.textContent = 'Sketchpad';
app.appendChild(h1);

// create canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

// fill in canvas with white background
const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
clearCanvas();

// Create a div to store the buttons
const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer"; // Optional: Give the div an ID for styling or future reference
app.append(buttonContainer); // Append the div to your main app container

// interface for storing actions for buttons
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
]

// variables for drawing state
let isDrawing = false;
let x = 0;
let y = 0;
let points: Array<{ x: number, y: number }> = [];

// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
    points = [{ x, y }]; // Start a new array of points
});

// Function to draw on the canvas
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        x = e.offsetX;
        y = e.offsetY;
        points.push({ x, y }); // Save the new point
        dispatchDrawingChanged(); // Dispatch the event
    }
});

globalThis.addEventListener("mouseup", (e) => {
    if (isDrawing) {
        x = e.offsetX;
        y = e.offsetY;
        points.push({ x, y }); // Save the last point
        dispatchDrawingChanged(); // Dispatch the event
        isDrawing = false;
    }
});

// Dispatch a custom event to notify observers of drawing changes
function dispatchDrawingChanged() {
    const event = new CustomEvent("drawing-changed", { detail: points });
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

// Create the upgrade buttons and associated elements
function createActionButton(index: number) {
    // create button
    const action = buttons[index];
    const actionButton = document.createElement("button");
    actionButton.textContent = action.name;
    actionButton.addEventListener("click", action.onClick);

    // upgradeButton.append(img);
    buttonContainer.append(actionButton);

    // Store references in the upgrade data
    action.button = actionButton;
    }

    // Initialize upgrade buttons
    buttons.forEach((_, index) => {
    createActionButton(index);
});

function undoCanvas() {
}

function redoCanvas() {
}

function clearCanvas() {
    context!.clearRect(0, 0, canvas.width, canvas.height);
    context!.fillStyle = 'white'; // Set fill color
    context!.fillRect(0, 0, 256, 256);
}

function exportCanvas() {
}