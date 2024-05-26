class Garbage {
  constructor(x, y, rad, color = "grey") {
    this.x = x;
    this.y = y;
    this.rad = rad;
    this.color = color;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.rad, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
