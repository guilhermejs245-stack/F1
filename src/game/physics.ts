import * as THREE from 'three';
import { CarStats, InputState, DriftEventState } from './types';
import { Collider, Checkpoint } from './track';
import { CarMeshes } from './car';

export class VehiclePhysics {
  // Vehicle state
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public heading: number = 0; // radians (Y rotation)
  public angularVelocity: number = 0;
  public speedKmh: number = 0;
  public steerAngle: number = 0;

  // Visual tilt for weight transfer
  public rollAngle: number = 0;
  public pitchAngle: number = 0;

  // Drift metrics
  public isDrifting: boolean = false;
  public driftAngle: number = 0; // in degrees
  public slipRatio: number = 0;
  public currentScore: number = 0;
  public combo: number = 1;
  public comboTimer: number = 0; // seconds remaining
  public comboMaxTimer: number = 2.4;
  public totalDriftDistance: number = 0;
  public lastDriftSign: number = 0; // for detecting transitions
  public transitionCount: number = 0;

  // Callouts
  public calloutText: string = '';
  public calloutType: 'drift' | 'amazing' | 'perfect' | 'lost' | null = null;
  public calloutTimer: number = 0;

  // Collision state
  public lastImpactIntensity: number = 0;
  public nearestCheckpointIndex: number = 0;

  // Vehicle stats config
  private maxForwardSpeed: number = 48; // m/s (~172 km/h base)
  private maxReverseSpeed: number = 12; // m/s (~43 km/h)
  private accelRate: number = 18;
  private brakeRate: number = 28;
  private dragCoeff: number = 0.45;
  private baseHandling: number = 2.8;
  private driftTraction: number = 0.88;

  constructor(public stats: CarStats) {
    this.applyStats(stats);
  }

  public applyStats(stats: CarStats): void {
    this.stats = stats;
    // Upgrade bonuses (each upgrade adds +6% to stat)
    const engBonus = 1 + (stats.upgrades.engine * 0.07);
    const tireBonus = 1 + (stats.upgrades.tires * 0.06);
    const suspBonus = 1 + (stats.upgrades.suspension * 0.05);
    const steerBonus = 1 + (stats.upgrades.steering * 0.06);
    const brakeBonus = 1 + (stats.upgrades.brakes * 0.07);

    // Formula 1 Spec: 340+ km/h top speed, 1000hp turbo-hybrid acceleration, 5G carbon brakes
    this.maxForwardSpeed = (stats.maxSpeed * 13.2) * engBonus; // ~95 m/s (~342 km/h)
    this.accelRate = (stats.acceleration * 5.4) * engBonus;    // Explosive 0-100 in 2.2s
    this.brakeRate = (stats.braking * 7.2) * brakeBonus;       // Carbon-carbon braking bite
    this.baseHandling = (stats.handling * 0.44) * steerBonus;
    this.driftTraction = THREE.MathUtils.clamp(1.0 - (stats.driftFactor * 0.02) * suspBonus * tireBonus, 0.82, 0.96);
  }

  public resetTo(position: THREE.Vector3, headingY: number): void {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.heading = headingY;
    this.angularVelocity = 0;
    this.speedKmh = 0;
    this.steerAngle = 0;
    this.rollAngle = 0;
    this.pitchAngle = 0;
    this.isDrifting = false;
    this.driftAngle = 0;
    this.slipRatio = 0;
  }

  public update(
    dt: number,
    input: InputState,
    colliders: Collider[],
    checkpoints: Checkpoint[],
    sensitivity = 1.0
  ): {
    sparksAt: THREE.Vector3 | null;
    impact: number;
    driftEvent: DriftEventState;
  } {
    // Clamp delta time to avoid physics tunneling
    const delta = Math.min(dt, 0.05);

    // 1. Steering with smooth progressive rate
    const speedRatio = Math.min(1.0, this.velocity.length() / this.maxForwardSpeed);
    const maxSteer = 0.52 * (1.0 - speedRatio * 0.3) * sensitivity;
    const targetSteer = input.steer * maxSteer;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, 8.5 * delta);

    // Forward and Lateral direction vectors
    const forwardDir = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const rightDir = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    // Project velocity into local coordinates
    const forwardSpeed = this.velocity.dot(forwardDir);
    const lateralSpeed = this.velocity.dot(rightDir);
    const currentSpeed = this.velocity.length();
    this.speedKmh = Math.round(currentSpeed * 3.6);

