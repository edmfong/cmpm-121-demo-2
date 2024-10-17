export class ToolPreview {
    constructor(public x: number, public y: number, public size: number, public brushColor: string) {}

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeStyle = this.brushColor;
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
    }
}