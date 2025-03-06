let walls = []; 
let particle;
let starPositions = []; 
let noiseOffset = 0;
let trail = []; // Stores previous cursor positions

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Main star in the middle
  starPositions.push({ x: width / 2, y: height / 2, outer: 300, inner: 120 });

  // Three smaller stars
  starPositions.push({ x: width / 4, y: height / 4, outer: 150, inner: 60 }); 
  starPositions.push({ x: width / 6, y: height * 0.75, outer: 150, inner: 60 }); 
  starPositions.push({ x: width * 0.75, y: height * 0.75, outer: 180, inner: 72 });

  // Adjusting the size for variety
  starPositions[2].outer *= 0.8; 
  starPositions[2].inner *= 0.8;
  starPositions[1].outer *= 0.3; 
  starPositions[1].inner *= 0.3;

  // Create stars
  for (let pos of starPositions) {
    createStarBoundaries(pos);
  }

  // Canvas borders
  walls.push(new Boundary(0, 0, width, 0));
  walls.push(new Boundary(width, 0, width, height));
  walls.push(new Boundary(width, height, 0, height));
  walls.push(new Boundary(0, height, 0, 0));

  particle = new Particle();
  noCursor();
}

function draw() {
  drawDynamicBackground();
  drawMouseTrail(); // Draws the fading light trail

  for (let wall of walls) {
    wall.show();
  }

  // Particle follows the cursor
  particle.update(mouseX, mouseY);
  particle.show();
  particle.look(walls);

  addToTrail(mouseX, mouseY); // Updates the trail effect
}

// Function for dynamic shifting background
function drawDynamicBackground() {
  noiseOffset += 0.005; // Controls background movement speed

  for (let x = 0; x < width; x += 10) {
    for (let y = 0; y < height; y += 10) {
      let noiseValue = noise(x * 0.005, y * 0.005, noiseOffset);
      let col = lerpColor(color(10, 10, 50), color(80, 10, 30), noiseValue);
      noStroke();
      fill(col);
      rect(x, y, 10, 10);
    }
  }
}

// Function to draw the fading mouse trail
function drawMouseTrail() {
  for (let i = 0; i < trail.length; i++) {
    let pos = trail[i];
    let alpha = map(i, 0, trail.length, 50, 0); // Fades over time
    fill(255, 150, 50, alpha); // Light orange glow
    noStroke();
    ellipse(pos.x, pos.y, 10);
  }
}

// Function to update the trail array
function addToTrail(x, y) {
  trail.push(createVector(x, y));

  // Limit the trail length to prevent lag
  if (trail.length > 20) {
    trail.shift(); // Remove oldest point to maintain performance
  }
}

// Class for walls (boundaries)
class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  show() {
    stroke(128, 0, 32);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

// Rays extending from the light source
class Ray {
  constructor(pos, angle, index) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
    this.index = index;
  }

  lookAt(x, y) {
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;
    this.dir.normalize();
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    line(0, 0, this.dir.x * 10, this.dir.y * 10);
    pop();
  }

  cast(wall) {
    const x1 = wall.a.x, y1 = wall.a.y;
    const x2 = wall.b.x, y2 = wall.b.y;
    const x3 = this.pos.x, y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x, y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) return;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
  }
}

// Light source particle with gradient rays
class Particle { 
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.rays = [];
    for (let a = 0; a < 360; a++) {
      this.rays.push(new Ray(this.pos, radians(a), a));
    }
  }

  update(x, y) {
    this.pos.set(x, y);
  }

  look(walls) {
    for (let ray of this.rays) {
      let closest = null;
      let record = Infinity;
      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }
      if (closest) {
        let t = (frameCount * 0.02 + ray.index * 0.01) % 1; 
        let col = lerpColor(color(0, 150, 255), color(255, 50, 50), t); 
        stroke(col);
        line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }
  }

  show() {
    fill(255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 8);
    for (let ray of this.rays) {
      ray.show();
    }
  }
}

// Function to create star boundaries
function createStarBoundaries(star) {
  let { x, y, outer, inner } = star;
  let angleStep = PI / 5;
  let vertices = [];

  for (let i = 0; i < 10; i++) {
    let angle = i * angleStep;
    let r = i % 2 === 0 ? outer : inner;
    let px = x + cos(angle) * r;
    let py = y + sin(angle) * r;
    vertices.push(createVector(px, py));
  }

  for (let i = 0; i < vertices.length; i++) {
    let a = vertices[i];
    let b = vertices[(i + 1) % vertices.length];
    walls.push(new Boundary(a.x, a.y, b.x, b.y));
  }
}
