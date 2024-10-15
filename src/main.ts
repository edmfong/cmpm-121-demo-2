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

const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
if (ctx) {
  ctx.fillStyle = 'white'; // Set fill color
  ctx.fillRect(0, 0, 256, 256);
}