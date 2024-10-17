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

// Create a div to store the colors
const colorContainer = document.createElement("div");
colorContainer.id = "colorContainer";
app.append(colorContainer);

// Create a wrapper for the canvas and color container
const wrapper = document.createElement("div");
wrapper.id = "wrapper"; // Add an ID for styling

// Append canvas and color container to the wrapper
wrapper.appendChild(canvas);
wrapper.appendChild(colorContainer);
app.appendChild(wrapper);

// Fill in canvas with white background
const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
context!.clearRect(0, 0, canvas.width, canvas.height);
context!.fillStyle = 'white'; // Set fill color
context!.fillRect(0, 0, 256, 256);

// Variables for drawing state
let isDrawing = false;
let x = 0;
let y = 0;
let currentStroke: Stroke | null = null;
let displayList: Stroke[] = [];
let redoStack: Stroke[] = [];
let brushColor = "black"; // Default color
let brushSize = 1; // Default size
let previousBrushSize = 1;

// Create a div to store the buttons
const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";
app.append(buttonContainer);

// Create a div to store the brush size
const brushSizeInputContainer = document.createElement("div");
const brushSizeInput = document.createElement("input");
brushSizeInputContainer.innerHTML = "Brush Size ";
brushSizeInput.type = "text"; 
brushSizeInput.placeholder = "1";
brushSizeInputContainer.id = "brushSizeInputContainer";
brushSizeInputContainer.appendChild(brushSizeInput)

// Function to validate and update brush size
const updateBrushSize = () => {
    const value = parseFloat(brushSizeInput.value);

    // Check if value is a valid number between 1 and 5
    if (!isNaN(value) && value >= 1 && value <= 5) {
        previousBrushSize = value;  // Update previous brush size
        brushSize = value;          // Set brush size
    } 
    else if (!isNaN(value) && value > 5) {
        // Cap the brush size at 5
        brushSize = 5;
        brushSizeInput.value = "5";
        previousBrushSize = 5;  // Set previous brush size to 5
    } 
    else if (value < 1 || isNaN(value)) {
        // If input is less than 1 or invalid, revert to previous brush size
        brushSizeInput.value = String(previousBrushSize);
    }
};

// Add focus event listener to highlight text when clicked
brushSizeInput.addEventListener("focus", () => {
    brushSizeInput.select(); // Select the text in the input
});

// Add input event listener to allow only numbers
brushSizeInput.addEventListener("input", () => {
    const value = brushSizeInput.value;
    // Remove any non-digit characters
    brushSizeInput.value = value.replace(/[^0-9.]/g, '');
    updateBrushSize();
});

// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
    currentStroke = new Stroke(x, y, brushColor, brushSize); // Pass color and size
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

// Interface for storing actions for buttons
interface Actions {
    name: string;
    onClick: (() => void) | ((color: string) => void);
    color: string | null;
}

// Create buttons for actions
const buttons: Actions[] = [
    { name: "undo", onClick: undoCanvas, color: null},
    { name: "redo", onClick: redoCanvas, color: null},
    { name: "clear", onClick: clearCanvas, color: null},
    { name: "export", onClick: exportCanvas, color: null},
    { name: "red", onClick: changeColor, color: "#ff5c5c"},
    { name: "green", onClick: changeColor, color: "#c7ff65"},
    { name: "orange", onClick: changeColor, color: "#ffa860"},
    { name: "blue", onClick: changeColor, color: "#6fbaff"},
    { name: "yellow", onClick: changeColor, color: "#fff85e"},
    { name: "purple", onClick: changeColor, color: "#c07dff"},
    { name: "white", onClick: changeColor, color: "#ffffff"},
    { name: "gray", onClick: changeColor, color: "#8a8c8d"},
    { name: "black", onClick: changeColor, color: "#000000"},
    { name: "brown", onClick: changeColor, color: "#724e2c"},
];

// Create buttons
buttons.forEach(({ name, onClick, color }) => {
    if (color) {
        const button = document.createElement("button");
        button.style.backgroundColor = color;
        button.addEventListener("click", () => onClick(color));
        colorContainer.appendChild(button);
    }
    else {
        const button = document.createElement("button");
        button.textContent = name;
        button.addEventListener("click", () => (onClick as () => void)());
        buttonContainer.appendChild(button);
    }
});

// append brush size after color buttons are created
colorContainer.appendChild(brushSizeInputContainer);
wrapper.appendChild(buttonContainer);

function changeColor(color: string | null) {
    if (color) {
        brushColor = color;
    }
}

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