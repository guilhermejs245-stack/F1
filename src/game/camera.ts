import * as THREE from 'three';

export type CameraMode = 'chase' | 'close' | 'hood';

export class ChaseCamera {
  public camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity: number = 0;
  private shakeDecay: number = 4.0;
  private baseFov: number = 62;
  private mode: CameraMode = 'chase';

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.2, 800);
    this.currentPos.set(0, 5, -15);
    this.currentLookAt.set(0, 1, 0);
  }

  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public cycleCameraMode(): CameraMode {
    if (this.mode === 'chase') {
      this.mode = 'close';
    } else if (this.mode === 'close') {
      this.mode = 'hood';
    } else {
      this.mode = 'chase';
    }
    return this.mode;
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public reset(carPos: THREE.Vector3, headingY: number): void {
    const behindVec = new THREE.Vector3(
      -Math.sin(headingY) * 6.5,
      2.8,
      -Math.cos(headingY) * 6.5
    );
    this.currentPos.copy(carPos).add(behindVec);
    this.currentLookAt.copy(carPos).add(new THREE.Vector3(0, 1.0, 0));
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
    this.shakeIntensity = 0;
  }

  public triggerShake(intensity: number): void {
    this.shakeIntensity = Math.min(1.5, Math.max(this.shakeIntensity, intensity * 0.12));
  }

  public update(
    dt: number,
    carPos: THREE.Vector3,
    carHeading: number,
    speedKmh: number,
    steerAngle: number
  ): void {
    const delta = Math.min(dt, 0.05);

    // Speed-based distance & FOV adjustment
    const speedRatio = Math.min(1.0, speedKmh / 200);

    let chaseDistance = 6.2 + speedRatio * 1.8;
    let chaseHeight = 2.7 + speedRatio * 0.4;
    let targetFov = this.baseFov + speedRatio * 10;
    let lookAheadDist = 3.5 + speedRatio * 2.5;
    let lookAtHeight = 1.1;

    if (this.mode === 'close') {
      chaseDistance = 4.6 + speedRatio * 1.2;
      chaseHeight = 1.9 + speedRatio * 0.3;
      targetFov = 66 + speedRatio * 10;
      lookAheadDist = 4.0;
      lookAtHeight = 1.0;
    } else if (this.mode === 'hood') {
      // Hood camera (on the front hood of the car)
      chaseDistance = -0.5; // In front of cabin
      chaseHeight = 1.15;
      targetFov = 74 + speedRatio * 12;
      lookAheadDist = 12.0;
      lookAtHeight = 1.0;
    }

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 6 * delta);
    this.camera.updateProjectionMatrix();

    // Desired camera position
    const leanOffset = this.mode === 'hood' ? 0 : steerAngle * 0.7;
    const backX = -Math.sin(carHeading) * chaseDistance + Math.cos(carHeading) * leanOffset;
    const backZ = -Math.cos(carHeading) * chaseDistance - Math.sin(carHeading) * leanOffset;

    const desiredPos = new THREE.Vector3(
      carPos.x + backX,
      carPos.y + chaseHeight,
      carPos.z + backZ
    );

    // Desired look-at point
    const desiredLookAt = new THREE.Vector3(
      carPos.x + Math.sin(carHeading) * lookAheadDist,
      carPos.y + lookAtHeight,
      carPos.z + Math.cos(carHeading) * lookAheadDist
    );

    // Smooth lerping (faster lerp on hood camera for direct feeling)
    const lerpSpeed = this.mode === 'hood' ? 24 : 10;
    this.currentPos.lerp(desiredPos, lerpSpeed * delta);
    this.currentLookAt.lerp(desiredLookAt, 16 * delta);

    // Apply collision camera shake
    if (this.shakeIntensity > 0.01) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeZ = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.set(
        this.currentPos.x + shakeX,
        this.currentPos.y + shakeY,
        this.currentPos.z + shakeZ
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    } else {
      this.camera.position.copy(this.currentPos);
    }

    this.camera.lookAt(this.currentLookAt);
  }
}
