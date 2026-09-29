import * as THREE from 'three';

export interface Collider {
  type: 'box' | 'cylinder' | 'cone';
  position: THREE.Vector3;
  size: THREE.Vector3;
  mesh?: THREE.Mesh | THREE.Group;
  movable?: boolean;
  velocity?: THREE.Vector3;
}

export interface Checkpoint {
  position: THREE.Vector3;
  rotationY: number;
}

export interface TrackScene {
  group: THREE.Group;
  colliders: Collider[];
  spawnPoint: { position: THREE.Vector3; rotationY: number };
  checkpoints: Checkpoint[];
  pathPoints: THREE.Vector2[]; // For 2D Minimap
  ambientLightColor: number;
  fogColor: number;
}

export class TrackBuilder {
  public static buildAutodromo(): TrackScene {
    const group = new THREE.Group();
    group.name = 'AutodromoCircuit';
    const colliders: Collider[] = [];

    // ==========================================
    // 1. MATERIAIS DO AUTÓDROMO
    // ==========================================
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x17191d, // Asfalto escuro emborrachado com traçado de corrida
      roughness: 0.72,
      metalness: 0.2,
    });

    const groundAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x24272e, // Asfalto do pátio / complexo automobilístico (100% asfalto, sem grama)
      roughness: 0.88,
      metalness: 0.1,
    });

    const blueRunoffMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Faixa de escape em asfalto azul de alta fricção (estilo Paul Ricard / Yas Marina)
      roughness: 0.75,
      metalness: 0.1,
    });

    const redRunoffMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Faixa de escape vermelha de asfalto
      roughness: 0.75,
      metalness: 0.1,
    });

    const kerbRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.45,
    });

    const kerbWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
    });

    const armcoBarrierMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Guard-rail metálico galvanizado
      metalness: 0.8,
      roughness: 0.3,
    });

    const pitBuildingMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Concreto arquitetônico claro dos boxes
      roughness: 0.4,
      metalness: 0.2,
    });

    const pitGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vidro azul da sala VIP e torre de controle
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75,
    });

    const grandstandRoofMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.5,
    });

    const tireBlackMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });

    const tireWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.7,
    });

    // ==========================================
    // 2. TERRENO TOTALMENTE DE ASFALTO (COMPLEXO AUTOMOBILÍSTICO)
    // ==========================================
    const groundGeo = new THREE.PlaneGeometry(800, 800);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, groundAsphaltMat);
    ground.receiveShadow = true;
    group.add(ground);

    // ==========================================
    // 3. TRAÇADO DO AUTÓDROMO (CURVAS E RETAS)
    // ==========================================
    // Traçado autêntico de circuito de corrida:
    // - Reta Principal com Grid e Boxes (x=0, z=-70 a 40)
    // - Curva 1: Chicane técnica "S do Senna" (z=40 a 90)
    // - Curva 2: Reta rápida intermediária
    // - Curva 3: Curva da Ferradura / Hairpin (raio amplo para drift longo)
    // - Curva 4: Sequência veloz de "Esse"
    // - Curva 5: Longa Parabólica contínua
    // - Curva 6: Curva da Junção retornando à reta principal
    const pathNodes: THREE.Vector3[] = [
      new THREE.Vector3(0, 0.02, -70),   // Reta Principal (Largada / Grid)
      new THREE.Vector3(0, 0.02, -20),   // Reta Principal
      new THREE.Vector3(0, 0.02, 35),    // Final da Reta Principal
      new THREE.Vector3(12, 0.02, 75),   // Entrada Curva 1 (S do Senna)
      new THREE.Vector3(38, 0.02, 95),   // Apex Curva 1
      new THREE.Vector3(72, 0.02, 90),   // Saída Curva 1
      new THREE.Vector3(100, 0.02, 60),  // Reta Oposta
      new THREE.Vector3(115, 0.02, 15),  // Aproximação da Ferradura
      new THREE.Vector3(135, 0.02, -25), // Hairpin Apex externo
      new THREE.Vector3(115, 0.02, -65), // Hairpin Apex interno
      new THREE.Vector3(80, 0.02, -60),  // Saída do Hairpin
      new THREE.Vector3(55, 0.02, -35),  // Esses de Alta (Esquerda)
      new THREE.Vector3(35, 0.02, -15),  // Esses de Alta (Direita)
      new THREE.Vector3(20, 0.02, -35),  // Transição para o Miolo
      new THREE.Vector3(-25, 0.02, -60), // Entrada da Parabólica
      new THREE.Vector3(-75, 0.02, -65), // Parabólica Sul
      new THREE.Vector3(-105, 0.02, -20),// Parabólica Ápice Longo
      new THREE.Vector3(-100, 0.02, 30), // Parabólica Saída
      new THREE.Vector3(-65, 0.02, 60),  // Curva da Junção
      new THREE.Vector3(-30, 0.02, 35),  // Subida dos Boxes
      new THREE.Vector3(-10, 0.02, -25), // Alinhamento com a Reta
    ];

    const curve = new THREE.CatmullRomCurve3(pathNodes, true, 'centripetal', 0.5);
    const sampledPoints = curve.getPoints(180);
    const pathPoints2D: THREE.Vector2[] = sampledPoints.map(p => new THREE.Vector2(p.x, p.z));

    // ==========================================
    // 4. FITA DE ASFALTO COM LINHAS BRANCAS
    // ==========================================
    const trackWidth = 15.0; // Pista larga padrão FIA para drift e corrida
    const ribbonGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= sampledPoints.length; i++) {
      const idx = i % sampledPoints.length;
      const nextIdx = (i + 1) % sampledPoints.length;
      const pt = sampledPoints[idx];
      const nextPt = sampledPoints[nextIdx];

      const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, trackWidth / 2);
      const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -trackWidth / 2);

      positions.push(leftPt.x, 0.03, leftPt.z);
      positions.push(rightPt.x, 0.03, rightPt.z);

      uvs.push(0, i * 0.15);
      uvs.push(1, i * 0.15);

      if (i < sampledPoints.length) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    ribbonGeo.setIndex(indices);
    ribbonGeo.computeVertexNormals();

    const trackMesh = new THREE.Mesh(ribbonGeo, asphaltMat);
    trackMesh.receiveShadow = true;
    group.add(trackMesh);

    // Linhas brancas de limite da pista (Track limits)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < sampledPoints.length; i += 2) {
      const pt = sampledPoints[i];
      const nextPt = sampledPoints[(i + 1) % sampledPoints.length];
      const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      // Linha branca esquerda
      const leftLinePos = new THREE.Vector3().copy(pt).addScaledVector(normal, trackWidth / 2 - 0.25);
      const lMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3.2), lineMat);
      lMesh.rotation.x = -Math.PI / 2;
      lMesh.rotation.z = -angle;
      lMesh.position.set(leftLinePos.x, 0.035, leftLinePos.z);
      group.add(lMesh);

      // Linha branca direita
      const rightLinePos = new THREE.Vector3().copy(pt).addScaledVector(normal, -(trackWidth / 2 - 0.25));
      const rMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3.2), lineMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.rotation.z = -angle;
      rMesh.position.set(rightLinePos.x, 0.035, rightLinePos.z);
      group.add(rMesh);
    }

    // ==========================================
    // 5. GRID DE LARGADA & LINHA DE CHEGADA XADREZ
    // ==========================================
    // Linha de chegada quadriculada na reta principal (z = -40)
    const checkeredCanvas = document.createElement('canvas');
    checkeredCanvas.width = 128;
    checkeredCanvas.height = 128;
    const cCtx = checkeredCanvas.getContext('2d');
    if (cCtx) {
      cCtx.fillStyle = '#ffffff';
      cCtx.fillRect(0, 0, 128, 128);
      cCtx.fillStyle = '#000000';
      const size = 32;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if ((x + y) % 2 === 1) {
            cCtx.fillRect(x * size, y * size, size, size);
          }
        }
      }
    }
    const checkeredTexture = new THREE.CanvasTexture(checkeredCanvas);
    checkeredTexture.wrapS = THREE.RepeatWrapping;
    checkeredTexture.wrapT = THREE.RepeatWrapping;
    checkeredTexture.repeat.set(12, 2);

    const finishLineMat = new THREE.MeshBasicMaterial({ map: checkeredTexture });
    const finishLineGeo = new THREE.PlaneGeometry(trackWidth - 0.5, 3.5);
    finishLineGeo.rotateX(-Math.PI / 2);
    const finishLine = new THREE.Mesh(finishLineGeo, finishLineMat);
    finishLine.position.set(0, 0.04, -40);
    group.add(finishLine);

    // Caixas de Grid de Largada numeradas na reta principal
    for (let slot = 0; slot < 8; slot++) {
      const zSlot = -48 - slot * 9;
      const xSlot = slot % 2 === 0 ? -3.0 : 3.0; // Posições escalonadas de largada

      const gridBoxGeo = new THREE.PlaneGeometry(2.4, 4.5);
      gridBoxGeo.rotateX(-Math.PI / 2);
      const gridBoxMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      });
      const gridBox = new THREE.Mesh(gridBoxGeo, gridBoxMat);
      gridBox.position.set(xSlot, 0.038, zSlot);
      group.add(gridBox);
    }

    // ==========================================
    // 6. ZEBRAS ELEVADAS (CURBS) E CAIXAS DE BRITA
    // ==========================================
    // Posiciona zebras em vermelho/branco nas curvas externas e internas
    for (let i = 0; i < sampledPoints.length; i += 2) {
      const pt = sampledPoints[i];
      const nextPt = sampledPoints[(i + 1) % sampledPoints.length];
      const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      // Zebras na borda esquerda
      const kerbLPos = new THREE.Vector3().copy(pt).addScaledVector(normal, trackWidth / 2 + 0.45);
      const kerbL = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.12, 3.2),
        (i / 2) % 2 === 0 ? kerbRedMat : kerbWhiteMat
      );
      kerbL.position.set(kerbLPos.x, 0.06, kerbLPos.z);
      kerbL.rotation.y = angle;
      kerbL.castShadow = true;
      group.add(kerbL);

      // Zebras na borda direita
      const kerbRPos = new THREE.Vector3().copy(pt).addScaledVector(normal, -(trackWidth / 2 + 0.45));
      const kerbR = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.12, 3.2),
        (i / 2) % 2 === 0 ? kerbRedMat : kerbWhiteMat
      );
      kerbR.position.set(kerbRPos.x, 0.06, kerbRPos.z);
      kerbR.rotation.y = angle;
      kerbR.castShadow = true;
      group.add(kerbR);
    }

    // Zonas de escape em asfalto de alta fricção pintado (estilo circuitos modernos FIA / Paul Ricard)
    const runoffZones = [
      { x: 50, z: 105, radius: 26 }, // Saída da Curva 1
      { x: 145, z: -30, radius: 30 }, // Fora do Hairpin
      { x: -120, z: -20, radius: 34 },// Fora da Parabólica
    ];
    runoffZones.forEach(rz => {
      // Faixa externa vermelha de asfalto
      const outerRing = new THREE.Mesh(new THREE.RingGeometry(rz.radius * 0.65, rz.radius, 32), redRunoffMat);
      outerRing.rotation.x = -Math.PI / 2;
      outerRing.position.set(rz.x, 0.026, rz.z);
      group.add(outerRing);

      // Faixa interna azul de asfalto
      const innerDisk = new THREE.Mesh(new THREE.CircleGeometry(rz.radius * 0.65, 32), blueRunoffMat);
      innerDisk.rotation.x = -Math.PI / 2;
      innerDisk.position.set(rz.x, 0.025, rz.z);
      group.add(innerDisk);
    });

    // ==========================================
    // 7. GUARD-RAILS FIA E BARREIRAS DE PNEUS
    // ==========================================
    for (let i = 0; i < sampledPoints.length; i += 3) {
      const pt = sampledPoints[i];
      const nextPt = sampledPoints[(i + 1) % sampledPoints.length];
      const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      // Guard-rail exterior com cerca de segurança
      const bOuterPos = new THREE.Vector3().copy(pt).addScaledVector(normal, trackWidth / 2 + 1.8);
      const guardRail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 5.0), armcoBarrierMat);
      guardRail.position.set(bOuterPos.x, 0.6, bOuterPos.z);
      guardRail.rotation.y = angle;
      guardRail.castShadow = true;
      guardRail.receiveShadow = true;
      group.add(guardRail);

      colliders.push({
        type: 'box',
        position: guardRail.position.clone(),
        size: new THREE.Vector3(0.8, 1.2, 4.8),
      });

      // Guard-rail interior
      const bInnerPos = new THREE.Vector3().copy(pt).addScaledVector(normal, -(trackWidth / 2 + 1.8));
      const guardRailIn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 5.0), armcoBarrierMat);
      guardRailIn.position.set(bInnerPos.x, 0.6, bInnerPos.z);
      guardRailIn.rotation.y = angle;
      guardRailIn.castShadow = true;
      guardRailIn.receiveShadow = true;
      group.add(guardRailIn);

      colliders.push({
        type: 'box',
        position: guardRailIn.position.clone(),
        size: new THREE.Vector3(0.8, 1.2, 4.8),
      });
    }

    // ==========================================
    // 8. PÓRTICO MONUMENTAL DE LARGADA / CHEGADA
    // ==========================================
    const gantryGroup = new THREE.Group();
    gantryGroup.position.set(0, 0, -40);

    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const gantryTextMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    // Pilares do pórtico (esquerdo e direito)
    const gantryPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 0.8), trussMat);
    gantryPillarL.position.set(-trackWidth / 2 - 1.2, 4.25, 0);
    gantryPillarL.castShadow = true;
    gantryGroup.add(gantryPillarL);

    const gantryPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 0.8), trussMat);
    gantryPillarR.position.set(trackWidth / 2 + 1.2, 4.25, 0);
    gantryPillarR.castShadow = true;
    gantryGroup.add(gantryPillarR);

    // Viga superior transversal
    const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 3.2, 1.6, 1.2), trussMat);
    gantryBeam.position.set(0, 7.8, 0);
    gantryBeam.castShadow = true;
    gantryGroup.add(gantryBeam);

    // Display Eletrônico do Pórtico
    const gantryDisplay = new THREE.Mesh(new THREE.BoxGeometry(trackWidth - 2.0, 1.1, 0.3), screenMat);
    gantryDisplay.position.set(0, 7.8, -0.6);
    gantryGroup.add(gantryDisplay);

    // Luzes de Largada da F1 / Drift (5 pares de luzes)
    for (let light = -2; light <= 2; light++) {
      const lRed = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), redLightMat);
      lRed.rotation.x = Math.PI / 2;
      lRed.position.set(light * 1.5, 8.0, -0.78);
      gantryGroup.add(lRed);

      const lGreen = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), greenLightMat);
      lGreen.rotation.x = Math.PI / 2;
      lGreen.position.set(light * 1.5, 7.55, -0.78);
      gantryGroup.add(lGreen);
    }

    group.add(gantryGroup);

    // ==========================================
    // 9. COMPLEXO DOS BOXES (PIT BUILDING & PIT LANE)
    // ==========================================
    // O complexo dos boxes fica ao lado direito da reta principal (x = 18 a 34, z = -70 a 30)
    const pitBuildingGroup = new THREE.Group();
    pitBuildingGroup.position.set(22, 0, -20);

    // Prédio Principal dos Boxes (Dois andares com salas VIP e garagem)
    const pitMainMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 8.5, 95), pitBuildingMat);
    pitMainMesh.position.set(0, 4.25, 0);
    pitMainMesh.castShadow = true;
    pitMainMesh.receiveShadow = true;
    pitBuildingGroup.add(pitMainMesh);

    // Janelas panorâmicas da sala de controle / VIP lounge
    const pitWindows = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 90), pitGlassMat);
    pitWindows.position.set(-5.1, 6.0, 0);
    pitBuildingGroup.add(pitWindows);

    // Garagens dos boxes (Portões individuais abertos)
    const garageDoorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    for (let g = -4; g <= 4; g++) {
      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 6.5), garageDoorMat);
      doorMesh.position.set(-5.1, 1.6, g * 9.5);
      pitBuildingGroup.add(doorMesh);
    }

    // Mureta dos Boxes (Pit Wall) separando a pista da via dos boxes
    const pitWallMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 105), armcoBarrierMat);
    pitWallMesh.position.set(-9.5, 0.6, 0);
    pitWallMesh.castShadow = true;
    pitBuildingGroup.add(pitWallMesh);

    // Postos de comando das equipes no pit wall com telas de telemetria
    for (let p = -3; p <= 3; p++) {
      const standMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 3.0), trussMat);
      standMesh.position.set(-8.8, 1.0, p * 13);
      pitBuildingGroup.add(standMesh);
    }

    group.add(pitBuildingGroup);

    colliders.push({
      type: 'box',
      position: new THREE.Vector3(22, 4.25, -20),
      size: new THREE.Vector3(12, 8.5, 96),
    });

    // ==========================================
    // 10. GRANDES ARQUIBANCADAS (GRANDSTANDS)
    // ==========================================
    // 1. Arquibancada Principal em frente aos boxes (x = -22, z = -20)
    const createGrandstand = (length: number) => {
      const gsGroup = new THREE.Group();

      // Estrutura em degraus
      const stepsMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
      const seatsMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }); // Assentos vermelhos esportivos

      for (let step = 0; step < 6; step++) {
        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8 + step * 0.8, length), stepsMat);
        stepMesh.position.set(-step * 1.4, (0.8 + step * 0.8) / 2, 0);
        stepMesh.castShadow = true;
        gsGroup.add(stepMesh);

        // Assentos
        const seatRow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, length * 0.95), seatsMat);
        seatRow.position.set(-step * 1.4, 0.8 + step * 0.8 + 0.12, 0);
        gsGroup.add(seatRow);
      }

      // Cobertura da arquibancada
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, length + 2), grandstandRoofMat);
      roof.position.set(-4.0, 7.8, 0);
      roof.rotation.z = -0.15;
      roof.castShadow = true;
      gsGroup.add(roof);

      return gsGroup;
    };

    const mainGrandstand = createGrandstand(110);
    mainGrandstand.position.set(-21, 0, -20);
    group.add(mainGrandstand);

    colliders.push({
      type: 'box',
      position: new THREE.Vector3(-25, 4, -20),
      size: new THREE.Vector3(10, 8, 112),
    });

    // 2. Arquibancada na Curva da Ferradura / Hairpin
    const hairpinGrandstand = createGrandstand(65);
    hairpinGrandstand.position.set(155, 0, -25);
    hairpinGrandstand.rotation.y = -Math.PI / 2;
    group.add(hairpinGrandstand);

    colliders.push({
      type: 'box',
      position: new THREE.Vector3(155, 4, -25),
      size: new THREE.Vector3(66, 8, 10),
    });

    // ==========================================
    // 11. TORRE DE CRONOMETRAGEM (TIMING PYLON)
    // ==========================================
    const towerGeo = new THREE.BoxGeometry(2.5, 24, 2.5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-16, 12, -45);
    tower.castShadow = true;

    // Display digital da torre
    const towerDisplay = new THREE.Mesh(new THREE.BoxGeometry(2.6, 16, 2.6), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    towerDisplay.position.set(-16, 14, -45);
    group.add(tower);
    group.add(towerDisplay);

    colliders.push({
      type: 'box',
      position: new THREE.Vector3(-16, 12, -45),
      size: new THREE.Vector3(3.0, 24, 3.0),
    });

    // ==========================================
    // 12. PLACAS DE FRENAGEM (150m, 100m, 50m)
    // ==========================================
    const brakeMarkers = [
      { text: '150', pos: new THREE.Vector3(-trackWidth / 2 - 2.5, 1.2, 5) },
      { text: '100', pos: new THREE.Vector3(-trackWidth / 2 - 2.5, 1.2, 18) },
      { text: '50',  pos: new THREE.Vector3(-trackWidth / 2 - 2.5, 1.2, 30) },
    ];
    const markerBoardGeo = new THREE.BoxGeometry(0.15, 1.2, 1.8);
    const markerBoardMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    brakeMarkers.forEach(bm => {
      const board = new THREE.Mesh(markerBoardGeo, markerBoardMat);
      board.position.copy(bm.pos);
      board.castShadow = true;
      group.add(board);
    });

    // ==========================================
    // 13. CONES DERRUBÁVEIS DE DRIFT
    // ==========================================
    const coneGeo = new THREE.ConeGeometry(0.28, 0.75, 12);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const coneStripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const conePositions = [
      new THREE.Vector3(14, 0.37, 72),
      new THREE.Vector3(15, 0.37, 75),
      new THREE.Vector3(120, 0.37, -15),
      new THREE.Vector3(122, 0.37, -18),
      new THREE.Vector3(-98, 0.37, 10),
      new THREE.Vector3(-96, 0.37, 13),
      new THREE.Vector3(-62, 0.37, 55),
    ];

    conePositions.forEach(cPos => {
      const coneGroup = new THREE.Group();
      coneGroup.position.copy(cPos);

      const cMesh = new THREE.Mesh(coneGeo, coneMat);
      cMesh.castShadow = true;
      coneGroup.add(cMesh);

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.16, 12), coneStripeMat);
      stripe.position.y = 0.05;
      coneGroup.add(stripe);

      group.add(coneGroup);

      colliders.push({
        type: 'cone',
        position: coneGroup.position,
        size: new THREE.Vector3(0.4, 0.75, 0.4),
        mesh: coneGroup,
        movable: true,
        velocity: new THREE.Vector3(),
      });
    });

    // ==========================================
    // 14. ESTRUTURAS DO AUTÓDROMO (TORRES DE ILUMINAÇÃO & PAINÉIS DE PATROCÍNIO)
    // ==========================================
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
    const lampFixtureMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const sponsorBoardMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
    const sponsorRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const sponsorYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });

    // Torres de Iluminação Stadium do Autódromo (Mastros metálicos com holofotes)
    const towerPositions = [
      new THREE.Vector3(25, 0, 115),
      new THREE.Vector3(85, 0, 120),
      new THREE.Vector3(145, 0, 50),
      new THREE.Vector3(160, 0, 10),
      new THREE.Vector3(90, 0, -90),
      new THREE.Vector3(45, 0, -80),
      new THREE.Vector3(-50, 0, -95),
      new THREE.Vector3(-125, 0, -60),
      new THREE.Vector3(-130, 0, 30),
      new THREE.Vector3(-85, 0, 85),
    ];

    towerPositions.forEach(pos => {
      const towerGroup = new THREE.Group();
      towerGroup.position.copy(pos);

      // Mastro principal treliçado
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 16, 0.8), mastMat);
      mast.position.y = 8;
      mast.castShadow = true;
      towerGroup.add(mast);

      // Banco de holofotes no topo
      const head = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.8), mastMat);
      head.position.y = 16;
      head.castShadow = true;
      towerGroup.add(head);

      for (let f = -1.2; f <= 1.2; f += 0.8) {
        const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.4), lampFixtureMat);
        fixture.position.set(f, 16, -0.4);
        towerGroup.add(fixture);
      }

      group.add(towerGroup);

      colliders.push({
        type: 'cylinder',
        position: new THREE.Vector3(pos.x, 8, pos.z),
        size: new THREE.Vector3(0.9, 16, 0.9),
      });
    });

    // Painéis de Patrocínio Esportivo de Autódromo (Billboards)
    const billboardPositions = [
      { pos: new THREE.Vector3(60, 2.5, 102), rotY: 0.3, mat: sponsorBoardMat },
      { pos: new THREE.Vector3(138, 2.5, -45), rotY: -0.8, mat: sponsorRedMat },
      { pos: new THREE.Vector3(60, 2.5, -45), rotY: 1.2, mat: sponsorYellowMat },
      { pos: new THREE.Vector3(-85, 2.5, -75), rotY: -0.4, mat: sponsorBoardMat },
      { pos: new THREE.Vector3(-115, 2.5, 20), rotY: 1.5, mat: sponsorRedMat },
    ];

    billboardPositions.forEach(bp => {
      const bbGroup = new THREE.Group();
      bbGroup.position.copy(bp.pos);
      bbGroup.rotation.y = bp.rotY;

      // Painel largo
      const panel = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 0.3), bp.mat);
      panel.castShadow = true;
      bbGroup.add(panel);

      // Suportes metálicos no chão
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), mastMat);
      legL.position.set(-3.8, -1.25, 0);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), mastMat);
      legR.position.set(3.8, -1.25, 0);
      bbGroup.add(legL, legR);

      group.add(bbGroup);

      colliders.push({
        type: 'box',
        position: bp.pos.clone(),
        size: new THREE.Vector3(10.2, 3.0, 1.2),
      });
    });

    // ==========================================
    // 15. CHECKPOINTS DO CIRCUITO
    // ==========================================
    const checkpoints: Checkpoint[] = [
      { position: new THREE.Vector3(0, 0.5, -40), rotationY: 0 },         // Largada / Reta Principal
      { position: new THREE.Vector3(0, 0.5, 20), rotationY: 0 },          // Meio da Reta
      { position: new THREE.Vector3(25, 0.5, 85), rotationY: Math.PI / 4 },// Curva 1 (S do Senna)
      { position: new THREE.Vector3(90, 0.5, 75), rotationY: Math.PI / 2 },// Reta Oposta
      { position: new THREE.Vector3(125, 0.5, -10), rotationY: Math.PI },  // Entrada da Ferradura
      { position: new THREE.Vector3(95, 0.5, -65), rotationY: -Math.PI / 2},// Saída da Ferradura
      { position: new THREE.Vector3(45, 0.5, -25), rotationY: -Math.PI / 4},// Esses de Alta
      { position: new THREE.Vector3(-50, 0.5, -60), rotationY: -Math.PI / 2},// Entrada da Parabólica
      { position: new THREE.Vector3(-105, 0.5, 5), rotationY: 0 },        // Apex da Parabólica
      { position: new THREE.Vector3(-45, 0.5, 45), rotationY: Math.PI / 2 },// Curva da Junção
    ];

    return {
      group,
      colliders,
      spawnPoint: {
        position: new THREE.Vector3(0, 0.4, -40), // Alinhado na pole position do grid
        rotationY: 0, // Apontado para a reta principal
      },
      checkpoints,
      pathPoints: pathPoints2D,
      ambientLightColor: 0xdbeafe,
      fogColor: 0x93c5fd,
    };
  }

  // Alias para garantir compatibilidade total
  public static buildIndustrialNight(): TrackScene {
    return TrackBuilder.buildAutodromo();
  }
}
