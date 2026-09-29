import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleStart: number;
  scaleEnd: number;
  active: boolean;
  type: 'smoke' | 'spark' | 'flame' | 'dust';
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private smokeMaterial: THREE.MeshBasicMaterial;
  private sparkMaterial: THREE.MeshBasicMaterial;
  private flameMaterial: THREE.MeshBasicMaterial;
  private dustMaterial: THREE.MeshBasicMaterial;

  private smokeGeo: THREE.PlaneGeometry;
  private sparkGeo: THREE.PlaneGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystem';

    // Procedural soft particle circular texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.5, 'rgba(230, 230, 240, 0.6)');
      grad.addColorStop(1, 'rgba(200, 200, 210, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const smokeTexture = new THREE.CanvasTexture(canvas);

    this.smokeMaterial = new THREE.MeshBasicMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.flameMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Cyan nitro flame
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dustMaterial = new THREE.MeshBasicMaterial({
      map: smokeTexture,
      color: 0x927055, // Sand/dirt color
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    this.smokeGeo = new THREE.PlaneGeometry(1, 1);
    this.sparkGeo = new THREE.PlaneGeometry(0.15, 0.15);

    // Pre-pool 120 particles
    for (let i = 0; i < 120; i++) {
      const mesh = new THREE.Mesh(this.smokeGeo, this.smokeMaterial);
      mesh.visible = false;
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scaleStart: 0.5,
        scaleEnd: 2.5,
        active: false,
        type: 'smoke',
      });
    }
  }

  private getFreeParticle(): Particle | null {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        return this.particles[i];
      }
    }
    return null;
  }

  public emitSmoke(position: THREE.Vector3, baseVelocity: THREE.Vector3, customColor?: string): void {
    const p = this.getFreeParticle();
    if (!p) return;

    p.type = 'smoke';
    p.mesh.geometry = this.smokeGeo;
    if (customColor) {
      // Cloned material or tinted
      p.mesh.material = this.smokeMaterial;
    } else {
      p.mesh.material = this.smokeMaterial;
    }

    p.mesh.position.copy(position);
    p.mesh.position.x += (Math.random() - 0.5) * 0.3;
    p.mesh.position.y += Math.random() * 0.1;
    p.mesh.position.z += (Math.random() - 0.5) * 0.3;

    p.velocity.set(
      baseVelocity.x * 0.15 + (Math.random() - 0.5) * 0.8,
      0.4 + Math.random() * 0.8,
      baseVelocity.z * 0.15 + (Math.random() - 0.5) * 0.8
    );

    p.life = 0;
    p.maxLife = 0.7 + Math.random() * 0.5;
    p.scaleStart = 0.4 + Math.random() * 0.2;
    p.scaleEnd = 2.0 + Math.random() * 1.5;
    p.mesh.scale.setScalar(p.scaleStart);
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
    p.active = true;
    p.mesh.visible = true;
  }

  public emitSparks(position: THREE.Vector3, count = 6): void {
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.type = 'spark';
      p.mesh.geometry = this.sparkGeo;
      p.mesh.material = this.sparkMaterial;
      p.mesh.position.copy(position);

      p.velocity.set(
        (Math.random() - 0.5) * 6,
        1.5 + Math.random() * 4,
        (Math.random() - 0.5) * 6
      );

      p.life = 0;
      p.maxLife = 0.25 + Math.random() * 0.2;
      p.scaleStart = 0.2;
      p.scaleEnd = 0.05;
      p.mesh.scale.setScalar(p.scaleStart);
      p.active = true;
      p.mesh.visible = true;
    }
  }

  public emitFlame(position: THREE.Vector3, forwardDir: THREE.Vector3): void {
    const p = this.getFreeParticle();
    if (!p) return;

    p.type = 'flame';
    p.mesh.geometry = this.sparkGeo;
    p.mesh.material = this.flameMaterial;
    p.mesh.position.copy(position);

    // Shoot backwards from exhaust
    p.velocity.set(
      -forwardDir.x * 3 + (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      -forwardDir.z * 3 + (Math.random() - 0.5) * 0.5
    );

    p.life = 0;
    p.maxLife = 0.15;
    p.scaleStart = 0.35;
    p.scaleEnd = 0.6;
    p.mesh.scale.setScalar(p.scaleStart);
    p.active = true;
    p.mesh.visible = true;
  }

  public update(dt: number, camera: THREE.Camera): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      const progress = p.life / p.maxLife;

      // Billboarding towards camera
      p.mesh.quaternion.copy(camera.quaternion);

      // Movement
      p.mesh.position.addScaledVector(p.velocity, dt);

      if (p.type === 'spark') {
        p.velocity.y -= 12 * dt; // Gravity on sparks
      } else if (p.type === 'smoke') {
        p.velocity.multiplyScalar(0.96); // Drag
      }

      // Scale expansion
      const currentScale = THREE.MathUtils.lerp(p.scaleStart, p.scaleEnd, progress);
      p.mesh.scale.setScalar(currentScale);

      // Fade out
      if (p.mesh.material instanceof THREE.MeshBasicMaterial) {
        if (p.type === 'smoke') {
          p.mesh.material.opacity = (1 - progress) * 0.6;
        } else if (p.type === 'spark') {
          p.mesh.material.opacity = (1 - progress);
        } else if (p.type === 'flame') {
          p.mesh.material.opacity = (1 - progress) * 0.9;
        }
      }
    }
  }

  public reset(): void {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
      this.particles[i].mesh.visible = false;
    }
  }
}
