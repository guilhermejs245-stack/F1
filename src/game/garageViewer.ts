import * as THREE from 'three';
import { CarStats } from './types';
import { CarModelBuilder, CarMeshes } from './car';

export class GarageViewer {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private carMeshes: CarMeshes | null = null;
  private turntable: THREE.Group;
  private animId: number | null = null;
  private isRotating = true;

  constructor(container: HTMLElement, initialCar: CarStats) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f17);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(4.5, 2.2, 5.5);
    this.camera.lookAt(0, 0.7, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    // Showroom Lighting
    const ambient = new THREE.AmbientLight(0x2a3b5c, 1.2);
    this.scene.add(ambient);

    const keyLight = new THREE.SpotLight(0x38bdf8, 4.0, 30, Math.PI / 4, 0.4);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0xf43f5e, 3.5, 30, Math.PI / 4, 0.5);
    rimLight.position.set(-6, 7, -6);
    this.scene.add(rimLight);

    const topFill = new THREE.DirectionalLight(0xffffff, 1.2);
    topFill.position.set(0, 10, 0);
    this.scene.add(topFill);

    // Turntable Pedestal
    this.turntable = new THREE.Group();
    const pedestalGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.3, 36);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.15;
    pedestal.receiveShadow = true;
    this.turntable.add(pedestal);

    // Neon edge ring
    const ringGeo = new THREE.TorusGeometry(3.3, 0.04, 16, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.01;
    this.turntable.add(ring);

    this.scene.add(this.turntable);

    // Load Initial Car
    this.setCar(initialCar);

    window.addEventListener('resize', this.onResize);
    this.start();
  }

  public setCar(stats: CarStats): void {
    if (this.carMeshes) {
      this.turntable.remove(this.carMeshes.root);
    }
    this.carMeshes = CarModelBuilder.createCar(stats);
    this.turntable.add(this.carMeshes.root);
  }

  public updateColor(hexColor: string): void {
    if (this.carMeshes) {
      CarModelBuilder.updateCarColor(this.carMeshes, hexColor);
    }
  }

  private onResize = (): void => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private start(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      if (this.isRotating) {
        this.turntable.rotation.y += 0.007;
      }
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  public destroy(): void {
    if (this.animId !== null) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
