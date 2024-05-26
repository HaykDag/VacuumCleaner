function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerp2D(A, B, t) {
  return [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
}

function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
  if (bottom !== 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t),
        offset: t,
      };
    }
  }
  return null;
}

function drawPoint(ctx, x, y, color = "black", r = 5) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function distance(p1, p2) {
  let dist = 0;
  for (let i = 0; i < p1.length; i++) {
    dist += (p1[i] - p2[i]) * (p1[i] - p2[i]);
  }
  return Math.sqrt(dist);
}

function add(v1, v2) {
  const newV = [];
  for (let i = 0; i < v1.length; i++) {
    newV[i] = v1[i] + v2[i];
  }
  return newV;
}

function subtract(v1, v2) {
  const newV = [];
  for (let i = 0; i < v1.length; i++) {
    newV[i] = v1[i] - v2[i];
  }
  return newV;
}

function magnitute(v) {
  //return distance(v,new Array(v.length).fill(0));
  let mag = 0;
  for (let i = 0; i < v.length; i++) {
    mag += v[i] * v[i];
  }
  return Math.sqrt(mag);
}

function scale(v, scalar) {
  let newV = [];
  for (let i = 0; i < v.length; i++) {
    newV[i] = v[i] * scalar;
  }
  return newV;
}

function normalize(v) {
  return scale(v, 1 / magnitute(v));
}

function dot(p1, p2) {
  return p1[0] * p2[0] + p1[1] * p2[1];
}

function distFromPointToSeg(p, seg) {
  const A = [seg.start.x, seg.start.y];
  const B = [seg.end.x, seg.end.y];

  const AB = subtract(B, A);
  const AP = subtract(p, A);
  const nAB = normalize(AB);

  const t = dot(AP, nAB) / distance(A, B);

  const M = lerp2D(A, B, t);

  let dist = distance(p, M);
  if (t <= 0) {
    dist = distance(A, p);
  } else if (t >= 1) {
    dist = distance(B, p);
  }
  return dist;
}

function getRGBA(value) {
  const alpha = Math.abs(value);
  const R = value < 0 ? 0 : 255;
  const G = R;
  const B = value > 0 ? 0 : 255;
  return `rgba(${R},${G},${B},${alpha})`;
}
