import * as THREE from 'three';
import { CarStats, InputState, DriftEventState, PlayerSaveData } from './types';
import { CarModelBuilder, CarMeshes } from './car';
import { TrackBuilder, TrackScene } from './track';
import { VehiclePhysics } from './physics';
import { ChaseCamera } from './camera';
import { ParticleSystem } from './particles';
import { SkidmarkManager } from './skidmarks';
import { AudioManager } from './audio';
import { MinimapRenderer } from './minimap';

export interface GameCallbacks {
  onDriftUpdate: (drift: DriftEventState) => void;
  onFpsUpdate: (fps: number) => void;
  onPauseRequested: () => void;
}

export class GameManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraController: ChaseCamera;
  private trackScene: TrackScene;
  private carMeshes: CarMeshes;
  private physics: VehiclePhysics;
  private particles: ParticleSystem;
  private skidmarks: SkidmarkManager;
  private audio: AudioManager;
  private minimapRenderer: MinimapRenderer | null = null;
  private callbacks: GameCallbacks;

  private input: InputState = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    reset: false,
  };

  private keysDown: Record<string, boolean> = {};
  private isRunning = false;
  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  // Touch virtual inputs
  private touchSteer = 0;
  private touchThrottle = 0;
  private touchBrake = 0;
  private touchHandbrake = false;

  private steeringSensitivity = 1.0;

  constructor(
    container: HTMLElement,
    minimapCanvas: HTMLCanvasElement | null,
    carStats: CarStats,
    settings: PlayerSaveData['settings'],
    callbacks: GameCallbacks
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.steeringSensitivity = settings.steeringSensitivity;
    this.audio = AudioManager.getInstance();
    this.audio.init(settings.masterVolume, settings.engineVolume, settings.sfxVolume);

    // Three.js Scene - Bright Daylight Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sunny azure blue sky
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0022); // Soft atmospheric daytime haze

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.quality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.quality === 'high' ? 2 : 1));
    this.renderer.shadowMap.enabled = settings.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    container.appendChild(this.renderer.domElement);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.cameraController = new ChaseCamera(aspect);

    // Daylight Illumination
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.15); // Ambient daylight skylight
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e3a1e, 0.65); // Sky / Grass bounce
    this.scene.add(hemiLight);

    // Warm Sun DirectionalLight
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.9);
    sunLight.position.set(70, 120, -50);
    sunLight.castShadow = settings.quality === 'high';
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 280;
      sunLight.shadow.camera.left = -90;
      sunLight.shadow.camera.right = 90;
      sunLight.shadow.camera.top = 90;
      sunLight.shadow.camera.bottom = -90;
      sunLight.shadow.bias = -0.0004;
    }
    this.scene.add(sunLight);

    // Particles & Skidmarks
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    this.skidmarks = new SkidmarkManager();
    this.scene.add(this.skidmarks.group);

    // Build Track
    this.trackScene = TrackBuilder.buildIndustrialNight();
    this.scene.add(this.trackScene.group);

    // Minimap
    if (minimapCanvas) {
      this.minimapRenderer = new MinimapRenderer(minimapCanvas, this.trackScene.pathPoints);
    }

    // Car & Physics
    this.carMeshes = CarModelBuilder.createCar(carStats);
    this.scene.add(this.carMeshes.root);

    this.physics = new VehiclePhysics(carStats);
    this.physics.resetTo(this.trackScene.spawnPoint.position, this.trackScene.spawnPoint.rotationY);
    this.physics.syncCarVisuals(this.carMeshes);
    this.cameraController.reset(this.physics.position, this.physics.heading);

    // Event listeners
    this.setupInputs();
    window.addEventListener('resize', this.onResize);
  }

  private setupInputs(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keysDown[e.code] = true;
    if (e.key) {
      this.keysDown[e.key] = true;
      this.keysDown[e.key.toLowerCase()] = true;
      this.keysDown[e.key.toUpperCase()] = true;
    }

    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
      this.resetCarToNearestCheckpoint();
    }
    if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C') {
      this.cycleCamera();
    }
    if (e.code === 'Escape' || e.key === 'Escape') {
      this.callbacks.onPauseRequested();
    }
  };

  public cycleCamera(): string {
    const newMode = this.cameraController.cycleCameraMode();
    this.audio.playUiClick();
    const modeLabels: Record<string, string> = {
      chase: 'CÂMERA: TRASEIRA',
      close: 'CÂMERA: AÇÃO PERTO',
      hood: 'CÂMERA: CAPÔ (1ª PESSOA)',
    };
    this.physics.triggerCallout(modeLabels[newMode] || 'CÂMERA', 'drift');
    return newMode;
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown[e.code] = false;
    if (e.key) {
      this.keysDown[e.key] = false;
      this.keysDown[e.key.toLowerCase()] = false;
      this.keysDown[e.key.toUpperCase()] = false;
    }
  };

  private onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.cameraController.updateAspect(width / height);
    this.renderer.setSize(width, height);
  };

  public setTouchInputs(steer: number, throttle: number, brake: number, handbrake: boolean): void {
    this.touchSteer = steer;
    this.touchThrottle = throttle;
    this.touchBrake = brake;
    this.touchHandbrake = handbrake;
  }

  public updateCarStats(stats: CarStats): void {
    this.physics.applyStats(stats);
    CarModelBuilder.updateCarColor(this.carMeshes, stats.color);
  }

  public resetCarToNearestCheckpoint(): void {
    const cpIndex = this.physics.nearestCheckpointIndex;
    const cp = this.trackScene.checkpoints[cpIndex] || this.trackScene.spawnPoint;
    this.physics.resetTo(cp.position.clone(), cp.rotationY);
    this.cameraController.reset(this.physics.position, this.physics.heading);
    this.audio.playUiClick();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.audio.startEngine();
    this.animate(this.lastTime);
  }

  public pause(): void {
    this.isPaused = true;
    this.audio.stopEngine();
  }

  public resume(): void {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTime = performance.now();
    this.audio.startEngine();
    this.animate(this.lastTime);
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.audio.stopEngine();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  private gatherInputs(): InputState {
    let steer = 0;
    let throttle = 0;
    let brake = 0;
    let handbrake = false;

    // Keyboard inputs
    // Tecla D / Seta Direita move para a DIREITA
    // Tecla A / Seta Esquerda move para a ESQUERDA
    if (this.keysDown['KeyA'] || this.keysDown['a'] || this.keysDown['A'] || this.keysDown['ArrowLeft']) {
      steer += 1; // Curva para a ESQUERDA na tela
    }
    if (this.keysDown['KeyD'] || this.keysDown['d'] || this.keysDown['D'] || this.keysDown['ArrowRight']) {
      steer -= 1; // Curva para a DIREITA na tela
    }
    if (this.keysDown['KeyW'] || this.keysDown['w'] || this.keysDown['W'] || this.keysDown['ArrowUp']) {
      throttle += 1;
    }
    if (this.keysDown['KeyS'] || this.keysDown['s'] || this.keysDown['S'] || this.keysDown['ArrowDown']) {
      brake += 1;
    }
    if (this.keysDown['Space'] || this.keysDown[' ']) {
      handbrake = true;
    }

    // Combine with touch controls
    if (Math.abs(this.touchSteer) > 0.05) steer = this.touchSteer;
    if (this.touchThrottle > 0.05) throttle = Math.max(throttle, this.touchThrottle);
    if (this.touchBrake > 0.05) brake = Math.max(brake, this.touchBrake);
    if (this.touchHandbrake) handbrake = true;

    return {
      steer: THREE.MathUtils.clamp(steer, -1, 1),
      throttle: THREE.MathUtils.clamp(throttle, 0, 1),
      brake: THREE.MathUtils.clamp(brake, 0, 1),
      handbrake,
      reset: false,
    };
  }

  private animate = (now: number): void => {
    if (!this.isRunning || this.isPaused) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS Counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      const currentFps = Math.round((this.frameCount / this.fpsTimer));
      this.callbacks.onFpsUpdate(currentFps);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // 1. Gather Inputs
    this.input = this.gatherInputs();

    // 2. Physics Step
    const { sparksAt, impact, driftEvent } = this.physics.update(
      dt,
      this.input,
      this.trackScene.colliders,
      this.trackScene.checkpoints,
      this.steeringSensitivity
    );

    // 3. Audio & Haptics Feedback
    this.audio.updateEngine(this.physics.speedKmh, this.input.throttle);
    this.audio.updateTireSqueal(driftEvent.slipRatio, this.physics.speedKmh);

    if (impact > 1.5) {
      this.audio.playCollision(impact);
      this.cameraController.triggerShake(impact);
    }

    // 4. Update Visuals
    this.physics.syncCarVisuals(this.carMeshes);

    // Taillight brake glow
    if (this.input.brake > 0.1 || this.input.handbrake) {
      this.carMeshes.taillightMat.emissiveIntensity = 3.5;
    } else {
      this.carMeshes.taillightMat.emissiveIntensity = 0.8;
    }

    // 5. Particles Emission (Tire Smoke & Sparks)
    const forwardDir = new THREE.Vector3(Math.sin(this.physics.heading), 0, Math.cos(this.physics.heading));
    const rightDir = new THREE.Vector3(Math.cos(this.physics.heading), 0, -Math.sin(this.physics.heading));

    if (driftEvent.isDrifting || (this.input.handbrake && this.physics.speedKmh > 12)) {
      // Rear wheel smoke
      const rlWorld = this.physics.position.clone()
        .add(rightDir.clone().multiplyScalar(-0.95))
        .add(forwardDir.clone().multiplyScalar(-1.35));
      const rrWorld = this.physics.position.clone()
        .add(rightDir.clone().multiplyScalar(0.95))
        .add(forwardDir.clone().multiplyScalar(-1.35));

      this.particles.emitSmoke(rlWorld, this.physics.velocity);
      this.particles.emitSmoke(rrWorld, this.physics.velocity);

      // Leave skid marks on asphalt
      this.skidmarks.addMark(rlWorld, this.physics.heading, 0.65);
      this.skidmarks.addMark(rrWorld, this.physics.heading, 0.65);
    }

    if (sparksAt) {
      this.particles.emitSparks(sparksAt, 8);
    }

    this.particles.update(dt, this.cameraController.camera);
    this.skidmarks.update(dt);

    // 6. Camera Follow
    this.cameraController.update(
      dt,
      this.physics.position,
      this.physics.heading,
      this.physics.speedKmh,
      this.physics.steerAngle
    );

    // 7. Render 3D Scene
    this.renderer.render(this.scene, this.cameraController.camera);

    // 8. Render Minimap 2D Canvas
    if (this.minimapRenderer) {
      this.minimapRenderer.render(this.physics.position, this.physics.heading);
    }

    // 9. Notify React UI of Drift / HUD updates
    this.callbacks.onDriftUpdate(driftEvent);
  };

  public getScore(): number {
    return Math.round(this.physics.currentScore);
  }
}