    // 2. Acceleration / Braking Forces
    let forwardForce = 0;

    if (input.throttle > 0) {
      if (forwardSpeed >= -1.0) {
        // Accelerating forward
        const powerCurve = 1.0 - Math.pow(Math.max(0, forwardSpeed) / this.maxForwardSpeed, 1.8);
        forwardForce += input.throttle * this.accelRate * Math.max(0.15, powerCurve);
      } else {
        // Braking while going backward
        forwardForce += input.throttle * this.brakeRate;
      }
    }

    if (input.brake > 0) {
      if (forwardSpeed > 1.0) {
        // Braking forward
        forwardForce -= input.brake * this.brakeRate;
      } else {
        // Reversing
        const revPowerCurve = 1.0 - Math.abs(forwardSpeed) / this.maxReverseSpeed;
        if (forwardSpeed > -this.maxReverseSpeed) {
          forwardForce -= input.brake * (this.accelRate * 0.6) * Math.max(0.1, revPowerCurve);
        }
      }
    }

    // Handbrake locks rear wheels & induces slide
    if (input.handbrake) {
      forwardForce -= 16;
    }

    // Tire scrub drag during drift: naturally decelerates the slide for realistic speed
    if (this.isDrifting) {
      const scrubDrag = Math.abs(lateralSpeed) * 14.0;
      forwardForce -= scrubDrag;
    }

    // Aerodynamic and rolling drag
    forwardForce -= forwardSpeed * this.dragCoeff;

    // Apply forward force along heading
    this.velocity.addScaledVector(forwardDir, forwardForce * delta);

