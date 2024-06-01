//HTML Elements
const info = document.getElementById("cover");
const restartBtn = document.getElementById("restart");
const roomEl = document.getElementById("room");
const controlType = document.getElementById("type");
const saveBtn = document.getElementById("save");
const trainBtn = document.getElementById("train");
const trainInfo = document.getElementById("trainInfo");
const trainNumber = document.getElementById("vacuumCount");
const trainMutation = document.getElementById("mutation");
const generateBtn = document.getElementById("generate");
const closeTrainInfo = document.getElementById("closeTrainInfo");
const turnOninfo = document.getElementById("turnOnInfo");

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
const vacuums = [];
let currRoom = "room1";
const startPos = { x: 740, y: 540 };

let room = new Room(canvas);
vacuums.push(new Vacuum(startPos.x, startPos.y, 40, canvas, "KEYS"));

controlType.onchange = (e) => {
  controlType.blur();
  vacuums.splice(1);
  if (e.target.value !== "AI") {
    networkCanvas.style.display = "none";
    saveBtn.style.display = "none";
    trainBtn.style.display = "none";
  } else {
    networkCanvas.style.display = "flex";
    saveBtn.style.display = "inline-block";
    trainBtn.style.display = "inline-block";
    loadBrain();
    trainBtn.onclick = () => {
      trainInfo.style.display = "flex";
      generateBtn.onclick = () => {
        trainInfo.style.display = "none";
        const number = Number(trainNumber.value);
        mutation = Number(trainMutation.value);
        mutation = mutation < 0 ? 0 : mutation > 1 ? 1 : mutation;

        if (isNaN(number) || number < 1) return;

        generateCleaners(number);
      };
      closeTrainInfo.onclick = () => {
        trainInfo.style.display = "none";
      };
    };
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

  room.update(vacuums[0]);
  room.draw(ctx);
  for (let i = 0; i < vacuums.length; i++) {
    const cleaner = vacuums[i];
    cleaner.update(room.walls);
    i === 0 ? cleaner.draw(ctx, true) : cleaner.draw(ctx);
  }

  Visualizer.drawNetwork(netCtx, vacuums[0].brain);
  requestAnimationFrame(animate);
}

function initRoom() {
  const walls = Room.getWalls(currRoom);
  room.walls.push(...walls);
  room.generateGarbage(200);
}

function save() {
  const data = localStorage.getItem("brains");
  const brains = data ? JSON.parse(data) : {};
  brains[currRoom] = vacuums[0].brain;
  localStorage.setItem("brains", JSON.stringify(brains));
}

function loadBrain() {
  const data = localStorage.getItem("brains");
  if (!data) return;

  const brains = JSON.parse(data);

  vacuums[0].brain = brains[currRoom];
  for (let i = 1; i < vacuums.length; i++) {
    const brains = JSON.parse(data);
    vacuums[i].brain = brains[currRoom];

    NeuralNetwork.mutate(vacuums[i].brain, mutation);
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

function generateCleaners(n) {
  vacuums.length = 0;
  for (let i = 0; i <= n; i++) {
    const cleaner = new Vacuum(startPos.x, startPos.y, 40, canvas, "AI");
    vacuums.push(cleaner);
  }
  loadBrain();
}
