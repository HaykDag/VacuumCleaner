class Room {
  constructor(canvas, walls = []) {
    this.canvas = canvas;
    this.walls = [
      new Wall({ x: 0, y: 0 }, { x: canvas.width, y: 0 }), //top
      new Wall({ x: 0, y: 0 }, { x: 0, y: canvas.height }), //left
      new Wall(
        { x: canvas.width, y: 0 },
        { x: canvas.width, y: canvas.height }
      ), //right
      new Wall(
        { x: 0, y: canvas.height },
        { x: canvas.width, y: canvas.height }
      ), //bottom
      ...walls,
    ];
    this.garbage = [];
    this.newWall = null;
    this.tempWall = null;
    this.#createWalls();
  }

  update(vacuum) {
    if (!vacuum.turned) return;
    if (this.garbage.length === 0) {
      info.style.display = "flex";
      vacuums[0].turned = false;
    }
    this.garbage = this.garbage.filter((g) => {
      const gPoint = [g.x, g.y];
      const lDist = distance(gPoint, vacuum.lSweeper);
      const rDist = distance(gPoint, vacuum.rSweeper);
      const dist = Math.min(lDist, rDist);

      return dist > vacuum.sweepLength;
    });
  }

  draw(ctx) {
    if (this.tempWall) {
      this.tempWall.draw(ctx, "grey");
    }
    for (const wall of this.walls) {
      wall.draw(ctx);
    }

    for (const garbage of this.garbage) {
      garbage.draw(ctx);
    }
  }

  #createWalls() {
    let mouse = null;
    canvas.addEventListener("mousemove", (e) => {
      const { offsetX, offsetY } = e;
      mouse = { x: offsetX, y: offsetY };

      if (this.newWall) {
        const { x, y } = this.newWall;
        this.tempWall = new Wall({ x, y }, mouse);
      }
    });
    canvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;

      if (!this.newWall) {
        this.newWall = { x: mouse.x, y: mouse.y };
      } else {
        this.walls.push(new Wall(this.tempWall.start, this.tempWall.end));
        this.newWall = this.tempWall.end;
        this.tempWall = null;
      }
    });
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.newWall = null;
      this.tempWall = null;
      const point = [mouse.x, mouse.y];
      for (let i = 3; i < this.walls.length; i++) {
        const seg = this.walls[i];
        const dist = distFromPointToSeg(point, seg);
        if (dist <= 2) {
          this.walls.splice(i, 1);
        }
      }
    });
  }

  generateGarbage(n) {
    for (let i = 0; i < n; i++) {
      let skip = false;
      const x = Math.random() * (this.canvas.width - 80) + 50;
      const y = Math.random() * (this.canvas.height - 80) + 50;
      const rad = Math.random() * 6 + 2;
      for (const wall of this.walls) {
        const dist = distFromPointToSeg([x, y], wall);
        if (dist <= rad) {
          skip = true;
          break;
        }
      }
      if (skip) {
        i--;
        continue;
      }
      this.garbage.push(new Garbage(x, y, rad));
    }
  }
  static getWalls(room) {
    if (room === "room1") {
      return [
        new Wall(
          { x: 0, y: canvas.height - 150 },
          { x: canvas.width - 150, y: canvas.height - 150 }
        ),
        new Wall(
          { x: 200, y: canvas.height - 300 },
          { x: canvas.width, y: canvas.height - 300 }
        ),
        new Wall(
          { x: 0, y: canvas.height - 450 },
          { x: canvas.width - 200, y: canvas.height - 450 }
        ),
      ];
    } else if (room === "room2") {
      return [
        new Wall({ x: 650, y: 600 }, { x: 650, y: 450 }),
        new Wall({ x: 650, y: 600 }, { x: 650, y: 150 }),
        new Wall({ x: 650, y: 150 }, { x: 150, y: 150 }),
        new Wall({ x: 150, y: 150 }, { x: 150, y: 430 }),
        new Wall({ x: 150, y: 430 }, { x: 350, y: 430 }),
      ];
    } else {
      return [
        new Wall(
          { x: canvas.width, y: canvas.height - 150 },
          { x: canvas.width - 300, y: canvas.height - 150 }
        ),
        new Wall(
          { x: canvas.width - 180, y: canvas.height - 350 },
          { x: canvas.width - 500, y: canvas.height - 350 }
        ),
        new Wall(
          { x: 0, y: canvas.height - 350 },
          { x: 150, y: canvas.height - 350 }
        ),
        new Wall(
          { x: canvas.width - 400, y: 0 },
          { x: canvas.width - 400, y: canvas.height - 350 }
        ),
        new Wall(
          { x: 150, y: canvas.height - 150 },
          { x: 300, y: canvas.height - 150 }
        ),
        new Wall(
          { x: 300, y: canvas.height - 150 },
          { x: 300, y: canvas.height }
        ),
      ];
    }
  }
}
