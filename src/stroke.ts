export class Stroke {
    private points: Array<{ x: number, y: number }>;
    private color: string; // Add color property
    private size: number; // Add size property

    constructor(x: number, y: number, color: string = "black", size: number = 1) {
        this.points = [{ x, y }];
        this.color = color;
        this.size = size; 
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;
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