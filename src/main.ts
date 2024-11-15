import "./style.css";
import { Stroke } from "./stroke.ts";
import { ToolPreview } from "./toolpreview.ts";

const APP_NAME = "Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const spinner = document.querySelector<HTMLDivElement>("#spinner")!;
spinner.style.display = "block";

// Create loading overlay
const loadingOverlay = document.createElement("div");
loadingOverlay.id = "loadingOverlay";
document.body.appendChild(loadingOverlay);


// Create title
const h1: HTMLElement = document.createElement('h1');
h1.textContent = 'Sketchpad';
app.appendChild(h1);

// Create canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

function createDiv(id: string) {
    const div = document.createElement("div");
    div.id = id;
    app.appendChild(div);
    return div;
}

const colorContainer = createDiv("colorContainer");

const emojiContainer = createDiv("emojiContainer");

// Create a wrapper for the canvas and color container
const wrapper = document.createElement("div");
wrapper.id = "wrapper";

// Create a wrapper for the canvas and emojis only
const emojiCanvasWrapper = document.createElement("div");
emojiCanvasWrapper.id = "emojiCanvasWrapper";

emojiCanvasWrapper.appendChild(canvas);
emojiCanvasWrapper.appendChild(emojiContainer);

// Append canvas and color container to the wrapper
wrapper.append(emojiCanvasWrapper);
wrapper.appendChild(colorContainer);
app.appendChild(wrapper);

// Fill in canvas with white background
const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
context!.clearRect(0, 0, canvas.width, canvas.height);
context!.fillStyle = 'white'; // Set fill color
context!.fillRect(0, 0, canvas.width, canvas.height);

// colors and stickers
const colorNames = [ "red", "green", "orange", "blue", "yellow", "purple", "white", "gray", "black", "brown"];

const colors = [
    "#ff5c5c", "#c7ff65", "#ffa860", "#6fbaff", "#fff85e", "#c07dff",
    "#ffffff", "#8a8c8d", "#000000", "#724e2c"
];

const stickers = [
    "🐀", "🐒", "🦆",
];

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
let selectedSticker: string | null = null;  // To store currently selected sticker

let toolPreview: ToolPreview | null = null; // Nullable reference to the preview

const buttonContainer = createDiv("buttonContainer");

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

class PlaceStickerCommand implements Command {
    private stickerX: number;
    private stickerY: number;
    private stickerSize: number; // Add property to hold sticker size

    constructor(
        private sticker: string,
        private displayList: Stroke[],
        private redraw: () => void,
        x: number,
        y: number,
        size: number // Accept size as a parameter
    ) {
        this.stickerX = x;
        this.stickerY = y;
        this.stickerSize = size; // Initialize sticker size
    }

    execute() {
        const stroke = new Stroke(this.stickerX, this.stickerY, brushColor, this.stickerSize); // Pass the current brushColor
        stroke.sticker = this.sticker;
        this.displayList.push(stroke);
        this.redraw();
    }

    drag(x: number, y: number) {
        this.stickerX = x;
        this.stickerY = y;
        this.redraw();
    }

    undo() {
        this.displayList.pop(); // Undo placing the sticker
        this.redraw();
    }
}


// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    if (selectedSticker) {
        const placeStickerCommand = new PlaceStickerCommand(selectedSticker, displayList, redrawFromDisplayList, e.offsetX, e.offsetY, brushSize);
        placeStickerCommand.execute();
        commandStack.push(placeStickerCommand);  // Add to command stack for undo
        selectedSticker = null;  // Clear sticker after placing
    }
    else {
        x = e.offsetX;
        y = e.offsetY;
        isDrawing = true;
        currentStroke = new Stroke(x, y, brushColor, brushSize); // Pass color and size
        toolPreview = null; // Hide the preview when the mouse is down
    }
    
});

