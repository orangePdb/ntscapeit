import * as THREE from 'three';
import {
  createAsphaltTexture,
  createCarpetTexture,
  createCdTexture,
  createDoritosTexture,
  createFiredPaperTexture,
  createHpTowerFrontTexture,
  createMicrosoftSignTexture,
  createPhoneScreenTexture,
  createPosterTexture,
  createWoodTexture,
} from './textures';

export interface StickmanRig {
  root: THREE.Group;
  hips: THREE.Group;
  torsoPivot: THREE.Group;
  headPivot: THREE.Group;
  eyelidL: THREE.Mesh;
  eyelidR: THREE.Mesh;
  mouthArc: THREE.Mesh;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  handR: THREE.Object3D;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  handL: THREE.Object3D;
  hipR: THREE.Group;
  kneeR: THREE.Group;
  hipL: THREE.Group;
  kneeL: THREE.Group;
}

export interface OriginWorldRefs {
  sceneGroup: THREE.Group;
  stickman: StickmanRig;
  msDoorLeft: THREE.Group;
  msDoorRight: THREE.Group;
  houseDoor: THREE.Group;
  firedPaper: THREE.Mesh;
  crumpledBall: THREE.Mesh;
  nokiaPhone: THREE.Group;
  doritosBag: THREE.Group;
  cdDisc: THREE.Mesh;
  shelfItems: THREE.Object3D[];
  powerButton: THREE.Mesh;
  towerPowerLedMat: THREE.MeshStandardMaterial;
  towerCdLedMat: THREE.MeshStandardMaterial;
  monitorPowerLedMat: THREE.MeshStandardMaterial;
  crtScreenMat: THREE.MeshStandardMaterial;
  crtCanvas: HTMLCanvasElement;
  crtCtx: CanvasRenderingContext2D;
  crtTexture: THREE.CanvasTexture;
  mouseGroup: THREE.Group;
  bedroomCeilingLight: THREE.PointLight;
  deskLampLight: THREE.PointLight;
  disposables: Array<{ dispose: () => void }>;
}