    // 3. Lateral Grip & Drift Dynamics
    const driftAngleRad = Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed) + 0.01);
    this.driftAngle = THREE.MathUtils.radToDeg(driftAngleRad);

    const isMovingForward = forwardSpeed > 3.0;
    const isSlideAngle = this.driftAngle > 10;
    const handbrakeSlide = input.handbrake && isMovingForward;

    this.isDrifting = isMovingForward && (isSlideAngle || handbrakeSlide) && this.speedKmh > 16;

    // Slip ratio for tire squeal and smoke
    this.slipRatio = THREE.MathUtils.clamp(
      (Math.abs(lateralSpeed) / (currentSpeed + 2.0)) * 1.4 + (input.handbrake ? 0.35 : 0),
      0,
      1
    );

    // F1 Aerodynamic Downforce: ground effect & wings increase grip at high speeds
    const downforceBonus = Math.min(0.04, (currentSpeed / 95) * 0.04);
    let lateralGrip = (this.isDrifting ? 0.92 : 0.97) + downforceBonus;
    if (input.handbrake) {
      lateralGrip = 0.84; // Controlled handbrake initiation
    }

    // Apply lateral damping
    const targetLateralSpeed = lateralSpeed * Math.pow(1 - lateralGrip, delta * 24);
    this.velocity.addScaledVector(rightDir, -(lateralSpeed - targetLateralSpeed));

    // 4. Yaw Rotation (Controlled, Weighted Drift Swing)
    let turnFactor = (forwardSpeed / 14) * (this.baseHandling * 0.85);
    turnFactor = THREE.MathUtils.clamp(turnFactor, -this.baseHandling * 1.1, this.baseHandling * 1.1);

    let targetYawRate = this.steerAngle * turnFactor;

    // Gentle, progressive oversteer swing during drift (not snappy or violent)
    if (this.isDrifting) {
      const slideDir = Math.sign(lateralSpeed);
      // Progressive oversteer swing
      targetYawRate += slideDir * Math.min(0.65, (this.driftAngle / 45) * 0.55);

      // Counter-steering allows player to easily catch and hold the drift angle
      if (Math.sign(input.steer) !== slideDir && Math.abs(input.steer) > 0.1) {
        targetYawRate += input.steer * this.baseHandling * 1.15;
      }

      // Detect drift transition
      if (this.lastDriftSign !== 0 && slideDir !== 0 && this.lastDriftSign !== slideDir) {
        this.transitionCount++;
        this.currentScore += 350 * this.combo;
        this.triggerCallout('TRANSITION!', 'amazing');
      }
      this.lastDriftSign = slideDir;
    } else {
      this.lastDriftSign = 0;
    }

    // Clamp maximum yaw rotational velocity to prevent uncontrollable spinning
    targetYawRate = THREE.MathUtils.clamp(targetYawRate, -2.4, 2.4);

    // Weighted inertia: smoother interpolation gives the car real chassis mass
    this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, targetYawRate, 6.8 * delta);
    this.heading += this.angularVelocity * delta;

    // 5. Weight Transfer Tilting (body roll & pitch)
    const targetRoll = -lateralSpeed * 0.025; // rolls outward during turn
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, THREE.MathUtils.clamp(targetRoll, -0.12, 0.12), 10 * delta);

    const targetPitch = (forwardForce / this.accelRate) * 0.04;
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, THREE.MathUtils.clamp(targetPitch, -0.08, 0.08), 10 * delta);

    // 6. Integrate Position
    this.position.addScaledVector(this.velocity, delta);

    // 7. Collision Detection & Response
    let sparksAt: THREE.Vector3 | null = null;
    let impactIntensity = 0;
    const carRadius = 1.1;

    // F1 Titanium Plank Skid Sparks: iconic showers of sparks under high-speed downforce (> 210 km/h)
    if (this.speedKmh > 210 && input.throttle > 0.3 && Math.random() < 0.4) {
      sparksAt = this.position.clone().addScaledVector(forwardDir, -0.75);
      sparksAt.y = 0.05;
    }

    for (let i = 0; i < colliders.length; i++) {
      const col = colliders[i];

      if (col.type === 'box') {
        const halfX = col.size.x / 2 + carRadius;
        const halfZ = col.size.z / 2 + carRadius;
        const dx = this.position.x - col.position.x;
        const dz = this.position.z - col.position.z;

        if (Math.abs(dx) < halfX && Math.abs(dz) < halfZ) {
          // Collision overlap
          const overlapX = halfX - Math.abs(dx);
          const overlapZ = halfZ - Math.abs(dz);

          let normal = new THREE.Vector3();
          if (overlapX < overlapZ) {
            normal.x = Math.sign(dx);
            this.position.x += normal.x * overlapX;
          } else {
            normal.z = Math.sign(dz);
            this.position.z += normal.z * overlapZ;
          }

          // Bounce / deflection
          const hitVelocity = this.velocity.dot(normal);
          if (hitVelocity < 0) {
            impactIntensity = Math.abs(hitVelocity);
            this.velocity.addScaledVector(normal, -hitVelocity * 1.35); // bounce
            this.velocity.multiplyScalar(0.75); // absorb speed
            sparksAt = this.position.clone().sub(normal.clone().multiplyScalar(0.9));
          }
        }
      } else if (col.type === 'cylinder') {
        const radius = col.size.x + carRadius;
        const dx = this.position.x - col.position.x;
        const dz = this.position.z - col.position.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;
          const normal = new THREE.Vector3(nx, 0, nz);
          const overlap = radius - dist;

          this.position.x += nx * overlap;
          this.position.z += nz * overlap;

          const hitVelocity = this.velocity.dot(normal);
          if (hitVelocity < 0) {
            impactIntensity = Math.abs(hitVelocity);
            this.velocity.addScaledVector(normal, -hitVelocity * 1.3);
            this.velocity.multiplyScalar(0.7);
            sparksAt = this.position.clone().sub(normal.clone().multiplyScalar(0.9));
          }
        }
      } else if (col.type === 'cone' && col.mesh && col.movable) {
        // Knockable cone!
        const dx = this.position.x - col.position.x;
        const dz = this.position.z - col.position.z;
        const distSq = dx * dx + dz * dz;
        const coneRadius = 0.9;

        if (distSq < coneRadius * coneRadius) {
          // Push cone away with car velocity
          if (!col.velocity) col.velocity = new THREE.Vector3();
          col.velocity.set(
            this.velocity.x * 1.2 + (Math.random() - 0.5) * 4,
            3.0 + Math.random() * 2,
            this.velocity.z * 1.2 + (Math.random() - 0.5) * 4
          );
          col.mesh.rotation.z += 1.5;
        }

        // Update cone physics if launched
        if (col.velocity && col.velocity.lengthSq() > 0.01) {
          col.position.addScaledVector(col.velocity, delta);
          col.velocity.y -= 14 * delta; // gravity
          if (col.position.y < 0.35) {
            col.position.y = 0.35;
            col.velocity.y = -col.velocity.y * 0.4;
            col.velocity.x *= 0.85;
            col.velocity.z *= 0.85;
          }
        }
      }
    }

    // Hard collision penalties
    if (impactIntensity > 7.0) {
      if (this.combo > 1 || this.currentScore > 500) {
        this.triggerCallout('COMBO LOST!', 'lost');
      }
      this.combo = 1;
      this.comboTimer = 0;
      this.currentScore = Math.max(0, this.currentScore - 300);
    }

    this.lastImpactIntensity = impactIntensity;

    // 8. Proximity to barriers detection (for bonus points)
    let proximityBonus = false;
    for (let i = 0; i < colliders.length; i += 4) {
      const col = colliders[i];
      const dist = this.position.distanceTo(col.position);
      if (dist < 3.2 && dist > 1.2 && this.isDrifting) {
        proximityBonus = true;
        break;
      }
    }

    // 9. Drift Scoring Engine
    if (this.isDrifting) {
      this.comboTimer = this.comboMaxTimer; // Refresh combo timer
      this.totalDriftDistance += currentSpeed * delta;

      // Base score per second + angle factor + speed bonus
      const angleFactor = Math.min(2.5, this.driftAngle / 28);
      const speedFactor = Math.min(2.2, this.speedKmh / 60);
      const proxFactor = proximityBonus ? 1.6 : 1.0;

      const scoreRate = 80 * angleFactor * speedFactor * proxFactor;
      this.currentScore += scoreRate * this.combo * delta;

      // Combo progression based on sustained drift time & angle
      if (this.totalDriftDistance > this.combo * 28 && this.combo < 10) {
        this.combo++;
        if (this.combo >= 8) {
          this.triggerCallout('PERFECT DRIFT!', 'perfect');
        } else if (this.combo >= 4) {
          this.triggerCallout('AMAZING DRIFT!', 'amazing');
        } else {
          this.triggerCallout(`COMBO x${this.combo}!`, 'drift');
        }
      }
    } else {
      // Deplete combo timer when not drifting
      if (this.comboTimer > 0) {
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
          if (this.combo > 2) {
            this.triggerCallout('COMBO LOST', 'lost');
          }
          this.combo = 1;
          this.totalDriftDistance = 0;
        }
      }
    }

    // Update callout timer
    if (this.calloutTimer > 0) {
      this.calloutTimer -= delta;
      if (this.calloutTimer <= 0) {
        this.calloutType = null;
      }
    }

    // 10. Track Checkpoint Tracking for safe respawn
    let closestDist = Infinity;
    for (let i = 0; i < checkpoints.length; i++) {
      const d = this.position.distanceTo(checkpoints[i].position);
      if (d < closestDist) {
        closestDist = d;
        this.nearestCheckpointIndex = i;
      }
    }

    return {
      sparksAt,
      impact: impactIntensity,
      driftEvent: {
        isDrifting: this.isDrifting,
        angle: Math.round(this.driftAngle),
        speedKmh: this.speedKmh,
        score: Math.round(this.currentScore),
        combo: this.combo,
        comboTimer: Math.max(0, this.comboTimer / this.comboMaxTimer),
        multiplier: this.combo,
        calloutText: this.calloutText,
        calloutType: this.calloutType,
        proximityBonus,
        slipRatio: this.slipRatio,
      },
    };
  }

  public triggerCallout(text: string, type: 'drift' | 'amazing' | 'perfect' | 'lost'): void {
    this.calloutText = text;
    this.calloutType = type;
    this.calloutTimer = 1.6;
  }

  public syncCarVisuals(meshes: CarMeshes): void {
    // Car root position & heading
    meshes.root.position.copy(this.position);
    meshes.root.rotation.y = this.heading;

    // Body roll and pitch weight transfer
    meshes.bodyGroup.rotation.z = this.rollAngle;
    meshes.bodyGroup.rotation.x = this.pitchAngle;

    // Steer front wheels
    meshes.wheelFL.rotation.y = this.steerAngle;
    meshes.wheelFR.rotation.y = this.steerAngle;

    // Wheel roll rotation based on forward movement
    const rollDelta = (this.velocity.dot(new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading))) * 0.016) / 0.34;
    meshes.wheelFL.children[0]?.rotation.set(meshes.wheelFL.children[0].rotation.x + rollDelta, 0, 0);
    meshes.wheelFR.children[0]?.rotation.set(meshes.wheelFR.children[0].rotation.x + rollDelta, 0, 0);
    meshes.wheelRL.children[0]?.rotation.set(meshes.wheelRL.children[0].rotation.x + rollDelta, 0, 0);
    meshes.wheelRR.children[0]?.rotation.set(meshes.wheelRR.children[0].rotation.x + rollDelta, 0, 0);
  }
}