canvas.addEventListener('mousemove', (e) => {
    x = e.offsetX;
    y = e.offsetY;

    if (selectedSticker) {
        toolPreview = new ToolPreview(x, y, brushSize, brushColor, selectedSticker);
        redrawFromDisplayList(); // Redraw existing strokes
        toolPreview.draw(context!); // Draw the sticker preview
    } else if (isDrawing && currentStroke) {
        currentStroke.drag(x, y); // Add points to the stroke

        // Redraw to show the current stroke while dragging
        redrawFromDisplayList(); // Redraw all existing strokes
        currentStroke.display(context!); // Display the current stroke
    } else {
        // Show tool preview if not drawing
        toolPreview = new ToolPreview(x, y, brushSize, brushColor, null); // Set to null for brush preview
        redrawFromDisplayList();
        toolPreview.draw(context!); // Draw the brush preview
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
const buttons: { name: string; onClick: () => void; color: string | null; sticker: string | null; }[] = [
    { name: "undo", onClick: undoCanvas, color: null, sticker: null},
    { name: "redo", onClick: redoCanvas, color: null, sticker: null},
    { name: "clear", onClick: clearCanvas, color: null, sticker: null},
    { name: "export", onClick: exportCanvas, color: null, sticker: null},
    { name: "newSticker", onClick: newSticker, color: null, sticker: "+"},
];

for (let i = 0; i < colorNames.length; i++) {
    buttons.push({ name: `${colorNames[i]}`, onClick: () => changeColor(`${colors[i]}`), color: `${colors[i]}`, sticker: null });
}

for (let i = 0; i < stickers.length; i++) {
    buttons.push({ name: `sticker${i}`, onClick: () => selectSticker(`${stickers[i]}`), color: null, sticker: `${stickers[i]}` });
}

// Create buttons
buttons.forEach(({ name, onClick, color , sticker}) => {
    const button = document.createElement("button");
    if (color) {
        button.style.backgroundColor = color;
        button.addEventListener("click", onClick);
        (colorContainer).appendChild(button)
    }
    else if (sticker) {
        button.textContent = sticker;
        button.addEventListener("click", onClick);
        (emojiContainer).appendChild(button)
    } 
    else {
        button.textContent = name;
        button.addEventListener("click", onClick);
        (buttonContainer).appendChild(button)
    }
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
    const link = document.createElement("a");
    link.download = "sketchpad.png";
    link.href = canvas.toDataURL(); // Get data URL of the canvas
    link.click(); // Trigger download
}

// Function to handle sticker selection
function selectSticker(sticker: string) {
    selectedSticker = sticker;
    toolPreview = null; // Reset other previews if any
}

// adds a new sticker
function newSticker() {
    const sticker = prompt("Enter the sticker character:");

    if (sticker) { // Check if the sticker is not null or empty
        const button = document.createElement("button");
        button.textContent = sticker;


        // Use an arrow function to pass the sticker to selectSticker
        button.addEventListener("click", () => selectSticker(sticker)); 

        emojiContainer.appendChild(button); // Append the button to the emoji container

        stickers.push(sticker);
    }
}

// Function to randomize brush color and sticker
function randomizeSticker() {
    const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
    selectSticker(randomSticker);
}

function randomizeColor() {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    changeColor(randomColor);
}

// Ensure correct resizing when changing brush size
brushSizeInput.addEventListener("change", updateBrushSize);

// Add a new button to trigger randomization
const randButtonContainer = document.createElement("div");
randButtonContainer.id = "randButtonContainer";
buttonContainer.append(randButtonContainer);
const randomColorButton = document.createElement("button");
randomColorButton.textContent = "rand color";
randomColorButton.addEventListener("click", randomizeColor);
randButtonContainer.appendChild(randomColorButton);
const randomStickerButton = document.createElement("button");
randomStickerButton.textContent = "rand sticker";
randomStickerButton.addEventListener("click", randomizeSticker);
randButtonContainer.appendChild(randomStickerButton);

// Simulate loading delay
setTimeout(() => {
    spinner.style.display = "none";
    loadingOverlay.remove(); // Remove the overlay
}, 2000); // 2 seconds delay