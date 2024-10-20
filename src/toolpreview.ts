export class ToolPreview {
    constructor(public x: number, public y: number, public size: number, public brushColor: string, public sticker: string | null) {}

    draw(ctx: CanvasRenderingContext2D) {
        if (this.sticker) {
            // Draw the sticker at the specified position
            ctx.font = `${this.size * 20}px sans-serif`; // Adjust font size as needed
            const textWidth = ctx.measureText(this.sticker).width;
            const textHeight = this.size * 20; // Approximate height based on font size
        
            // Calculate the centered position
            const centeredX = this.x - textWidth / 2;
            const centeredY = this.y + textHeight / 2; // Adjust for baseline
        
            // Draw the sticker at the centered position
            ctx.fillText(this.sticker, centeredX, centeredY);
        } else {
            // Draw the brush preview if no sticker is selected
            ctx.beginPath();
            ctx.strokeStyle = this.brushColor;
            ctx.lineWidth = 2;
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();
        }
    }
}
