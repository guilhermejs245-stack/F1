import * as THREE from 'three';
import { CarStats } from './types';

export interface CarMeshes {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyGroup: THREE.Group;
  wheelFL: THREE.Group;
  wheelFR: THREE.Group;
  wheelRL: THREE.Group;
  wheelRR: THREE.Group;
  headlightL: THREE.SpotLight;
  headlightR: THREE.SpotLight;
  taillightMat: THREE.MeshStandardMaterial;
  headlightMat: THREE.MeshStandardMaterial;
  exhaustLeftPos: THREE.Vector3;
  exhaustRightPos: THREE.Vector3;
  wheelSmokeRLPos: THREE.Vector3;
  wheelSmokeRRPos: THREE.Vector3;
}

export class CarModelBuilder {
  public static createCar(stats: CarStats): CarMeshes {
    const root = new THREE.Group();
    root.name = 'F1_Car';

    // Body roll group sits inside root to allow weight transfer tilting
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // ==========================================
    // 1. MATERIAIS DE FÓRMULA 1
    // ==========================================
    const paintColor = new THREE.Color(stats.color || '#ef4444');
    const liveryMaterial = new THREE.MeshStandardMaterial({
      color: paintColor,
      roughness: 0.18,
      metalness: 0.7,
      envMapIntensity: 1.5,
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416, // Fibra de carbono preta fosca
      roughness: 0.45,
      metalness: 0.85,
    });

    const haloMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1e22, // Halo de titânio
      roughness: 0.3,
      metalness: 0.9,
    });

    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Capacete esportivo amarelo dourado
      roughness: 0.2,
      metalness: 0.5,
    });

    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Viseira espelhada iridescente
      roughness: 0.1,
      metalness: 0.95,
    });

    // Pneus Slick F1 com faixa vermelha Soft
    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1f,
      roughness: 0.9,
      metalness: 0.05,
    });

    const pirelliRedMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, // Faixa Pirelli P-Zero Red Soft
    });

    const wheelCoverMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.35,
      metalness: 0.8,
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 3.5, // Luz de chuva / ERS FIA na traseira
      roughness: 0.2,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });

    // ==========================================
    // 2. MONOCOQUE & CHASSIS DE F1
    // ==========================================
    // Chassi central principal
    const chassisGeo = new THREE.BoxGeometry(0.72, 0.48, 2.6);
    const chassis = new THREE.Mesh(chassisGeo, liveryMaterial);
    chassis.position.set(0, 0.38, 0.1);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    bodyGroup.add(chassis);

    // Nariz / Bico de F1 (Nosecone afunilado para a frente)
    const noseGeo = new THREE.CylinderGeometry(0.24, 0.48, 1.8, 12);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, liveryMaterial);
    nose.position.set(0, 0.32, 1.95);
    nose.scale.set(0.85, 0.55, 1.0);
    nose.castShadow = true;
    bodyGroup.add(nose);

    // Bico frontal inferior pontiagudo
    const tipGeo = new THREE.ConeGeometry(0.25, 0.5, 12);
    tipGeo.rotateX(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, carbonMaterial);
    tip.position.set(0, 0.24, 2.85);
    tip.scale.set(1.1, 0.45, 1.0);
    bodyGroup.add(tip);

    // ==========================================
    // 3. ASA DIANTEIRA MULTI-ELEMENTO (FRONT WING)
    // ==========================================
    const frontWingGroup = new THREE.Group();
    frontWingGroup.position.set(0, 0.15, 2.55);

    // Lâmina principal da asa dianteira
    const fwMainGeo = new THREE.BoxGeometry(2.0, 0.04, 0.45);
    const fwMain = new THREE.Mesh(fwMainGeo, carbonMaterial);
    fwMain.castShadow = true;
    frontWingGroup.add(fwMain);

    // Flap superior da asa dianteira
    const fwFlapGeo = new THREE.BoxGeometry(1.85, 0.04, 0.25);
    const fwFlap = new THREE.Mesh(fwFlapGeo, liveryMaterial);
    fwFlap.position.set(0, 0.08, -0.06);
    fwFlap.rotation.x = -0.12;
    frontWingGroup.add(fwFlap);

    // Endplates da asa dianteira (placas laterais verticais)
    const endplateGeo = new THREE.BoxGeometry(0.04, 0.24, 0.55);
    const endplateL = new THREE.Mesh(endplateGeo, carbonMaterial);
    endplateL.position.set(-1.0, 0.1, 0);
    const endplateR = new THREE.Mesh(endplateGeo, carbonMaterial);
    endplateR.position.set(1.0, 0.1, 0);
    frontWingGroup.add(endplateL, endplateR);

    bodyGroup.add(frontWingGroup);

    // ==========================================
    // 4. COCKPIT, PILOTO COM CAPACETE E HALO FIA
    // ==========================================
    // Abertura do Cockpit
    const cockpitGeo = new THREE.BoxGeometry(0.48, 0.32, 0.85);
    const cockpitHole = new THREE.Mesh(cockpitGeo, carbonMaterial);
    cockpitHole.position.set(0, 0.52, 0.2);
    bodyGroup.add(cockpitHole);

    // Capacete do Piloto de F1
    const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const helmet = new THREE.Mesh(helmetGeo, helmetMaterial);
    helmet.position.set(0, 0.64, 0.1);
    helmet.castShadow = true;
    bodyGroup.add(helmet);

    // Viseira do Capacete
    const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.12);
    const visor = new THREE.Mesh(visorGeo, visorMaterial);
    visor.position.set(0, 0.64, 0.22);
    bodyGroup.add(visor);

    // HALO de Proteção em Titânio
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.62, 0.25);

    // Pilar central dianteiro do Halo
    const haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.28, 8), haloMaterial);
    haloPillar.position.set(0, 0.08, 0.35);
    haloPillar.rotation.x = -0.3;
    haloGroup.add(haloPillar);

    // Arco superior curvo do Halo
    const haloCurve = new THREE.TorusGeometry(0.26, 0.035, 8, 16, Math.PI);
    haloCurve.rotateX(Math.PI / 2);
    const haloRing = new THREE.Mesh(haloCurve, haloMaterial);
    haloRing.position.set(0, 0.18, 0.08);
    haloGroup.add(haloRing);

    bodyGroup.add(haloGroup);

    // ==========================================
    // 5. AIRBOX / TOMADA DE AR E CÂMERA T-CAM
    // ==========================================
    const airboxGeo = new THREE.CylinderGeometry(0.22, 0.35, 0.6, 10);
    const airbox = new THREE.Mesh(airboxGeo, liveryMaterial);
    airbox.position.set(0, 0.78, -0.25);
    airbox.rotation.x = -0.25;
    airbox.castShadow = true;
    bodyGroup.add(airbox);

    // Entrada de ar frontal do motor
    const scoopHole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), carbonMaterial);
    scoopHole.position.set(0, 0.94, -0.15);
    scoopHole.rotation.x = Math.PI / 2;
    bodyGroup.add(scoopHole);

    // T-Cam no topo do Airbox (câmera da transmissão de F1)
    const tcamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const tcam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.18), tcamMat);
    tcam.position.set(0, 1.05, -0.22);
    bodyGroup.add(tcam);

    // ==========================================
    // 6. SIDEPODS AERODINÂMICOS (PONTÕES LATERAIS)
    // ==========================================
    const createSidepod = (isLeft: boolean) => {
      const spGroup = new THREE.Group();
      const xPos = isLeft ? -0.58 : 0.58;
      spGroup.position.set(xPos, 0.32, -0.15);

      // Corpo principal do sidepod com curvatura
      const spBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 1.6), liveryMaterial);
      spBody.castShadow = true;
      spGroup.add(spBody);

      // Entrada de ar do radiador frontal
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.08), carbonMaterial);
      intake.position.set(0, 0.02, 0.81);
      spGroup.add(intake);

      // Degrau / corte inferior (undercut aerodinâmico)
      const undercut = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 1.6), carbonMaterial);
      undercut.position.set(0, -0.18, 0);
      spGroup.add(undercut);

      return spGroup;
    };

    bodyGroup.add(createSidepod(true));
    bodyGroup.add(createSidepod(false));

    // Assoalho inferior com efeito solo (Ground effect floor)
    const floorGeo = new THREE.BoxGeometry(1.78, 0.04, 2.7);
    const floor = new THREE.Mesh(floorGeo, carbonMaterial);
    floor.position.set(0, 0.14, -0.1);
    floor.receiveShadow = true;
    bodyGroup.add(floor);

    // ==========================================
    // 7. BARBATANA DE TUBARÃO E CAPÔ DO MOTOR
    // ==========================================
    const sharkFinGeo = new THREE.BoxGeometry(0.04, 0.42, 1.1);
    const sharkFin = new THREE.Mesh(sharkFinGeo, carbonMaterial);
    sharkFin.position.set(0, 0.72, -0.85);
    sharkFin.castShadow = true;
    bodyGroup.add(sharkFin);

    // ==========================================
    // 8. ASA TRASEIRA COM DRS E LUZ DE CHUVA
    // ==========================================
    const rearWingGroup = new THREE.Group();
    rearWingGroup.position.set(0, 0.75, -1.95);

    // Pilares centrais da asa traseira tipo "pescoço de cisne"
    const rwPillarGeo = new THREE.BoxGeometry(0.04, 0.55, 0.25);
    const rwPillarL = new THREE.Mesh(rwPillarGeo, carbonMaterial);
    rwPillarL.position.set(-0.25, 0, 0);
    const rwPillarR = new THREE.Mesh(rwPillarGeo, carbonMaterial);
    rwPillarR.position.set(0.25, 0, 0);
    rearWingGroup.add(rwPillarL, rwPillarR);

    // Lâmina principal da asa traseira
    const rwMainGeo = new THREE.BoxGeometry(1.65, 0.05, 0.42);
    const rwMain = new THREE.Mesh(rwMainGeo, liveryMaterial);
    rwMain.position.set(0, 0.25, 0);
    rwMain.rotation.x = -0.18;
    rwMain.castShadow = true;
    rearWingGroup.add(rwMain);

    // Flap superior com atuador DRS
    const rwDrsGeo = new THREE.BoxGeometry(1.6, 0.04, 0.22);
    const rwDrs = new THREE.Mesh(rwDrsGeo, carbonMaterial);
    rwDrs.position.set(0, 0.34, -0.08);
    rwDrs.rotation.x = -0.28;
    rearWingGroup.add(rwDrs);

    // Endplates da asa traseira
    const rwEndplateGeo = new THREE.BoxGeometry(0.04, 0.65, 0.6);
    const rwEndplateL = new THREE.Mesh(rwEndplateGeo, carbonMaterial);
    rwEndplateL.position.set(-0.82, 0.15, 0);
    const rwEndplateR = new THREE.Mesh(rwEndplateGeo, carbonMaterial);
    rwEndplateR.position.set(0.82, 0.15, 0);
    rearWingGroup.add(rwEndplateL, rwEndplateR);

    // Luz de Chuva FIA Traseira (pisca / acende no freio)
    const rainLightGeo = new THREE.BoxGeometry(0.18, 0.12, 0.05);
    const rainLight = new THREE.Mesh(rainLightGeo, taillightMat);
    rainLight.position.set(0, -0.38, 0.1);
    rearWingGroup.add(rainLight);

    bodyGroup.add(rearWingGroup);

    // Difusor de ar traseiro inferior
    const diffuserGeo = new THREE.BoxGeometry(1.2, 0.22, 0.45);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(0, 0.18, -1.8);
    diffuser.rotation.x = 0.35;
    bodyGroup.add(diffuser);

    // Escapamento central único de F1 (Turbo Hybrid V6)
    const exhaustGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.4, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustMesh.position.set(0, 0.38, -1.82);
    bodyGroup.add(exhaustMesh);

    // ==========================================
    // 9. RODAS ABERTAS COM TRIÂNGULOS DE SUSPENSÃO
    // ==========================================
    // Criação dos triângulos de suspensão visíveis
    const addSuspensionWishbones = (x: number, z: number, isFront: boolean) => {
      const wishboneGroup = new THREE.Group();
      wishboneGroup.position.set(x * 0.45, 0.32, z);

      const armGeo = new THREE.CylinderGeometry(0.02, 0.02, Math.abs(x) * 0.65, 6);
      armGeo.rotateZ(x > 0 ? Math.PI / 2 : -Math.PI / 2);

      // Braço superior
      const armTop = new THREE.Mesh(armGeo, carbonMaterial);
      armTop.position.set(x > 0 ? 0.25 : -0.25, 0.06, 0);
      wishboneGroup.add(armTop);

      // Braço inferior
      const armBottom = new THREE.Mesh(armGeo, carbonMaterial);
      armBottom.position.set(x > 0 ? 0.25 : -0.25, -0.08, 0);
      wishboneGroup.add(armBottom);

      bodyGroup.add(wishboneGroup);
    };

    addSuspensionWishbones(1.0, 1.45, true);
    addSuspensionWishbones(-1.0, 1.45, true);
    addSuspensionWishbones(1.0, -1.35, false);
    addSuspensionWishbones(-1.0, -1.35, false);

    // Rodas Abertas (Pneus Slick com faixa Pirelli)
    const createF1Wheel = (isFront: boolean) => {
      const wheelGroup = new THREE.Group();
      const radius = 0.36;
      const width = isFront ? 0.35 : 0.44; // Pneus traseiros mais largos

      // Borracha do pneu slick
      const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireRubberMat);
      tire.castShadow = true;
      tire.receiveShadow = true;
      wheelGroup.add(tire);

      // Faixa lateral colorida Pirelli Soft Vermelha
      const stripeGeo = new THREE.RingGeometry(radius * 0.72, radius * 0.82, 24);
      const stripeL = new THREE.Mesh(stripeGeo, pirelliRedMat);
      stripeL.position.set(-width / 2 - 0.005, 0, 0);
      stripeL.rotation.y = -Math.PI / 2;

      const stripeR = new THREE.Mesh(stripeGeo, pirelliRedMat);
      stripeR.position.set(width / 2 + 0.005, 0, 0);
      stripeR.rotation.y = Math.PI / 2;
      wheelGroup.add(stripeL, stripeR);

      // Calota aerodinâmica de F1
      const rimGeo = new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width * 0.95, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, wheelCoverMat);
      wheelGroup.add(rim);

      // Porca central de roda de F1
      const nutGeo = new THREE.CylinderGeometry(0.06, 0.06, width + 0.04, 12);
      nutGeo.rotateZ(Math.PI / 2);
      const nut = new THREE.Mesh(nutGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9 }));
      wheelGroup.add(nut);

      return wheelGroup;
    };

    const wheelFL = createF1Wheel(true);
    wheelFL.position.set(-1.02, 0.36, 1.45);
    root.add(wheelFL);

    const wheelFR = createF1Wheel(true);
    wheelFR.position.set(1.02, 0.36, 1.45);
    root.add(wheelFR);

    const wheelRL = createF1Wheel(false);
    wheelRL.position.set(-1.08, 0.36, -1.35);
    root.add(wheelRL);

    const wheelRR = createF1Wheel(false);
    wheelRR.position.set(1.08, 0.36, -1.35);
    root.add(wheelRR);

    // Iluminação do carro
    const headlightL = new THREE.SpotLight(0x38bdf8, 1.5, 40, Math.PI / 6, 0.4);
    headlightL.position.set(-0.5, 0.3, 2.0);
    headlightL.target.position.set(-0.5, 0, 16);
    root.add(headlightL);
    root.add(headlightL.target);

    const headlightR = new THREE.SpotLight(0x38bdf8, 1.5, 40, Math.PI / 6, 0.4);
    headlightR.position.set(0.5, 0.3, 2.0);
    headlightR.target.position.set(0.5, 0, 16);
    root.add(headlightR);
    root.add(headlightR.target);

    return {
      root,
      bodyMesh: chassis,
      bodyGroup,
      wheelFL,
      wheelFR,
      wheelRL,
      wheelRR,
      headlightL,
      headlightR,
      taillightMat,
      headlightMat,
      exhaustLeftPos: new THREE.Vector3(0, 0.38, -1.95),
      exhaustRightPos: new THREE.Vector3(0, 0.38, -1.95),
      wheelSmokeRLPos: new THREE.Vector3(-1.08, 0.18, -1.35),
      wheelSmokeRRPos: new THREE.Vector3(1.08, 0.18, -1.35),
    };
  }

  public static updateCarColor(carMeshes: CarMeshes, hexColor: string): void {
    if (carMeshes.bodyMesh && carMeshes.bodyMesh.material instanceof THREE.MeshStandardMaterial) {
      carMeshes.bodyMesh.material.color.set(hexColor);
    }
    carMeshes.bodyGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material === carMeshes.bodyMesh.material) {
        child.material.color.set(hexColor);
      }
    });
  }
}
