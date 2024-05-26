class Vacuum {
  constructor(x, y, rad = 50, canvas, controlType) {
    this.canvas = canvas;
    this.controlType = controlType;
    this.x = x;
    this.y = y;
    this.startingPointX = x;
    this.startingPointY = y;
    this.dist = 0;
    this.rad = rad;
    this.dir = 0;
    this.rSweeper = [];
    this.lSweeper = [];
    this.sweepHands = [];
    this.sweeperAcc = 2;
    this.speed = 1;
    this.sweeperSpeed = 0.09;
    this.sweepCount = 10;
    this.sweepLength = this.rad * 0.7;
    this.distFromCenter = this.rad * 0.8;
    this.selected = false;
    this.#turnOn();
    if (controlType === "KEYS") {
      this.#addEventListners();
    }
    this.sensor = new Sensor(this);
    this.brain = new NeuralNetwork([5, 6, 5, 3]);
    this.hit = false;
    this.turned = false;
    this.forward = false;
    this.left = false;
    this.right = false;
    this.path = [];
  }

  update(walls) {
    this.#updateSweepers();
    this.frontHitPoints = [
      [this.x + Math.sin(this.dir) * 25, this.y - Math.cos(this.dir) * 25],
      [
        this.x + Math.sin(this.dir + 1) * 25,
        this.y - Math.cos(this.dir + 1) * 25,
      ],
      [
        this.x + Math.sin(this.dir - 1) * 25,
        this.y - Math.cos(this.dir - 1) * 25,
      ],
    ];
    this.hit = false;
    this.sensor.update(walls);
    this.sweeperAcc = (this.sweeperAcc + 1) % 360;
    const offsets = [1, 1, 1, 1, 1]; // [rightSensor, forwardSensor, leftSensor];

    for (let i = 0; i < this.sensor.readings.length; i++) {
      const { offset, rayIndex } = this.sensor.readings[i];
      //if the sensor value is big it means it is far from walls
      if (rayIndex === 0) {
        offsets[0] = offset;
      } else if (rayIndex === 1) {
        offsets[1] = offset;
      } else if (rayIndex === 3) {
        offsets[3] = offset;
      } else if (rayIndex === 4) {
        offsets[4] = offset;
      } else {
        offsets[2] = offset;
      }

      for (const wall of walls) {
        for (const points of this.frontHitPoints) {
          const dist = distFromPointToSeg(points, wall);
          if (dist <= this.rad * 0.5) {
            this.hit = true;
            this.#goBack();
          }
        }
      }
    }
    //this is for multiple vacuums
    this.dist = distance(
      [this.x, this.y],
      [this.startingPointX, this.startingPointY]
    );

    if (this.controlType === "AI") this.#activateAI(offsets);
    if (this.controlType === "ALGO") this.#activateAlgo(offsets);

    if (this.forward && !this.hit) this.#goForward();
    if (this.left) this.#turnLeft();
    if (this.right) this.#turnRight();

    if (this.turned) {
      //pushing water into the path, if there is no point make dist big number
      const lastPoint = this.path[this.path.length - 1];
      const dist = lastPoint
        ? distance([lastPoint.x, lastPoint.y], [this.x, this.y])
        : 1000;
      if (dist >= this.rad / 4) {
        this.path.push({ x: this.x, y: this.y, time: Date.now() });
      }
    }
  }

  draw(ctx, bestVacuum = false) {
    this.#drawPath(ctx);
    this.#drawSweepers(ctx);
    this.#drawVacuum(ctx);
    if (bestVacuum && this.controlType === "AI") {
      this.sensor.draw(ctx);
    }
  }

  #drawVacuum(ctx) {
    const { x, y, rad, dir } = this;

    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = this.hit ? "red" : "white";
    ctx.strokeStyle = this.turned ? "yellow" : "black";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, rad, dir, Math.PI + dir);
    ctx.fillStyle = this.hit ? "orange" : "silver";
    ctx.fill();
    ctx.stroke();

    this.#drawButton(ctx);
  }

  #drawSweepers(ctx) {
    for (const sweepHand of this.sweepHands) {
      ctx.beginPath();
      ctx.moveTo(...sweepHand.start);
      ctx.lineTo(...sweepHand.end);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "black";
      ctx.stroke();
    }
  }

  #drawPath() {
    for (let i = 0; i < this.path.length; i++) {
      const secondsPassed = (Date.now() - this.path[i].time) / 1000;
      const liveCycle = Math.random() * 10000 + 5;
      const rad = (this.rad * 0.8) / (secondsPassed * 0.1 + 1);

      if (secondsPassed >= liveCycle) {
        this.path.splice(i, 1);
      } else {
        ctx.beginPath();
        ctx.arc(this.path[i].x, this.path[i].y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(116,204,244, ${1 / secondsPassed})`;
        ctx.fill();
      }
    }
  }

  #updateSweepers() {
    this.sweepHands.length = 0;
    const {
      x,
      y,
      distFromCenter,
      dir,
      sweepCount,
      sweeperAcc,
      sweeperSpeed,
      sweepLength,
    } = this;

    this.rSweeper = [
      x + Math.sin(dir + 1) * distFromCenter,
      y - Math.cos(dir + 1) * distFromCenter,
    ];
    this.lSweeper = [
      x + Math.sin(dir - 1) * distFromCenter,
      y - Math.cos(dir - 1) * distFromCenter,
    ];

    for (let i = 0; i < sweepCount; i++) {
      let angle = lerp(Math.PI, -Math.PI, i / sweepCount);
      let end = [
        this.rSweeper[0] + Math.sin(angle) * sweepLength,
        this.rSweeper[1] - Math.cos(angle) * sweepLength,
      ];
      if (this.turned) {
        angle =
          lerp(Math.PI, -Math.PI, i / sweepCount) - sweeperAcc * sweeperSpeed;
        end = [
          this.rSweeper[0] + Math.sin(angle) * sweepLength,
          this.rSweeper[1] - Math.cos(angle) * sweepLength,
        ];
      }
      this.sweepHands.push({ start: this.rSweeper, end });
    }

    for (let i = 0; i < sweepCount; i++) {
      let angle = lerp(Math.PI, -Math.PI, i / sweepCount);
      let end = [
        this.lSweeper[0] + Math.sin(angle) * sweepLength,
        this.lSweeper[1] - Math.cos(angle) * sweepLength,
      ];
      if (this.turned) {
        angle =
          lerp(Math.PI, -Math.PI, i / sweepCount) + sweeperAcc * sweeperSpeed;
        end = [
          this.lSweeper[0] + Math.sin(angle) * sweepLength,
          this.lSweeper[1] - Math.cos(angle) * sweepLength,
        ];
      }
      this.sweepHands.push({ start: this.lSweeper, end });
    }
  }

  #turnOn() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        this.turned = !this.turned;
      }
    });
  }

  #addEventListners() {
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
          this.forward = true;
          break;
        case "ArrowLeft":
          this.left = true;
          break;
        case "ArrowRight":
          this.right = true;
          break;
      }
    });
    document.addEventListener("keyup", (e) => {
      if (this.controlType !== "KEYS") return;
      switch (e.key) {
        case "ArrowUp":
          this.forward = false;
          break;
        case "ArrowLeft":
          this.left = false;
          break;
        case "ArrowRight":
          this.right = false;
          break;
      }
    });
  }

  #goForward() {
    this.x = this.x + Math.sin(this.dir) * this.speed;
    this.y = this.y - Math.cos(this.dir) * this.speed;
  }
  #goBack() {
    this.x = this.x - Math.sin(this.dir) * this.speed * 0.5;
    this.y = this.y + Math.cos(this.dir) * this.speed * 0.5;
  }

  #turnLeft() {
    this.dir = (this.dir - 0.02) % (Math.PI * 2);
    this.sweepersSpeed = (this.sweepersSpeed + 1) % 360;
  }

  #turnRight() {
    this.dir = (this.dir + 0.02) % (Math.PI * 2);
    this.sweepersSpeed = (this.sweepersSpeed + 1) % 360;
  }

  #drawButton(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = this.turned ? "green" : "orange";
    ctx.strokeStyle = this.turned ? "orange" : "green";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  #activateAI(offsets) {
    const outputs = NeuralNetwork.feedForward(offsets, this.brain);

    //right
    outputs[0] ? (this.right = true) : (this.right = false);
    //forward
    outputs[1] ? (this.forward = true) : (this.forward = false);
    //left
    outputs[2] ? (this.left = true) : (this.left = false);
  }

  #activateAlgo(offsets) {
    const rightOffset = offsets[0];
    const leftOffset = offsets[4];
    if (this.hit) {
      this.forward = false;
    } else if (turnCounter <= 0) {
      this.forward = true;
      this.left = false;
      this.right = false;
      turnCounter = 0;
    }
    if (!this.forward) {
      if (turnCounter <= 0) {
        turnCounter = Math.random() * (Math.PI * 0.5) + 0.2;
        turnSide = this.#chooseSide(rightOffset, leftOffset);
      } else {
        turnSide === "right" ? (this.right = true) : (this.left = true);
        turnCounter -= 0.02;
      }
    }
  }
  #chooseSide(right, left) {
    if (Math.abs(right - left) > 0.4) {
      return right > left ? "right" : "left";
    } else {
      return Math.random() > 0.5 ? "right" : "left";
    }
  }
}
