import "./style.css";

const APP_NAME = "Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const h1: HTMLElement = document.createElement('h1');
h1.textContent = 'Sketchpad';
app.appendChild(h1);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
clearCanvas();

// Create a div to store the buttons
const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer"; // Optional: Give the div an ID for styling or future reference
app.append(buttonContainer); // Append the div to your main app container

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

// Function to start drawing
canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

// Function to draw on the canvas
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

globalThis.addEventListener("mouseup", (e) => {
    if (isDrawing) {
      drawLine(context, x, y, e.offsetX, e.offsetY);
      x = 0;
      y = 0;
      isDrawing = false;
    }
  });

function drawLine(context: CanvasRenderingContext2D | null, x1: number, y1: number, x2: number, y2: number) {
context!.beginPath();
context!.strokeStyle = "black";
context!.lineWidth = 1;
context!.moveTo(x1, y1);
context!.lineTo(x2, y2);
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