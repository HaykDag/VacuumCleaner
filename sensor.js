class Sensor {
  constructor(vacuum) {
    this.vacuum = vacuum;
    this.rayCount = 5;
    this.rayLength = 110;
    this.raySpread = Math.PI / 1.2;
    this.rays = [];
    this.readings = [];
  }

  update(walls) {
    this.readings = [];
    this.#castRays();
    for (let i = 0; i < this.rays.length; i++) {
      for (let j = 0; j < walls.length; j++) {
        const [start, end] = this.rays[i];
        const { start: a, end: b } = walls[j];
        const intersection = getIntersection(start, end, a, b);
        if (intersection) {
          intersection.rayIndex = i;
          this.readings.push(intersection);
        }
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.rays.length; i++) {
      const currRay = this.readings.filter((reading) => reading.rayIndex === i);
      const end = [this.rays[i][1].x, this.rays[i][1].y];
      if (currRay.length) {
        currRay.sort((a, b) => a.offset - b.offset);
        end[0] = currRay[0].x;
        end[1] = currRay[0].y;
      }
      ctx.beginPath();
      ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
      ctx.lineTo(...end);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      ctx.stroke();
    }
  }

  #castRays() {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        lerp(
          this.raySpread / 2,
          -this.raySpread / 2,
          this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
        ) + this.vacuum.dir;

      const start = { x: this.vacuum.x, y: this.vacuum.y };
      const end = {
        x: this.vacuum.x + this.rayLength * Math.sin(rayAngle),
        y: this.vacuum.y - this.rayLength * Math.cos(rayAngle),
      };
      this.rays.push([start, end]);
    }
  }
}
