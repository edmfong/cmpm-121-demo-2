import "./style.css";
import { Stroke } from "./stroke.ts";
import { ToolPreview } from "./toolpreview.ts";

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
wrapper.id = "wrapper";

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
const displayList: Stroke[] = [];
const commandStack: Command[] = [];
const redoStack: Command[] = [];
let brushColor = "black"; // Default color
let brushSize = 1; // Default size
let previousBrushSize = 1;

let toolPreview: ToolPreview | null = null; // Nullable reference to the preview

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

// Command Interface
interface Command {
    execute(): void;
    undo(): void;
}

// Drawing Command
class DrawCommand implements Command {
    private lastStroke: Stroke | null = null; // To store the last stroke for redo

    constructor(private stroke: Stroke, private displayList: Stroke[], private redraw: () => void) {}

    execute() {
        this.displayList.push(this.stroke);
        this.lastStroke = this.stroke; // Store the stroke as the last drawn stroke
        this.redraw();
    }

    undo() {
        if (this.lastStroke) {
            // Optionally store it for redo functionality if needed
            this.displayList.pop(); // Remove the last stroke
            this.redraw();
        }
    }

    redo() {
        if (this.lastStroke) {
            this.displayList.push(this.lastStroke); // Re-add the last stroke
            this.redraw();
        }
    }
}

// Clear Command
class ClearCommand implements Command {
    private previousState: Stroke[];

    constructor(private displayList: Stroke[], private redraw: () => void) {
        this.previousState = [...this.displayList]; // Store the current state for undo
    }

    execute() {
        this.displayList.length = 0; // Clear the display list
        this.redraw();
    }

    undo() {
        this.displayList.push(...this.previousState); // Restore previous state
        this.redraw();
    }
}

// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
    currentStroke = new Stroke(x, y, brushColor, brushSize); // Pass color and size
    toolPreview = null; // Hide the preview when the mouse is down
});

canvas.addEventListener('mousemove', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    
    if (isDrawing && currentStroke) {
        currentStroke.drag(x, y); // Add points to the stroke

        // Redraw to show the current stroke while dragging
        redrawFromDisplayList(); // Redraw all existing strokes
        currentStroke.display(context!); // Display the current stroke
    } 
    else {
        // Show tool preview if not drawing
        toolPreview = new ToolPreview(x, y, brushSize, brushColor);
        redrawFromDisplayList();
        toolPreview.draw(context!); // Draw the preview
    }
});

// Mouse leave event to remove the preview when the cursor leaves the canvas
canvas.addEventListener('mouseleave', () => {
    toolPreview = null;
    redrawFromDisplayList(); // Redraw strokes without the preview
});

globalThis.addEventListener("mouseup", () => {
    if (isDrawing && currentStroke) {
        const drawCommand = new DrawCommand(currentStroke, displayList, redrawFromDisplayList);
        drawCommand.execute();
        commandStack.push(drawCommand); // Store the command for undo
        redoStack.length = 0; // Clear the redo stack when a new action is performed
        currentStroke = null; // Reset current stroke
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

// Create buttons for actions
const buttons: { name: string; onClick: () => void; color: string | null; }[] = [
    { name: "undo", onClick: undoCanvas, color: null},
    { name: "redo", onClick: redoCanvas, color: null},
    { name: "clear", onClick: clearCanvas, color: null},
    { name: "export", onClick: exportCanvas, color: null},
    { name: "red", onClick: () => changeColor("#ff5c5c"), color: "#ff5c5c"},
    { name: "green", onClick: () => changeColor("#c7ff65"), color: "#c7ff65"},
    { name: "orange", onClick: () => changeColor("#ffa860"), color: "#ffa860"},
    { name: "blue", onClick: () => changeColor("#6fbaff"), color: "#6fbaff"},
    { name: "yellow", onClick: () => changeColor("#fff85e"), color: "#fff85e"},
    { name: "purple", onClick: () => changeColor("#c07dff"), color: "#c07dff"},
    { name: "white", onClick: () => changeColor("#ffffff"), color: "#ffffff"},
    { name: "gray", onClick: () => changeColor("#8a8c8d"), color: "#8a8c8d"},
    { name: "black", onClick: () => changeColor("#000000"), color: "#000000"},
    { name: "brown", onClick: () => changeColor("#724e2c"), color: "#724e2c"},
];

// Create buttons
buttons.forEach(({ name, onClick, color }) => {
    const button = document.createElement("button");
    if (color) {
        button.style.backgroundColor = color;
        button.addEventListener("click", onClick);
    } else {
        button.textContent = name;
        button.addEventListener("click", onClick);
    }
    (color ? colorContainer : buttonContainer).appendChild(button);
});

// Append brush size after color buttons are created
colorContainer.appendChild(brushSizeInputContainer);
wrapper.appendChild(buttonContainer);

function changeColor(color: string | null) {
    if (color) {
        brushColor = color;
    }
}

// Undo functionality
function undoCanvas() {
    const command = commandStack.pop();
    if (command) {
        command.undo();
        redoStack.push(command); // Store for redo functionality
    } else {
        console.warn("No actions to undo."); // Optional: log a message if there's nothing to undo
    }
}


// Redo functionality
function redoCanvas() {
    if (redoStack.length === 0) {
        console.warn("No actions to redo."); // Optional: log a message if there's nothing to redo
        return; // Early return if there's nothing to redo
    }

    const command = redoStack.pop();
    if (command) {
        command.execute(); // Execute the redo command
        commandStack.push(command); // Optionally add it back to the command stack
    }
}


// Clear canvas using command
function clearCanvas() {
    const clearCommand = new ClearCommand(displayList, redrawFromDisplayList);
    clearCommand.execute();
    commandStack.push(clearCommand); // Store the command for undo
}

// Export canvas as an image
function exportCanvas() {
    // const link = document.createElement("a");
    // link.download = "sketchpad.png";
    // link.href = canvas.toDataURL(); // Get data URL of the canvas
    // link.click(); // Trigger download
}

// Ensure correct resizing when changing brush size
brushSizeInput.addEventListener("change", updateBrushSize);
