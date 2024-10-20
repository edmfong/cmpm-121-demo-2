export class Stroke {
    private points: Array<{ x: number, y: number }>;
    private color: string; // Add color property
    private size: number; // Add size property
    public sticker: string | null = null; // Add a property to hold the sticker

    constructor(x: number, y: number, color: string = "black", size: number = 1, sticker: string | null = null) {
        this.points = [{ x, y }];
        this.color = color;
        this.size = size; 
        this.sticker = sticker; // Initialize the sticker
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.sticker) {
            ctx.font = `${this.size * 20}px sans-serif`;
            const textWidth = ctx.measureText(this.sticker).width;
            const textHeight = this.size * 20; // Approximate height based on font size
    
            // Calculate the top-left corner for centering
            const x = this.points[0].x - textWidth / 2;
            const y = this.points[0].y + textHeight / 2; // Adjust for baseline
    
            // Draw the sticker at the centered position
            ctx.fillText(this.sticker, x, y);
        }
        else if (this.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = this.color; // Use the stroke's color
        ctx.lineWidth = this.size; // Use the stroke's size
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (const point of this.points) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
        ctx.closePath();
    }
}
