import * as THREE from 'three';

export class MinimapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private pathPoints: THREE.Vector2[];
  private minX = Infinity;
  private maxX = -Infinity;
  private minZ = Infinity;
  private maxZ = -Infinity;

  constructor(canvas: HTMLCanvasElement, pathPoints: THREE.Vector2[]) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pathPoints = pathPoints;

    // Calculate bounding box of track
    pathPoints.forEach(p => {
      if (p.x < this.minX) this.minX = p.x;
      if (p.x > this.maxX) this.maxX = p.x;
      if (p.y < this.minZ) this.minZ = p.y;
      if (p.y > this.maxZ) this.maxZ = p.y;
    });

    // Add margin
    const margin = 20;
    this.minX -= margin;
    this.maxX += margin;
    this.minZ -= margin;
    this.maxZ += margin;
  }

  private mapCoords(x: number, z: number, width: number, height: number): [number, number] {
    const normX = (x - this.minX) / (this.maxX - this.minX);
    const normZ = (z - this.minZ) / (this.maxZ - this.minZ);
    // Canvas Y is top-down; world Z is typically mapped to Y
    return [normX * width, normZ * height];
  }

  public render(playerPos: THREE.Vector3, playerHeading: number): void {
    if (!this.ctx) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Dark semi-transparent radar background
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.pathPoints.length < 2) return;

    // Draw track path
    ctx.beginPath();
    const [startX, startY] = this.mapCoords(this.pathPoints[0].x, this.pathPoints[0].y, width, height);
    ctx.moveTo(startX, startY);

    for (let i = 1; i < this.pathPoints.length; i++) {
      const [px, py] = this.mapCoords(this.pathPoints[i].x, this.pathPoints[i].y, width, height);
      ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Track asphalt stroke
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Track center line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Player Indicator (arrow + neon dot)
    const [carX, carY] = this.mapCoords(playerPos.x, playerPos.z, width, height);

    ctx.save();
    ctx.translate(carX, carY);
    // Angle in canvas: heading in world is Y rotation, world X is canvas X, world Z is canvas Y
    // dx = sin(heading), dz = cos(heading) -> canvas angle = atan2(sin, cos)
    ctx.rotate(playerHeading);

    // Glowing dot
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-4, -5);
    ctx.lineTo(0, -3);
    ctx.lineTo(4, -5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
