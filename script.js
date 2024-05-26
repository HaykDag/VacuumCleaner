//HTML Elements
const info = document.getElementById("cover");
const restartBtn = document.getElementById("restart");
const roomEl = document.getElementById("room");
const controlType = document.getElementById("type");

//Main canvas
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

//network canvas
const networkCanvas = document.getElementById("networkCanvas");
const netCtx = networkCanvas.getContext("2d");
networkCanvas.width = 400;
networkCanvas.height = 600;
networkCanvas.style.display = controlType.value === "AI" ? "flex" : "none";

//globals
let mouseClicked = false;
let turnCounter = 0;
let turnSide = "left";
const vacuums = [];
let bestBrain = null;
let currRoom = "room1";
const brains = [brain1, brain2, brain3];
const startPos = { x: 740, y: 540 };
const mutation = 0.08;

let room = new Room(canvas);
vacuums.push(new Vacuum(startPos.x, startPos.y, 40, canvas, "KEYS"));

controlType.onchange = (e) => {
  controlType.blur();
  if (e.target.value !== "AI") {
    networkCanvas.style.display = "none";
  } else {
    networkCanvas.style.display = "flex";
  }
  const { x, y, dir } = vacuums[0];
  vacuums[0] = new Vacuum(x, y, 40, canvas, e.target.value);
  vacuums[0].dir = dir;
  loadBrain();
};

roomEl.onchange = (e) => {
  roomEl.blur();
  const { controlType } = vacuums[0];
  vacuums[0] = new Vacuum(startPos.x, startPos.y, 40, canvas, controlType);

  currRoom = e.target.value;
  loadBrain();

  vacuums[0].brain = bestBrain;
  const walls = Room.getWalls(currRoom);
  room.walls.splice(4);
  room.walls.push(...walls);
};

restartBtn.addEventListener("click", () => {
  initRoom();
  info.style.display = "none";
});
let path = [];
let newWall = null;
let garbage = [];

initRoom();
loadBrain();
animate();

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //const maxDist = Math.max(...vacuums.map((vac) => vac.dist));
  //const selectedVacuum = vacuums.find((vac) => vac.selected);
  // for (let i = 0; i < vacuums.length; i++) {
  //   if (vacuums[i].dist === maxDist && !selectedVacuum) {
  //     //best vacuum
  //     bestBrain = vacuums[i].brain;
  //     vacuums[i].draw(ctx, true);
  //   } else if (selectedVacuum && vacuums[i].selected) {
  //     bestBrain = vacuums[i].brain;
  //     vacuums[i].draw(ctx, true);
  //   } else {
  //     vacuums[i].draw(ctx);
  //   }
  // }
  room.update(vacuums[0]);
  room.draw(ctx);

  vacuums[0].update(room.walls);
  vacuums[0].draw(ctx, true);

  Visualizer.drawNetwork(netCtx, bestBrain);

  requestAnimationFrame(animate);
}

function initRoom() {
  const walls = Room.getWalls(currRoom);
  room.walls.push(...walls);
  room.generateGarbage(200);
}

function save() {
  const data = JSON.stringify(bestBrain);
  if (currRoom === "room1") {
    localStorage.setItem("bestBrain1", data);
  } else if (currRoom === "room2") {
    localStorage.setItem("bestBrain2", data);
  } else {
    localStorage.setItem("bestBrain3", data);
  }
}

function loadBrain() {
  let data = null;
  if (currRoom === "room1") {
    data = localStorage.getItem("bestBrain1");
  } else if (currRoom === "room2") {
    data = localStorage.getItem("bestBrain2");
  } else {
    data = localStorage.getItem("bestBrain3");
  }
  if (!data) return;
  bestBrain = JSON.parse(data);
  vacuums[0].brain = bestBrain;
  for (let i = 1; i < vacuums.length; i++) {
    vacuums[i].brain = JSON.parse(data);
    if (i > 0) {
      NeuralNetwork.mutate(vacuums[i].brain, mutation);
    }
  }
}

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const { offsetX, offsetY } = e;

  for (let i = 0; i < vacuums.length; i++) {
    const dist = distance([vacuums[i].x, vacuums[i].y], [offsetX, offsetY]);
    if (dist < vacuums[i].rad) {
      vacuums.splice(i, 1);
      i--;
    }
  }
});
