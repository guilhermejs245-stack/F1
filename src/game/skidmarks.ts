import * as THREE from 'three';

interface SkidPoint {
  leftPos: THREE.Vector3;
  rightPos: THREE.Vector3;
  mesh: THREE.Mesh;
  opacity: number;
  active: boolean;
}

export class SkidmarkManager {
  public group: THREE.Group;
  private marks: SkidPoint[] = [];
  private maxMarks = 100;
  private markIndex = 0;
  private lastLeftPos: THREE.Vector3 | null = null;
  private lastRightPos: THREE.Vector3 | null = null;
  private material: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Skidmarks';

    this.material = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -1.0,
    });

    const markGeo = new THREE.PlaneGeometry(0.3, 0.7);
    markGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.maxMarks; i++) {
      const mesh = new THREE.Mesh(markGeo.clone(), this.material.clone());
      mesh.visible = false;
      this.group.add(mesh);
      this.marks.push({
        leftPos: new THREE.Vector3(),
        rightPos: new THREE.Vector3(),
        mesh,
        opacity: 0,
        active: false,
      });
    }
  }

  public addMark(pos: THREE.Vector3, headingRad: number, opacity = 0.6): void {
    const mark = this.marks[this.markIndex];
    mark.mesh.position.set(pos.x, 0.025, pos.z);
    mark.mesh.rotation.y = headingRad;
    mark.opacity = opacity;
    (mark.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    mark.mesh.visible = true;
    mark.active = true;

    this.markIndex = (this.markIndex + 1) % this.maxMarks;
  }

  public update(dt: number): void {
    // Fade out old skid marks slowly
    for (let i = 0; i < this.marks.length; i++) {
      const m = this.marks[i];
      if (m.active) {
        m.opacity -= dt * 0.05; // Fades out over ~20 seconds
        if (m.opacity <= 0) {
          m.active = false;
          m.mesh.visible = false;
        } else {
          (m.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, m.opacity);
        }
      }
    }
  }

  public clear(): void {
    for (let i = 0; i < this.marks.length; i++) {
      this.marks[i].active = false;
      this.marks[i].mesh.visible = false;
    }
    this.lastLeftPos = null;
    this.lastRightPos = null;
  }
}