export function buildOriginStoryWorld(
  scene: THREE.Scene,
  maxAnisotropy: number
): OriginWorldRefs {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  // Shared Procedural Textures
  const woodTex = track(createWoodTexture(maxAnisotropy));
  const carpetTex = track(createCarpetTexture(maxAnisotropy));
  const asphaltTex = track(createAsphaltTexture(maxAnisotropy));
  const msSignTex = track(createMicrosoftSignTexture(maxAnisotropy));
  const firedPaperTex = track(createFiredPaperTexture(maxAnisotropy));
  const phoneScreenTex = track(createPhoneScreenTexture(maxAnisotropy));
  const doritosTex = track(createDoritosTexture(maxAnisotropy));
  const posterTex = track(createPosterTexture(maxAnisotropy));
  const cdTex = track(createCdTexture(maxAnisotropy));
  const hpFrontTex = track(createHpTowerFrontTexture(maxAnisotropy));

  // Shared PBR Materials
  const asphaltMat = track(
    new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.92,
      metalness: 0.04,
    })
  );
  const sidewalkMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x6f747d,
      roughness: 0.88,
      metalness: 0.05,
    })
  );
  const grassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x203224,
      roughness: 0.96,
      metalness: 0.0,
    })
  );
  const woodMat = track(
    new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.54,
      metalness: 0.06,
    })
  );
  const darkWoodMat = track(
    new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x6c4c30,
      roughness: 0.62,
      metalness: 0.06,
    })
  );
  const carpetMat = track(
    new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.94,
      metalness: 0.02,
    })
  );
  const interiorWallMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd2cbb8,
      roughness: 0.86,
      metalness: 0.02,
    })
  );
  const darkMetalMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x242832,
      roughness: 0.36,
      metalness: 0.78,
    })
  );
  const brushedSteelMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xa7b0bc,
      roughness: 0.28,
      metalness: 0.86,
    })
  );
  const beigePlasticMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd8d3c2,
      roughness: 0.48,
      metalness: 0.06,
    })
  );

  // =========================================================================
  // 0. Continuous Ground Plane (Night Sky Horizon & Sidewalk + Road)
  // =========================================================================
  const horizonGround = new THREE.Mesh(
    track(new THREE.PlaneGeometry(90, 44)),
    grassMat
  );
  horizonGround.rotation.x = -Math.PI / 2;
  horizonGround.position.set(12, -0.06, 2);
  horizonGround.receiveShadow = true;
  sceneGroup.add(horizonGround);

  // Night asphalt road (Scenes 1-2)
  const roadMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(30, 0.04, 5.2)),
    asphaltMat
  );
  roadMesh.position.set(4.5, -0.05, 4.1);
  roadMesh.receiveShadow = true;
  sceneGroup.add(roadMesh);

  // Dashed street center line (1990s yellow markings)
  const yellowLineMat = track(
    new THREE.MeshStandardMaterial({ color: 0xc9a02a, roughness: 0.75 })
  );
  const dashGeo = track(new THREE.BoxGeometry(1.1, 0.01, 0.1));
  for (let x = -7; x <= 17; x += 2.6) {
    const dash = new THREE.Mesh(dashGeo, yellowLineMat);
    dash.position.set(x, -0.024, 3.8);
    sceneGroup.add(dash);
  }

  // Concrete sidewalk running from Microsoft building to Stickman's house
  const sidewalkMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(27.5, 0.04, 3.6)),
    sidewalkMat
  );
  sidewalkMesh.position.set(4.1, -0.02, -0.35);
  sidewalkMesh.receiveShadow = true;
  sceneGroup.add(sidewalkMesh);

  // =========================================================================
  // 1. SCENE 1 — MICROSOFT OFFICE BUILDING EXTERIOR & TRASH CAN (x = -5..3)
  // =========================================================================
  const msBuilding = new THREE.Group();
  msBuilding.position.set(-2.8, 0, -2.2);
  sceneGroup.add(msBuilding);

  const msConcreteMat = track(
    new THREE.MeshStandardMaterial({ color: 0x3b424f, roughness: 0.68, metalness: 0.14 })
  );
  const msGlassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x223b56,
      roughness: 0.14,
      metalness: 0.15,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.72,
    })
  );

  // Main facade columns & upper glass block
  const msWallL = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.1, 4.2, 2.2)),
    msConcreteMat
  );
  msWallL.position.set(-1.85, 2.1, -0.2);
  msWallL.castShadow = true;
  msWallL.receiveShadow = true;
  msBuilding.add(msWallL);

  const msWallR = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.1, 4.2, 2.2)),
    msConcreteMat
  );
  msWallR.position.set(1.85, 2.1, -0.2);
  msWallR.castShadow = true;
  msWallR.receiveShadow = true;
  msBuilding.add(msWallR);

  const msUpperBlock = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.7, 1.9, 2.2)),
    msConcreteMat
  );
  msUpperBlock.position.set(0, 3.25, -0.2);
  msUpperBlock.castShadow = true;
  msBuilding.add(msUpperBlock);

  // Back dark lobby interior behind the entrance doors
  const msLobbyBack = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.8, 2.35, 0.2)),
    track(new THREE.MeshStandardMaterial({ color: 0x8ea7bf, emissive: 0x20354a, emissiveIntensity: 0.7, roughness: 0.7 }))
  );
  msLobbyBack.position.set(0, 1.18, -1.05);
  msBuilding.add(msLobbyBack);

  // Office canopy + glowing "Microsoft" sign
  const canopy = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.5, 0.16, 1.05)),
    darkMetalMat
  );
  canopy.position.set(0, 2.38, 1.2);
  canopy.castShadow = true;
  msBuilding.add(canopy);

  const msSignMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(2.1, 0.52)),
    track(
      new THREE.MeshStandardMaterial({
        map: msSignTex,
        emissiveMap: msSignTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.45,
        roughness: 0.35,
      })
    )
  );
  msSignMesh.position.set(0, 2.86, 0.92);
  msBuilding.add(msSignMesh);

  // Articulated Double Entrance Doors (swing open +Z)
  const msDoorLeft = new THREE.Group();
  msDoorLeft.position.set(-0.76, 0, 0.88);
  msBuilding.add(msDoorLeft);
  const doorFrameGeo = track(new THREE.BoxGeometry(0.74, 2.24, 0.05));
  const doorGlassGeo = track(new THREE.BoxGeometry(0.58, 1.96, 0.06));
  const doorHandleGeo = track(new THREE.BoxGeometry(0.03, 0.36, 0.07));

  const dlFrame = new THREE.Mesh(doorFrameGeo, brushedSteelMat);
  dlFrame.position.set(0.37, 1.12, 0);
  msDoorLeft.add(dlFrame);
  const dlGlass = new THREE.Mesh(doorGlassGeo, msGlassMat);
  dlGlass.position.set(0.37, 1.12, 0);
  msDoorLeft.add(dlGlass);
  const dlHandle = new THREE.Mesh(doorHandleGeo, brushedSteelMat);
  dlHandle.position.set(0.66, 1.05, 0.05);
  msDoorLeft.add(dlHandle);

  const msDoorRight = new THREE.Group();
  msDoorRight.position.set(0.76, 0, 0.88);
  msBuilding.add(msDoorRight);
  const drFrame = new THREE.Mesh(doorFrameGeo, brushedSteelMat);
  drFrame.position.set(-0.37, 1.12, 0);
  msDoorRight.add(drFrame);
  const drGlass = new THREE.Mesh(doorGlassGeo, msGlassMat);
  drGlass.position.set(-0.37, 1.12, 0);
  msDoorRight.add(drGlass);
  const drHandle = new THREE.Mesh(doorHandleGeo, brushedSteelMat);
  drHandle.position.set(-0.66, 1.05, 0.05);
  msDoorRight.add(drHandle);

  // Sidewalk Metal Trash Can at (0.5, 0, 0.55)
  const trashCan = new THREE.Group();
  trashCan.position.set(0.5, 0, 0.55);
  sceneGroup.add(trashCan);
  const canShell = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.24, 0.21, 0.66, 20, 1, true)),
    brushedSteelMat
  );
  canShell.position.y = 0.33;
  canShell.castShadow = true;
  trashCan.add(canShell);
  const canRim = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.24, 0.022, 10, 24)),
    darkMetalMat
  );
  canRim.rotation.x = Math.PI / 2;
  canRim.position.y = 0.66;
  trashCan.add(canRim);
  const canBottom = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 20)),
    darkMetalMat
  );
  canBottom.position.y = 0.02;
  trashCan.add(canBottom);

  // =========================================================================
  // 2. SCENE 2 — LONELY NIGHT STREETLIGHTS & TREES (x = 3.6..17.2)
  // =========================================================================
  const bulbMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffe6b3,
      emissive: 0xffbf66,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })
  );
  const poolMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xffc76e,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    })
  );
  const streetLampPositions = [3.6, 8.2, 12.6, 16.4];
  streetLampPositions.forEach((lx) => {
    const post = new THREE.Group();
    post.position.set(lx, 0, 1.25);
    sceneGroup.add(post);

    const base = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.11, 0.15, 0.28, 12)),
      darkMetalMat
    );
    base.position.y = 0.14;
    post.add(base);

    const pole = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.045, 0.065, 3.1, 10)),
      darkMetalMat
    );
    pole.position.y = 1.65;
    pole.castShadow = true;
    post.add(pole);

    const arm = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.06, 0.06, 0.7)),
      darkMetalMat
    );
    arm.position.set(0, 3.18, -0.3);
    post.add(arm);

    const hood = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.2, 0.14, 14)),
      darkMetalMat
    );
    hood.position.set(0, 3.12, -0.62);
    post.add(hood);

    const bulb = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.09, 12, 10)),
      bulbMat
    );
    bulb.position.set(0, 3.04, -0.62);
    post.add(bulb);

    const lightPool = new THREE.Mesh(track(new THREE.CircleGeometry(1.55, 24)), poolMat);
    lightPool.rotation.x = -Math.PI / 2;
    lightPool.position.set(0, 0.008, -0.82);
    post.add(lightPool);

    // Non-shadow PointLight to keep GPU shadow caster count <= 2
    const streetPt = new THREE.PointLight(0xffcb7d, 1.85, 6.2, 1.7);
    streetPt.position.set(lx, 2.95, 0.6);
    sceneGroup.add(streetPt);
  });

  // Distant silhouette trees along background perimeter (z = -3.8)
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x261d17, roughness: 0.95 }));
  const leafMat = track(new THREE.MeshStandardMaterial({ color: 0x182b20, roughness: 0.92 }));
  [4.8, 10.2, 14.9].forEach((tx, idx) => {
    const tree = new THREE.Group();
    tree.position.set(tx, -0.04, -3.4 - (idx % 2) * 0.7);
    sceneGroup.add(tree);
    const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.16, 1.3, 8)), trunkMat);
    trunk.position.y = 0.65;
    tree.add(trunk);
    const crown1 = new THREE.Mesh(track(new THREE.DodecahedronGeometry(0.68, 1)), leafMat);
    crown1.position.y = 1.65;
    tree.add(crown1);
    const crown2 = new THREE.Mesh(track(new THREE.DodecahedronGeometry(0.5, 1)), leafMat);
    crown2.position.set(0.28, 2.05, 0.1);
    tree.add(crown2);
  });

  // =========================================================================
  // 3. SCENES 3–8 — STICKMAN'S HOUSE CUTAWAY (x = 17.8 .. 30.6)
  // =========================================================================
  const houseGroup = new THREE.Group();
  sceneGroup.add(houseGroup);

  // House Interior Floor (oak wood, top at y = 0.01)
  const houseFloor = new THREE.Mesh(
    track(new THREE.BoxGeometry(12.8, 0.04, 4.7)),
    woodMat
  );
  houseFloor.position.set(24.2, -0.01, -0.15);
  houseFloor.receiveShadow = true;
  houseGroup.add(houseFloor);

  // Interior Back Wall (z = -2.42) + dado rail
  const backWall = new THREE.Mesh(
    track(new THREE.BoxGeometry(12.8, 2.75, 0.14)),
    interiorWallMat
  );
  backWall.position.set(24.2, 1.38, -2.46);
  backWall.receiveShadow = true;
  houseGroup.add(backWall);

  // Right Bedroom End Wall (x = 30.55)
  const rightEndWall = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.14, 2.75, 4.7)),
    interiorWallMat
  );
  rightEndWall.position.set(30.55, 1.38, -0.15);
  rightEndWall.receiveShadow = true;
  houseGroup.add(rightEndWall);

  // House Exterior Front Wall & Porch (x = 17.85, doorway opening z = -0.55..0.65)
  const brickMat = track(
    new THREE.MeshStandardMaterial({ color: 0x6f4338, roughness: 0.88, metalness: 0.03 })
  );
  const frontWallL = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.18, 2.75, 1.92)),
    brickMat
  );
  frontWallL.position.set(17.85, 1.38, -1.52);
  frontWallL.castShadow = true;
  houseGroup.add(frontWallL);

  const frontWallR = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.18, 2.75, 1.54)),
    brickMat
  );
  frontWallR.position.set(17.85, 1.38, 1.42);
  frontWallR.castShadow = true;
  houseGroup.add(frontWallR);

  const frontWallHeader = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.18, 0.55, 1.24)),
    brickMat
  );
  frontWallHeader.position.set(17.85, 2.48, 0.05);
  houseGroup.add(frontWallHeader);

  // Gable roof cap visible from street outside
  const roofTrim = new THREE.Mesh(
    track(new THREE.ConeGeometry(2.9, 1.15, 4)),
    track(new THREE.MeshStandardMaterial({ color: 0x3b3532, roughness: 0.9 }))
  );
  roofTrim.rotation.y = Math.PI / 4;
  roofTrim.scale.set(1.0, 1.0, 1.35);
  roofTrim.position.set(18.6, 3.32, -0.15);
  houseGroup.add(roofTrim);

  // Articulated Front Door (pivoted at z = -0.55)
  const houseDoor = new THREE.Group();
  houseDoor.position.set(17.85, 0, -0.55);
  houseGroup.add(houseDoor);

  const doorPanel = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.07, 2.16, 1.16)),
    darkWoodMat
  );
  doorPanel.position.set(0, 1.09, 0.58);
  doorPanel.castShadow = true;
  houseDoor.add(doorPanel);

  const brassKnobMat = track(
    new THREE.MeshStandardMaterial({ color: 0xd9b355, roughness: 0.25, metalness: 0.9 })
  );
  const doorKnob = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.045, 12, 10)),
    brassKnobMat
  );
  doorKnob.position.set(-0.07, 1.0, 1.02);
  houseDoor.add(doorKnob);

  // Hallway & Kitchen Lighting
  const hallwayLight = new THREE.PointLight(0xffdfb0, 1.5, 8.0, 1.5);
  hallwayLight.position.set(21.2, 2.35, -0.2);
  houseGroup.add(hallwayLight);

  // -------------------------------------------------------------------------
  // KITCHEN ALCOVE (x = 20.6..23.6, z = -2.35..-0.45)
  // -------------------------------------------------------------------------
  const kitchenCounter = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.6, 0.86, 0.56)),
    track(new THREE.MeshStandardMaterial({ color: 0xc2b9a5, roughness: 0.72 }))
  );
  kitchenCounter.position.set(21.9, 0.43, -2.08);
  houseGroup.add(kitchenCounter);

  const fridge = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.72, 1.85, 0.65)),
    track(new THREE.MeshStandardMaterial({ color: 0xd9d8d0, roughness: 0.35, metalness: 0.25 }))
  );
  fridge.position.set(23.6, 0.93, -2.02);
  fridge.castShadow = true;
  houseGroup.add(fridge);

  // Kitchen Table (22.0, 0, -1.08)
  const kitchenTable = new THREE.Group();
  kitchenTable.position.set(22.0, 0, -1.08);
  houseGroup.add(kitchenTable);
  const ktTop = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.06, 0.05, 0.68)),
    woodMat
  );
  ktTop.position.y = 0.74;
  ktTop.castShadow = true;
  ktTop.receiveShadow = true;
  kitchenTable.add(ktTop);
  const ktLegGeo = track(new THREE.BoxGeometry(0.055, 0.72, 0.055));
  [
    [-0.45, -0.27],
    [0.45, -0.27],
    [-0.45, 0.27],
    [0.45, 0.27],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(ktLegGeo, darkWoodMat);
    leg.position.set(lx, 0.36, lz);
    kitchenTable.add(leg);
  });

  // DORITOS BAG (Composite 3-part foil pouch with crisp procedural label)
  const doritosBag = new THREE.Group();
  doritosBag.position.set(22.0, 0.77, -1.02);
  houseGroup.add(doritosBag);

  const doritosMat = track(
    new THREE.MeshStandardMaterial({
      map: doritosTex,
      roughness: 0.32,
      metalness: 0.22,
    })
  );
  const pouchCore = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.22, 0.28, 0.085)),
    doritosMat
  );
  pouchCore.position.y = 0.14;
  pouchCore.castShadow = true;
  doritosBag.add(pouchCore);
  const crimpMat = track(
    new THREE.MeshStandardMaterial({ color: 0xb01010, roughness: 0.4, metalness: 0.25 })
  );
  const topCrimp = new THREE.Mesh(track(new THREE.BoxGeometry(0.23, 0.025, 0.02)), crimpMat);
  topCrimp.position.y = 0.285;
  doritosBag.add(topCrimp);
  const botCrimp = new THREE.Mesh(track(new THREE.BoxGeometry(0.23, 0.02, 0.02)), crimpMat);
  botCrimp.position.y = 0.01;
  doritosBag.add(botCrimp);

  // -------------------------------------------------------------------------
  // BEDROOM (x = 24.5 .. 30.5, z = -2.4 .. 2.2)
  // -------------------------------------------------------------------------
  const bedroomCarpet = new THREE.Mesh(
    track(new THREE.BoxGeometry(5.8, 0.02, 4.35)),
    carpetMat
  );
  bedroomCarpet.position.set(27.6, 0.015, -0.1);
  bedroomCarpet.receiveShadow = true;
  houseGroup.add(bedroomCarpet);

  // Retro Wall Poster ("NET 1999")
  const posterMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.78, 1.02)),
    track(new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.65 }))
  );
  posterMesh.position.set(27.55, 1.72, -2.375);
  houseGroup.add(posterMesh);

  // BED (at x = 25.65, z = 1.15 — aligned along X so head rests at x = 24.95)
  const bedGroup = new THREE.Group();
  bedGroup.position.set(25.65, 0.02, 1.15);
  houseGroup.add(bedGroup);

  const bedFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.88, 0.22, 0.98)),
    darkWoodMat
  );
  bedFrame.position.y = 0.14;
  bedFrame.castShadow = true;
  bedGroup.add(bedFrame);

  const headboard = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.08, 0.78, 1.02)),
    darkWoodMat
  );
  headboard.position.set(-0.92, 0.41, 0);
  bedGroup.add(headboard);

  const mattress = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.78, 0.2, 0.9)),
    track(new THREE.MeshStandardMaterial({ color: 0xe6e1d5, roughness: 0.92 }))
  );
  mattress.position.y = 0.34;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  const blanket = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.18, 0.22, 0.92)),
    track(new THREE.MeshStandardMaterial({ color: 0x35537a, roughness: 0.88 }))
  );
  blanket.position.set(0.3, 0.35, 0);
  bedGroup.add(blanket);

  const pillow = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.36, 0.11, 0.56)),
    track(new THREE.MeshStandardMaterial({ color: 0xf4f2eb, roughness: 0.9 }))
  );
  pillow.position.set(-0.66, 0.48, 0);
  bedGroup.add(pillow);

  // BIG SHELF (Bookcase at x = 26.25, z = -2.05) — Scene 4 CD Search
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(26.25, 0.02, -2.05);
  houseGroup.add(shelfGroup);

  const shelfSideGeo = track(new THREE.BoxGeometry(0.05, 1.98, 0.42));
  const shelfL = new THREE.Mesh(shelfSideGeo, darkWoodMat);
  shelfL.position.set(-0.68, 0.99, 0);
  shelfGroup.add(shelfL);
  const shelfR = new THREE.Mesh(shelfSideGeo, darkWoodMat);
  shelfR.position.set(0.68, 0.99, 0);
  shelfGroup.add(shelfR);
  const shelfBack = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.4, 1.98, 0.03)),
    darkWoodMat
  );
  shelfBack.position.set(0, 0.99, -0.2);
  shelfGroup.add(shelfBack);

  const plankGeo = track(new THREE.BoxGeometry(1.36, 0.04, 0.4));
  [0.08, 0.56, 1.02, 1.48, 1.96].forEach((py) => {
    const plank = new THREE.Mesh(plankGeo, darkWoodMat);
    plank.position.set(0, py, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    shelfGroup.add(plank);
  });

  // Books, cardboard boxes & random retro objects on shelf (animated during rummaging)
  const shelfItems: THREE.Object3D[] = [];
  const bookColors = [0x9e322a, 0x2a578a, 0x2e7548, 0xc79228, 0x623b7a, 0x3b6f7a];
  bookColors.forEach((col, idx) => {
    const book = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.08, 0.3 + (idx % 3) * 0.05, 0.24)),
      track(new THREE.MeshStandardMaterial({ color: col, roughness: 0.72 }))
    );
    book.position.set(-0.46 + idx * 0.14, 1.2 + (idx % 3) * 0.025, 0.03);
    book.userData.baseX = book.position.x;
    book.userData.baseZ = book.position.z;
    shelfGroup.add(book);
    shelfItems.push(book);
  });

  // Cardboard boxes & random trinkets on shelf
  const boxMat1 = track(new THREE.MeshStandardMaterial({ color: 0xb58d5e, roughness: 0.88 }));
  const boxMat2 = track(new THREE.MeshStandardMaterial({ color: 0x526378, roughness: 0.78 }));
  const box1 = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.24, 0.28)), boxMat1);
  box1.position.set(0.32, 1.16, 0.04);
  box1.userData.baseX = box1.position.x;
  box1.userData.baseZ = box1.position.z;
  shelfGroup.add(box1);
  shelfItems.push(box1);

  const box2 = new THREE.Mesh(track(new THREE.BoxGeometry(0.26, 0.22, 0.26)), boxMat2);
  box2.position.set(0.02, 1.15, 0.08);
  box2.userData.baseX = box2.position.x;
  box2.userData.baseZ = box2.position.z;
  shelfGroup.add(box2);
  shelfItems.push(box2);

  // Lower shelf items for dense 1999 feel
  const box3 = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.26, 0.28)), boxMat1);
  box3.position.set(-0.28, 0.71, 0.03);
  shelfGroup.add(box3);

  // =========================================================================
  // 4. PC DESK + 1999 HP PAVILION + CRT MONITOR + MOUSE (x = 28.8, z = -1.6)
  // =========================================================================
  const deskGroup = new THREE.Group();
  deskGroup.position.set(28.85, 0.02, -1.68);
  houseGroup.add(deskGroup);

  const deskTop = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.66, 0.055, 0.84)),
    woodMat
  );
  deskTop.position.set(0, 0.75, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  const deskLegGeo = track(new THREE.BoxGeometry(0.06, 0.73, 0.72));
  const dlL = new THREE.Mesh(deskLegGeo, darkWoodMat);
  dlL.position.set(-0.76, 0.365, 0);
  deskGroup.add(dlL);
  const dlR = new THREE.Mesh(deskLegGeo, darkWoodMat);
  dlR.position.set(0.76, 0.365, 0);
  deskGroup.add(dlR);

  // Ergonomic Office Chair parked neatly at desk left-front so it never collides
  const chair = new THREE.Group();
  chair.position.set(28.05, 0.02, -0.78);
  chair.rotation.y = 0.42;
  houseGroup.add(chair);
  const chairFabMat = track(
    new THREE.MeshStandardMaterial({ color: 0x2b3648, roughness: 0.88 })
  );
  const chairSeat = new THREE.Mesh(track(new THREE.BoxGeometry(0.44, 0.06, 0.42)), chairFabMat);
  chairSeat.position.y = 0.46;
  chair.add(chairSeat);
  const chairBack = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.44, 0.06)), chairFabMat);
  chairBack.position.set(0, 0.72, 0.19);
  chair.add(chairBack);
  const chairStem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 10)), darkMetalMat);
  chairStem.position.y = 0.26;
  chair.add(chairStem);
  const chairBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.24, 0.26, 0.05, 6)), darkMetalMat);
  chairBase.position.y = 0.05;
  chair.add(chairBase);

  // 1999 HP Pavilion Mini-Tower at right of desk
  const hpTower = new THREE.Group();
  hpTower.position.set(0.56, 0.778, -0.05);
  deskGroup.add(hpTower);

  const towerBody = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.22, 0.46, 0.44)),
    beigePlasticMat
  );
  towerBody.position.y = 0.23;
  towerBody.castShadow = true;
  hpTower.add(towerBody);

  const towerFront = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.215, 0.45)),
    track(new THREE.MeshStandardMaterial({ map: hpFrontTex, roughness: 0.45 }))
  );
  towerFront.position.set(0, 0.23, 0.222);
  hpTower.add(towerFront);

  // HP Power Button & Status LEDs
  const powerButton = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.017, 0.017, 0.016, 14)),
    brushedSteelMat
  );
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.055, 0.135, 0.226);
  hpTower.add(powerButton);

  const towerPowerLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1e4d2b,
      emissive: 0x3cff55,
      emissiveIntensity: 0,
      roughness: 0.25,
    })
  );
  const towerPowerLed = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.007, 8, 8)),
    towerPowerLedMat
  );
  towerPowerLed.position.set(-0.048, 0.135, 0.226);
  hpTower.add(towerPowerLed);

  const towerCdLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x4a330e,
      emissive: 0xffaa1d,
      emissiveIntensity: 0,
      roughness: 0.25,
    })
  );
  const towerCdLed = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.006, 8, 8)),
    towerCdLedMat
  );
  towerCdLed.position.set(-0.055, 0.375, 0.226);
  hpTower.add(towerCdLed);

  // 1999 CRT Monitor
  const monitor = new THREE.Group();
  monitor.position.set(-0.12, 0.778, -0.08);
  deskGroup.add(monitor);

  const monStand = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.11, 0.15, 0.06, 18)),
    beigePlasticMat
  );
  monStand.position.y = 0.03;
  monitor.add(monStand);

  const monBezel = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.5, 0.44, 0.24)),
    beigePlasticMat
  );
  monBezel.position.set(0, 0.28, 0.05);
  monBezel.castShadow = true;
  monitor.add(monBezel);

  const monBack = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.36, 0.32, 0.24)),
    beigePlasticMat
  );
  monBack.position.set(0, 0.28, -0.17);
  monitor.add(monBack);

  const monInnerRim = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.43, 0.35, 0.02)),
    darkMetalMat
  );
  monInnerRim.position.set(0, 0.295, 0.168);
  monitor.add(monInnerRim);

  // Dynamic CRT Canvas Screen (512x384)
  const crtCanvas = document.createElement('canvas');
  crtCanvas.width = 512;
  crtCanvas.height = 384;
  const crtCtx = crtCanvas.getContext('2d')!;
  const crtTexture = track(new THREE.CanvasTexture(crtCanvas));
  crtTexture.colorSpace = THREE.SRGBColorSpace;
  crtTexture.anisotropy = maxAnisotropy;

  const crtScreenMat = track(
    new THREE.MeshStandardMaterial({
      map: crtTexture,
      emissiveMap: crtTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0,
      roughness: 0.18,
      metalness: 0.08,
    })
  );
  const crtScreen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.39, 0.295)),
    crtScreenMat
  );
  crtScreen.position.set(0, 0.298, 0.182);
  monitor.add(crtScreen);

  const monitorPowerLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1e4d2b,
      emissive: 0x39ff5a,
      emissiveIntensity: 0,
      roughness: 0.2,
    })
  );
  const monitorLed = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.006, 8, 8)),
    monitorPowerLedMat
  );
  monitorLed.position.set(0.18, 0.095, 0.174);
  monitor.add(monitorLed);

  // Keyboard & Mousepad + Animated 3D Mouse
  const keyboard = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.44, 0.024, 0.16)),
    beigePlasticMat
  );
  keyboard.position.set(-0.12, 0.79, 0.23);
  keyboard.rotation.x = 0.07;
  deskGroup.add(keyboard);

  const mousePad = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.22, 0.006, 0.2)),
    track(new THREE.MeshStandardMaterial({ color: 0x203554, roughness: 0.88 }))
  );
  mousePad.position.set(0.25, 0.78, 0.24);
  deskGroup.add(mousePad);

  const mouseGroup = new THREE.Group();
  mouseGroup.position.set(0.25, 0.785, 0.24);
  deskGroup.add(mouseGroup);
  const mouseShell = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.036, 12, 10)),
    beigePlasticMat
  );
  mouseShell.scale.set(0.85, 0.55, 1.35);
  mouseShell.position.y = 0.015;
  mouseGroup.add(mouseShell);

  // Desk Lamp (left corner of desk)
  const deskLamp = new THREE.Group();
  deskLamp.position.set(-0.62, 0.778, -0.18);
  deskGroup.add(deskLamp);
  const dlBase = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.08, 0.09, 0.025, 16)),
    darkMetalMat
  );
  dlBase.position.y = 0.012;
  deskLamp.add(dlBase);
  const dlStem = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 10)),
    brushedSteelMat
  );
  dlStem.position.set(0, 0.17, 0);
  deskLamp.add(dlStem);
  const dlShade = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.11, 0.13, 18, 1, true)),
    track(new THREE.MeshStandardMaterial({ color: 0x274d3b, roughness: 0.4, side: THREE.DoubleSide }))
  );
  dlShade.position.set(0.08, 0.34, 0.04);
  dlShade.rotation.z = -0.5;
  deskLamp.add(dlShade);

  // Warm Bedroom Lights (non-shadow PointLights)
  const deskLampLight = new THREE.PointLight(0xffcb8c, 1.4, 3.8, 1.8);
  deskLampLight.position.set(28.32, 1.15, -1.78);
  houseGroup.add(deskLampLight);

  const bedroomCeilingLight = new THREE.PointLight(0xffe1b8, 1.55, 7.2, 1.4);
  bedroomCeilingLight.position.set(27.0, 2.45, -0.35);
  houseGroup.add(bedroomCeilingLight);

  // =========================================================================
  // 5. STORY PROPS (FIRED paper, Crumpled ball, Nokia 02:17, netscapeit CD)
  // =========================================================================
  const firedPaper = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.24, 0.31)),
    track(
      new THREE.MeshStandardMaterial({
        map: firedPaperTex,
        roughness: 0.85,
        side: THREE.DoubleSide,
      })
    )
  );
  firedPaper.castShadow = true;
  sceneGroup.add(firedPaper);

  const crumpledBall = new THREE.Mesh(
    track(new THREE.IcosahedronGeometry(0.055, 0)),
    track(new THREE.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.9 }))
  );
  crumpledBall.visible = false;
  crumpledBall.castShadow = true;
  sceneGroup.add(crumpledBall);

  // 1999 Nokia-style Phone ("02:17")
  const nokiaPhone = new THREE.Group();
  nokiaPhone.visible = false;
  sceneGroup.add(nokiaPhone);

  const phoneBody = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.11, 0.24, 0.036)),
    track(new THREE.MeshStandardMaterial({ color: 0x22304d, roughness: 0.45 }))
  );
  nokiaPhone.add(phoneBody);
  const phoneAntenna = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.011, 0.013, 0.055, 10)),
    darkMetalMat
  );
  phoneAntenna.position.set(0.034, 0.145, 0);
  nokiaPhone.add(phoneAntenna);
  const phoneScreen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.088, 0.068)),
    track(
      new THREE.MeshStandardMaterial({
        map: phoneScreenTex,
        emissiveMap: phoneScreenTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.72,
        roughness: 0.25,
      })
    )
  );
  phoneScreen.position.set(0, 0.048, 0.019);
  nokiaPhone.add(phoneScreen);
  const phoneKeys = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.084, 0.085, 0.008)),
    track(new THREE.MeshStandardMaterial({ color: 0x5c6980, roughness: 0.55 }))
  );
  phoneKeys.position.set(0, -0.052, 0.018);
  nokiaPhone.add(phoneKeys);

  // CD Disc labeled "netscapeit 2.7.9"
  const cdDisc = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.095, 0.095, 0.004, 36)),
    track(
      new THREE.MeshPhysicalMaterial({
        map: cdTex,
        roughness: 0.18,
        metalness: 0.62,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      })
    )
  );
  cdDisc.castShadow = true;
  sceneGroup.add(cdDisc);

  // =========================================================================
  // 6. ARTICULATED 3D BLENDER-STYLE STICKMAN (with eyelids & smile/frown)
  // =========================================================================
  const stickMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x161922,
      roughness: 0.38,
      metalness: 0.15,
    })
  );
  const eyeWhiteMat = track(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
  );
  const eyePupilMat = track(
    new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.15 })
  );
  const mouthMat = track(
    new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: 0.4 })
  );

  const stickRoot = new THREE.Group();
  sceneGroup.add(stickRoot);

  const hips = new THREE.Group();
  hips.position.y = 0.74;
  stickRoot.add(hips);

  const pelvisMesh = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.055, 14, 10)),
    stickMat
  );
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  const torsoPivot = new THREE.Group();
  hips.add(torsoPivot);

  const spineMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.044, 0.04, 0.44, 14)),
    stickMat
  );
  spineMesh.position.y = 0.22;
  spineMesh.castShadow = true;
  torsoPivot.add(spineMesh);

  const chestJoint = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.054, 14, 10)),
    stickMat
  );
  chestJoint.position.y = 0.44;
  torsoPivot.add(chestJoint);

  // Neck & Head with animated Eyelids & Mouth
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.59;
  torsoPivot.add(headPivot);

  const headSphere = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.145, 22, 18)),
    stickMat
  );
  headSphere.castShadow = true;
  headPivot.add(headSphere);

  const eyeGeo = track(new THREE.SphereGeometry(0.029, 12, 10));
  const pupilGeo = track(new THREE.SphereGeometry(0.015, 10, 8));
  const eyelidGeo = track(new THREE.BoxGeometry(0.062, 0.058, 0.025));

  const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeL.position.set(-0.048, 0.028, 0.125);
  headPivot.add(eyeL);
  const pupilL = new THREE.Mesh(pupilGeo, eyePupilMat);
  pupilL.position.set(-0.048, 0.028, 0.146);
  headPivot.add(pupilL);
  const eyelidL = new THREE.Mesh(eyelidGeo, stickMat);
  eyelidL.position.set(-0.048, 0.052, 0.138);
  eyelidL.scale.y = 0.05;
  headPivot.add(eyelidL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeR.position.set(0.048, 0.028, 0.125);
  headPivot.add(eyeR);
  const pupilR = new THREE.Mesh(pupilGeo, eyePupilMat);
  pupilR.position.set(0.048, 0.028, 0.146);
  headPivot.add(pupilR);
  const eyelidR = new THREE.Mesh(eyelidGeo, stickMat);
  eyelidR.position.set(0.048, 0.052, 0.138);
  eyelidR.scale.y = 0.05;
  headPivot.add(eyelidR);

  // Curved expression arc (rotation.z = 0 => sad frown, rotation.z = PI => happy smile)
  const mouthArc = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.042, 0.0085, 8, 16, Math.PI)),
    mouthMat
  );
  mouthArc.position.set(0, -0.058, 0.135);
  headPivot.add(mouthArc);

  const buildArm = (xOffset: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(xOffset, 0.43, 0);
    torsoPivot.add(shoulder);

    const shBall = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.04, 12, 10)),
      stickMat
    );
    shoulder.add(shBall);

    const upperArm = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.03, 0.026, 0.25, 12)),
      stickMat
    );
    upperArm.position.y = -0.125;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.25;
    shoulder.add(elbow);

    const elBall = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.032, 12, 10)),
      stickMat
    );
    elbow.add(elBall);

    const foreArm = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.026, 0.023, 0.24, 12)),
      stickMat
    );
    foreArm.position.y = -0.12;
    foreArm.castShadow = true;
    elbow.add(foreArm);

    const hand = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.04, 12, 10)),
      stickMat
    );
    hand.position.y = -0.25;
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  };

  const armR = buildArm(0.088);
  const armL = buildArm(-0.088);

  const buildLeg = (xOffset: number) => {
    const hip = new THREE.Group();
    hip.position.set(xOffset, -0.02, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.034, 0.029, 0.35, 12)),
      stickMat
    );
    thigh.position.y = -0.175;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.35;
    hip.add(knee);

    const kBall = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.034, 12, 10)),
      stickMat
    );
    knee.add(kBall);

    const shin = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.029, 0.025, 0.35, 12)),
      stickMat
    );
    shin.position.y = -0.175;
    shin.castShadow = true;
    knee.add(shin);

    const foot = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.068, 0.042, 0.145)),
      stickMat
    );
    foot.position.set(0, -0.36, 0.035);
    foot.castShadow = true;
    knee.add(foot);

    return { hip, knee };
  };

  const legR = buildLeg(0.068);
  const legL = buildLeg(-0.068);

  return {
    sceneGroup,
    stickman: {
      root: stickRoot,
      hips,
      torsoPivot,
      headPivot,
      eyelidL,
      eyelidR,
      mouthArc,
      shoulderR: armR.shoulder,
      elbowR: armR.elbow,
      handR: armR.hand,
      shoulderL: armL.shoulder,
      elbowL: armL.elbow,
      handL: armL.hand,
      hipR: legR.hip,
      kneeR: legR.knee,
      hipL: legL.hip,
      kneeL: legL.knee,
    },
    msDoorLeft,
    msDoorRight,
    houseDoor,
    firedPaper,
    crumpledBall,
    nokiaPhone,
    doritosBag,
    cdDisc,
    shelfItems,
    powerButton,
    towerPowerLedMat,
    towerCdLedMat,
    monitorPowerLedMat,
    crtScreenMat,
    crtCanvas,
    crtCtx,
    crtTexture,
    mouseGroup,
    bedroomCeilingLight,
    deskLampLight,
    disposables,
  };
}
