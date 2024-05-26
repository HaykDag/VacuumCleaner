class Wall {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  draw(ctx, color = "black") {
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}
