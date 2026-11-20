import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { IntroSfxEngine } from '../intro3d/soundEffects';
import { drawOriginCrtCanvas } from '../intro3d/textures';
import { buildOriginStoryWorld } from '../intro3d/worldBuilder';

interface IntroAnimationProps {
  onComplete: () => void;
}

const WHITE_START_MS = 72000; // Scene 8: 72s-78s (6s silent pure white screen)
const WHITE_END_MS = 78000; // 78s-79s: subtle startup + Netscapeit UI fade-in
const FINAL_BLACK_START_MS = 79000; // Scene 9: 79s-84s final title in darkness
const TOTAL_MS = 84000;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const segProgress = (ms: number, start: number, end: number): number =>
  easeInOut(clamp01((ms - start) / (end - start)));

// Pre-allocated math helpers (zero per-frame GC inside tick loop)
const _handRPos = new THREE.Vector3();
const _handLPos = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camTargetLook = new THREE.Vector3();
const _camCurrentLook = new THREE.Vector3(-2.6, 1.25, -1.0);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const sfxRef = useRef<IntroSfxEngine | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [showThoughtBubble, setShowThoughtBubble] = useState<boolean>(false);
  const [overlayPhase, setOverlayPhase] = useState<'3d' | 'white' | 'ui_fade' | 'final_title'>(
    '3d'
  );
  const [whiteOpacity, setWhiteOpacity] = useState<number>(0);
  const [uiPreviewOpacity, setUiPreviewOpacity] = useState<number>(0);
  const [blackOpacity, setBlackOpacity] = useState<number>(0);
  const [titleOpacity, setTitleOpacity] = useState<number>(0);
  const [webglLost, setWebglLost] = useState<boolean>(false);

  const handleToggleSound = () => {
    const engine = sfxRef.current;
    if (!engine) return;
    engine.unlock();
    const nextMuted = !engine.isMuted();
    engine.setMuted(nextMuted);
    setSoundMuted(nextMuted);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const sfx = new IntroSfxEngine();
    sfxRef.current = sfx;
    sfx.unlock();

    const unlockOnGesture = () => {
      sfx.unlock();
    };
    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const handleContextRestored = () => {
      setWebglLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x0b101b);
    scene.background = skyColor;
    scene.fog = new THREE.Fog(0x0b101b, 9, 26);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Balanced Night Street + Warm Studio Rig (1 shadow-casting Key Light)
    const hemiLight = new THREE.HemisphereLight(0x526b96, 0x262018, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe1b8, 1.25);
    keyLight.position.set(2, 6, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 18;
      keyLight.shadow.camera.left = -7;
      keyLight.shadow.camera.right = 7;
      keyLight.shadow.camera.top = 5;
      keyLight.shadow.camera.bottom = -5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);
    scene.add(keyLight.target);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const world = buildOriginStoryWorld(scene, maxAnisotropy);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.04, 48);
    camera.position.set(-2.5, 1.72, 2.25);
    _camCurrentLook.set(-2.8, 1.38, -1.0);
    camera.lookAt(_camCurrentLook);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(240, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let disposed = false;
    let rafId = 0;
    let timeoutId = 0;
    let lastBubble = false;
    let lastPhase: '3d' | 'white' | 'ui_fade' | 'final_title' = '3d';
    let lastWhiteOp = -1;
    let lastUiOp = -1;
    let lastBlackOp = -1;
    let lastTitleOp = -1;
    let lastFootstepBucket = -1;
    const startTime = performance.now();
    let prevTime = startTime;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timeoutId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          timeoutId = window.setTimeout(cb, 80);
        }
      };
      timeoutId = window.setTimeout(poll, 5);
    };

    const updateSceneAtTime = (ms: number, dt: number) => {
      const sm = world.stickman;

      // Default stickman rig variables
      let stickX = -2.8;
      let stickY = 0;
      let stickZ = -1.75;
      let stickYaw = 0.08;
      let stickRollZ = 0;
      let hipsY = 0.74;
      let torsoLeanX = 0.05;
      let headPitchX = 0;
      let headYawY = 0;
      let eyelidClosed = 0; // 0 = open, 1 = closed
      let mouthMode: 'frown' | 'neutral' | 'smile' = 'frown';

      let shRPitch = -0.15;
      let shRYaw = 0;
      let shRRoll = -0.14;
      let elRPitch = -0.25;
      let shLPitch = -0.15;
      let shLYaw = 0;
      let shLRoll = 0.14;
      let elLPitch = -0.25;

      let walkPhase = 0;
      let walkAmp = 0;
      let sittingBend = 0; // 0 = standing legs straight, 1 = seated/bent legs

      // Lighting defaults
      let bedroomLightInt = 1.55;
      let deskLightInt = 1.3;

      // =====================================================================
      // SCENE 1 (0 - 8000ms): YOU'RE FIRED!
      // =====================================================================
      if (ms < 8000) {
        mouthMode = 'frown';
        if (ms < 1500) {
          // Doors open, walks out holding FIRED paper
          const t = segProgress(ms, 0, 1500);
          stickX = lerp(-2.8, -1.65, t);
          stickZ = lerp(-1.75, -0.05, t);
          stickYaw = lerp(0.18, 0.08, t);
          walkAmp = Math.sin(t * Math.PI);
          walkPhase = t * Math.PI * 3.0;
          shRPitch = -1.05;
          shRYaw = -0.22;
          elRPitch = -0.55;
          shLPitch = -1.05;
          shLYaw = 0.22;
          elLPitch = -0.55;
          sfx.triggerOnce('s1_ms_door', () => sfx.playDoorOpen());
        } else if (ms < 3400) {
          // Camera zooms onto the paper reading FIRED
          stickX = -1.65;
          stickZ = -0.05;
          stickYaw = 0.08;
          headPitchX = 0.22;
          shRPitch = -1.12;
          shRYaw = -0.22;
          elRPitch = -0.52;
          shLPitch = -1.12;
          shLYaw = 0.22;
          elLPitch = -0.52;
        } else if (ms < 4500) {
          // Looks disappointed, crumples paper
          const t = segProgress(ms, 3400, 4450);
          stickX = -1.65;
          stickZ = -0.05;
          stickYaw = 0.12;
          torsoLeanX = lerp(0.05, 0.22, t);
          headPitchX = lerp(0.22, 0.44, t);
          shRPitch = lerp(-1.12, -0.82, t) + Math.sin(t * Math.PI * 4) * 0.12;
          shLPitch = lerp(-1.12, -0.82, t);
          elRPitch = -0.78;
          elLPitch = -0.78;
          if (ms >= 4000) {
            sfx.triggerOnce('s1_crumple', () => sfx.playPaperCrumple());
          }
        } else if (ms < 6200) {
          // Walks to trash can and throws crumpled paper in
          const tMove = segProgress(ms, 4500, 5200);
          const tThrow = segProgress(ms, 5150, 5750);
          stickX = lerp(-1.65, -0.1, tMove);
          stickZ = lerp(-0.05, 0.32, tMove);
          stickYaw = lerp(0.12, 1.15, tMove);
          walkAmp = ms < 5200 ? Math.sin(tMove * Math.PI) : 0;
          walkPhase = tMove * Math.PI * 2.5;
          torsoLeanX = 0.16;
          headPitchX = 0.28;
          shRPitch = lerp(-0.82, ms < 5450 ? -2.2 : -0.4, tThrow);
          elRPitch = lerp(-0.78, -0.25, tThrow);
          if (ms >= 5720) {
            sfx.triggerOnce('s1_clank', () => sfx.playTrashClank());
          }
        } else {
          // Sighs and starts walking down street
          const tTurn = segProgress(ms, 6200, 6900);
          const tWalk = segProgress(ms, 6750, 8000);
          stickX = lerp(-0.1, 2.35, tWalk);
          stickZ = lerp(0.32, 0.15, tTurn);
          stickYaw = lerp(1.15, Math.PI / 2, tTurn);
          const sighOffset = ms < 6800 ? Math.sin(((ms - 6200) / 600) * Math.PI) : 0;
          hipsY = 0.74 - sighOffset * 0.03;
          torsoLeanX = 0.18 + sighOffset * 0.1;
          headPitchX = 0.34;
          walkAmp = ms >= 6750 ? clamp01((ms - 6750) / 500) : 0;
          walkPhase = (ms - 6750) * 0.0065;
        }
      }
      // =====================================================================
      // SCENE 2 (8000 - 20000ms): THE LONELY WALK (02:17 on phone)
      // =====================================================================
      else if (ms < 20000) {
        mouthMode = 'frown';
        if (ms < 12000) {
          const t = segProgress(ms, 8000, 12000);
          stickX = lerp(2.35, 8.2, t);
          stickZ = 0.15;
          stickYaw = Math.PI / 2;
          torsoLeanX = 0.22;
          headPitchX = 0.32;
          walkAmp = t > 0.92 ? lerp(1, 0, (t - 0.92) / 0.08) : 1;
          walkPhase = ms * 0.0065;
        } else if (ms < 16000) {
          // Stops under streetlight, pulls out phone displaying 02:17
          const tOut = segProgress(ms, 12000, 12800);
          const tAway = ms >= 15250 ? segProgress(ms, 15250, 15950) : 0;
          const hold = tOut * (1 - tAway);
          stickX = 8.2;
          stickZ = 0.15;
          stickYaw = lerp(Math.PI / 2, 0.22, hold);
          torsoLeanX = lerp(0.2, 0.08, hold);
          headPitchX = lerp(0.3, 0.26, hold);
          shRPitch = lerp(-0.15, -1.08, hold);
          shRYaw = lerp(0, -0.18, hold);
          elRPitch = lerp(-0.25, -0.78, hold);
          if (ms >= 12300) {
            sfx.triggerOnce('s2_phone', () => sfx.playPhoneBeep());
          }
        } else {
          // Puts phone away, continues walking home for remaining time
          const t = segProgress(ms, 16000, 20000);
          stickX = lerp(8.2, 17.25, t);
          stickZ = lerp(0.15, 0.05, t);
          stickYaw = Math.PI / 2;
          torsoLeanX = 0.24;
          headPitchX = 0.3;
          walkAmp = t > 0.94 ? lerp(1, 0, (t - 0.94) / 0.06) : 1;
          walkPhase = ms * 0.0072;
        }
      }
      // =====================================================================
      // SCENE 3 (20000 - 29000ms): GETTING HOME (Hallway -> Kitchen Doritos -> Bedroom)
      // =====================================================================
      else if (ms < 29000) {
        mouthMode = 'neutral';
        if (ms < 21400) {
          // Opens front door and steps into hallway
          const t = segProgress(ms, 20000, 21400);
          stickX = lerp(17.25, 18.85, t);
          stickZ = 0.05;
          stickYaw = Math.PI / 2;
          shRPitch = t < 0.55 ? lerp(-0.2, -1.15, t / 0.55) : lerp(-1.15, -0.2, (t - 0.55) / 0.45);
          walkAmp = Math.sin(t * Math.PI);
          walkPhase = t * Math.PI * 3.0;
          sfx.triggerOnce('s3_door', () => sfx.playDoorOpen());
        } else if (ms < 23800) {
          // Walks down hallway and turns into kitchen
          const tWalk = segProgress(ms, 21400, 23400);
          const tTurn = segProgress(ms, 23100, 23800);
          stickX = lerp(18.85, 22.0, tWalk);
          stickZ = lerp(0.05, -0.45, tTurn);
          stickYaw = lerp(Math.PI / 2, Math.PI, tTurn);
          walkAmp = ms < 23500 ? 0.9 : 0;
          walkPhase = ms * 0.008;
        } else if (ms < 26000) {
          // Notices Doritos on table and grabs the bag
          const tReach = segProgress(ms, 23800, 25000);
          const tPull = ms >= 25000 ? segProgress(ms, 25000, 25950) : 0;
          stickX = 22.0;
          stickZ = -0.48;
          stickYaw = Math.PI;
          torsoLeanX = 0.16 + Math.sin(tReach * Math.PI) * 0.18;
          headPitchX = 0.25;
          shLPitch = lerp(-0.2, -1.15, tReach) * (1 - tPull * 0.35);
          elLPitch = lerp(-0.25, -0.58, tPull);
        } else {
          // Walks back down hallway and enters bedroom
          const t = segProgress(ms, 26000, 29000);
          stickX = lerp(22.0, 25.4, t);
          stickZ = t < 0.25 ? lerp(-0.48, 0.15, t / 0.25) : lerp(0.15, 0.42, (t - 0.25) / 0.75);
          stickYaw = Math.PI / 2;
          shLPitch = -0.82;
          elLPitch = -0.78;
          walkAmp = t > 0.92 ? lerp(1, 0, (t - 0.92) / 0.08) : 1;
          walkPhase = ms * 0.0082;
        }
      }
      // =====================================================================
      // SCENE 4 (29000 - 41000ms): THE CD! (Bed -> Eyes snap open -> Big Shelf)
      // =====================================================================
      else if (ms < 41000) {
        if (ms < 30500) {
          // Sits on bed and lies down
          const tSit = segProgress(ms, 29000, 29700);
          const tLie = segProgress(ms, 29700, 30500);
          stickX = lerp(25.4, 26.32, tLie);
          stickY = lerp(0, 0.58, tLie);
          stickZ = lerp(0.42, 1.15, tSit * 0.65 + tLie * 0.35);
          stickYaw = lerp(Math.PI / 2, 0, tSit);
          stickRollZ = lerp(0, Math.PI / 2, tLie);
          hipsY = lerp(0.74, 0.52, tSit * (1 - tLie)) + tLie * 0.22;
          sittingBend = tSit * (1 - tLie);
          mouthMode = 'neutral';
        } else if (ms < 32800) {
          // Slowly closes eyes; room becomes quiet
          const tClose = segProgress(ms, 30600, 32300);
          stickX = 26.32;
          stickY = 0.58;
          stickZ = 1.15;
          stickYaw = 0;
          stickRollZ = Math.PI / 2;
          hipsY = 0.74;
          eyelidClosed = tClose;
          bedroomLightInt = lerp(1.55, 0.32, tClose);
          deskLightInt = lerp(1.3, 0.35, tClose);
          mouthMode = 'neutral';
        } else if (ms < 34500) {
          // Suddenly eyes SNAP open! "THE CD!!!"
          stickX = 26.32;
          stickY = 0.58;
          stickZ = 1.15;
          stickYaw = 0;
          stickRollZ = Math.PI / 2;
          hipsY = 0.74;
          eyelidClosed = 0;
          bedroomLightInt = 1.75;
          mouthMode = 'smile';
          headPitchX = -0.15;
          sfx.triggerOnce('s4_idea', () => sfx.playIdeaSting());
        } else if (ms < 36200) {
          // Jumps out of bed and runs to big shelf
          const tJump = segProgress(ms, 34500, 35100);
          const tRun = segProgress(ms, 34900, 36200);
          stickX = lerp(26.0, 26.25, tRun);
          stickY = Math.sin(tJump * Math.PI) * 0.22;
          stickZ = lerp(0.85, -1.35, tRun);
          stickYaw = Math.PI;
          stickRollZ = lerp(Math.PI / 2, 0, tJump);
          walkAmp = 1.0;
          walkPhase = ms * 0.015;
          mouthMode = 'smile';
        } else if (ms < 39000) {
          // Searches through books, boxes and random objects on shelf
          const t = (ms - 36200) / 2800;
          stickX = 26.25 + Math.sin(t * Math.PI * 2) * 0.28;
          stickZ = -1.38;
          stickYaw = Math.PI;
          torsoLeanX = 0.15;
          shRPitch = -1.25 + Math.sin(ms * 0.014) * 0.35;
          shLPitch = -1.15 + Math.cos(ms * 0.013) * 0.35;
          elRPitch = -0.38;
          elLPitch = -0.38;
          mouthMode = 'neutral';
        } else {
          // Finds CD labeled "netscapeit 2.7.9", smiles and holds it up!
          const t = segProgress(ms, 39000, 39900);
          stickX = 26.25;
          stickZ = -1.28;
          stickYaw = lerp(Math.PI, 0.16, t);
          shRPitch = lerp(-1.1, -1.55, t);
          shRYaw = 0.18;
          elRPitch = lerp(-0.35, -0.68, t);
          mouthMode = 'smile';
        }
      }
      // =====================================================================
      // SCENE 5 (41000 - 51000ms): THE OLD COMPUTER (PC Desk + Power + Win98 Boot)
      // =====================================================================
      else if (ms < 51000) {
        mouthMode = 'smile';
        if (ms < 42800) {
          // Walks slowly to PC desk carrying CD
          const t = segProgress(ms, 41000, 42800);
          stickX = lerp(26.25, 28.75, t);
          stickZ = lerp(-1.28, -0.78, t);
          stickYaw = lerp(0.16, Math.PI, t);
          walkAmp = Math.sin(t * Math.PI);
          walkPhase = ms * 0.0065;
          shRPitch = -1.22;
          elRPitch = -0.55;
        } else if (ms < 43700) {
          // Places the CD beside the computer
          const t = segProgress(ms, 42800, 43700);
          stickX = 28.75;
          stickZ = -0.78;
          stickYaw = Math.PI - 0.18;
          torsoLeanX = Math.sin(t * Math.PI) * 0.16;
          shRPitch = lerp(-1.22, -0.98, t);
          elRPitch = -0.32;
        } else if (ms < 44800) {
          // Presses the computer's power button
          const t = segProgress(ms, 43700, 44400);
          stickX = 28.75;
          stickZ = -0.78;
          stickYaw = Math.PI - 0.25;
          shRPitch = lerp(-0.98, -1.24, Math.sin(t * Math.PI));
          elRPitch = -0.25;
          if (ms >= 44200) {
            sfx.triggerOnce('s5_power', () => sfx.playPowerButtonClick());
          }
        } else {
          // Watches Win98 boot animation
          stickX = 28.75;
          stickZ = -0.78;
          stickYaw = Math.PI;
          headPitchX = 0.05;
        }
      }
      // =====================================================================
      // SCENES 6 & 7 & 8 START (51000 - 72000ms): FILE MANAGER + INSTALLER + LAUNCH
      // =====================================================================
      else {
        mouthMode = 'smile';
        stickX = 28.75;
        stickZ = -0.78;
        stickYaw = Math.PI;
        torsoLeanX = 0.16;
        headPitchX = 0.08;

        // Right arm sits on mouse and shifts subtly while navigating UI
        const mouseWiggle = Math.sin(ms * 0.004) * 0.05;
        shRPitch = -0.86;
        shRYaw = -0.06 + mouseWiggle;
        elRPitch = -0.62;

        // Mouse Click SFX synced with CRT script beats
        if (ms >= 52950) sfx.triggerOnce('s6_cd_click', () => sfx.playMouseClick());
        if (ms >= 56050) sfx.triggerOnce('s6_zip_click', () => sfx.playMouseClick());
        if (ms >= 62600) sfx.triggerOnce('s6_exe_click', () => sfx.playMouseClick());
        if (ms >= 66850) sfx.triggerOnce('s7_yes_click', () => sfx.playMouseClick());
        if (ms >= 70500) sfx.triggerOnce('s7_ok_click', () => sfx.playMouseClick());
        if (ms >= 71100) sfx.triggerOnce('s8_launch_click', () => sfx.playMouseClick());
      }

      // Footstep SFX cadence when walking
      if (walkAmp > 0.35 && stickY < 0.05) {
        const bucket = Math.floor(walkPhase / Math.PI);
        if (bucket !== lastFootstepBucket) {
          lastFootstepBucket = bucket;
          sfx.playFootstep((bucket % 2) * 14 - 7);
        }
      }

      // Apply Stickman Rig Transforms
      sm.root.position.set(stickX, stickY, stickZ);
      sm.root.rotation.set(0, stickYaw, stickRollZ);
      sm.hips.position.y = hipsY + Math.abs(Math.sin(walkPhase)) * 0.024 * walkAmp;
      sm.torsoPivot.rotation.x = torsoLeanX;
      sm.headPivot.rotation.x = headPitchX;
      sm.headPivot.rotation.y = headYawY;

      // Eyelids & Mouth Expressions
      const lidScale = lerp(0.05, 1.15, eyelidClosed);
      sm.eyelidL.scale.y = lidScale;
      sm.eyelidR.scale.y = lidScale;
      sm.eyelidL.position.y = lerp(0.052, 0.028, eyelidClosed);
      sm.eyelidR.position.y = lerp(0.052, 0.028, eyelidClosed);

      if (mouthMode === 'smile') {
        sm.mouthArc.rotation.z = Math.PI;
        sm.mouthArc.scale.y = 1.0;
        sm.mouthArc.position.y = -0.026;
      } else if (mouthMode === 'frown') {
        sm.mouthArc.rotation.z = 0;
        sm.mouthArc.scale.y = 1.0;
        sm.mouthArc.position.y = -0.058;
      } else {
        sm.mouthArc.rotation.z = 0;
        sm.mouthArc.scale.y = 0.16;
        sm.mouthArc.position.y = -0.044;
      }

      sm.shoulderR.rotation.set(shRPitch, shRYaw, shRRoll);
      sm.elbowR.rotation.set(elRPitch, 0, 0);
      sm.shoulderL.rotation.set(
        shLPitch + Math.sin(walkPhase) * 0.35 * walkAmp,
        shLYaw,
        shLRoll
      );
      sm.elbowL.rotation.set(elLPitch, 0, 0);

      const stride = Math.sin(walkPhase) * 0.48 * walkAmp;
      sm.hipR.rotation.x = stride - sittingBend * 1.35;
      sm.kneeR.rotation.x = Math.max(0, stride * 0.72) + sittingBend * 1.45;
      sm.hipL.rotation.x = -stride - sittingBend * 1.35;
      sm.kneeL.rotation.x = Math.max(0, -stride * 0.72) + sittingBend * 1.45;

      // =====================================================================
      // WORLD OBJECTS, DOORS, SHELF RUMMAGE & HAND PROPS
      // =====================================================================
      world.sceneGroup.updateMatrixWorld(true);
      sm.handR.getWorldPosition(_handRPos);
      sm.handL.getWorldPosition(_handLPos);

      // Microsoft Double Doors (0 - 3.0s)
      let msDoorAngle = 0;
      if (ms < 1400) {
        msDoorAngle = segProgress(ms, 0, 1000) * 1.25;
      } else if (ms < 3200) {
        msDoorAngle = (1 - segProgress(ms, 1800, 3000)) * 1.25;
      }
      world.msDoorLeft.rotation.y = -msDoorAngle;
      world.msDoorRight.rotation.y = msDoorAngle;

      // House Front Door (20 - 23.2s)
      let houseDoorAngle = 0;
      if (ms >= 20000 && ms < 21600) {
        houseDoorAngle = -segProgress(ms, 20050, 21000) * 1.35;
      } else if (ms >= 21600 && ms < 23500) {
        houseDoorAngle = -(1 - segProgress(ms, 21800, 23200)) * 1.35;
      }
      world.houseDoor.rotation.y = houseDoorAngle;

      // FIRED paper & Crumpled Ball (Scene 1)
      if (ms < 4250) {
        world.firedPaper.visible = true;
        world.crumpledBall.visible = false;
        world.firedPaper.position.set(
          (_handRPos.x + _handLPos.x) * 0.5,
          _handRPos.y + 0.08,
          _handRPos.z + 0.08
        );
        world.firedPaper.rotation.set(-0.22, stickYaw, 0);
      } else if (ms < 8500) {
        world.firedPaper.visible = false;
        world.crumpledBall.visible = true;
        if (ms < 5250) {
          world.crumpledBall.position.copy(_handRPos);
        } else if (ms < 5760) {
          const arcT = clamp01((ms - 5250) / 510);
          world.crumpledBall.position.set(
            lerp(_handRPos.x, 0.5, arcT),
            lerp(_handRPos.y, 0.52, arcT) + Math.sin(arcT * Math.PI) * 0.45,
            lerp(_handRPos.z, 0.55, arcT)
          );
        } else {
          world.crumpledBall.position.set(0.5, 0.12, 0.55);
        }
      } else {
        world.firedPaper.visible = false;
        world.crumpledBall.visible = false;
      }

      // Nokia Phone 02:17 (Scene 2: 12s - 15.9s)
      if (ms >= 12150 && ms <= 15900) {
        world.nokiaPhone.visible = true;
        world.nokiaPhone.position.set(
          _handRPos.x + 0.03,
          _handRPos.y + 0.06,
          _handRPos.z + 0.05
        );
        world.nokiaPhone.rotation.set(-0.28, stickYaw - 0.12, 0);
      } else {
        world.nokiaPhone.visible = false;
      }

      // Doritos Bag (Scene 3+)
      if (ms < 24950) {
        world.doritosBag.position.set(22.0, 0.77, -1.02);
        world.doritosBag.rotation.set(0, 0.25, 0);
      } else if (ms < 29300) {
        world.doritosBag.position.set(_handLPos.x, _handLPos.y - 0.12, _handLPos.z + 0.04);
        world.doritosBag.rotation.set(0.15, stickYaw, 0);
      } else {
        world.doritosBag.position.set(24.85, 0.02, 0.55);
        world.doritosBag.rotation.set(0, 0.55, 0);
      }

      // Shelf Items Rummage Motion (Scene 4: 36.2s - 39s)
      world.shelfItems.forEach((item, idx) => {
        const bx = item.userData.baseX as number;
        const bz = item.userData.baseZ as number;
        if (ms >= 36200 && ms < 39200) {
          const jitter = Math.sin(ms * 0.015 + idx * 1.4);
          item.position.x = bx + jitter * 0.07;
          item.position.z = bz + (idx >= 6 ? 0.09 : 0);
          item.rotation.z = jitter * 0.18;
        } else if (ms >= 39200) {
          item.position.x = bx + (idx >= 6 ? 0.12 : 0);
          item.position.z = bz;
          item.rotation.z = idx >= 6 ? 0.12 : 0;
        } else {
          item.position.x = bx;
          item.position.z = bz;
          item.rotation.z = 0;
        }
      });

      // CD Disc ("netscapeit 2.7.9")
      if (ms < 39050) {
        world.cdDisc.position.set(26.27, 1.07, -1.97);
        world.cdDisc.rotation.set(0, 0.4, 0);
      } else if (ms < 43250) {
        const showT =
          ms < 41000
            ? segProgress(ms, 39050, 39800)
            : 1 - segProgress(ms, 42400, 43250);
        world.cdDisc.position.set(
          _handRPos.x + lerp(0, 0.02, showT),
          _handRPos.y + lerp(0, 0.05, showT),
          _handRPos.z + lerp(0.03, 0.08, showT)
        );
        world.cdDisc.rotation.set(lerp(0.15, Math.PI / 2 - 0.12, showT), 0.1, 0);
      } else {
        // Placed neatly beside HP computer on desk
        world.cdDisc.position.set(29.06, 0.80, -1.78);
        world.cdDisc.rotation.set(0, 0.35, 0);
      }

      // PC Power Button, LEDs, Mouse & CRT Update
      world.powerButton.position.z = ms >= 44150 && ms <= 44450 ? 0.219 : 0.226;
      const pcOn = ms >= 44350;
      const cdActivity = (ms >= 51000 && ms < 61000) || (ms >= 71000 && ms < 72000);
      world.towerPowerLedMat.emissiveIntensity = pcOn ? 1.8 : 0;
      world.monitorPowerLedMat.emissiveIntensity = pcOn ? 1.8 : 0;
      world.towerCdLedMat.emissiveIntensity = cdActivity
        ? 0.85 + 0.8 * Math.abs(Math.sin(ms * 0.02))
        : 0;

      if (ms >= 51000 && ms < 72000) {
        world.mouseGroup.position.x = 0.25 + Math.sin(ms * 0.004) * 0.035;
        world.mouseGroup.position.z = 0.24 + Math.cos(ms * 0.003) * 0.025;
      }

      world.bedroomCeilingLight.intensity = bedroomLightInt;
      world.deskLampLight.intensity = deskLightInt;

      if (ms >= 44400 && ms < WHITE_START_MS) {
        drawOriginCrtCanvas(world.crtCtx, ms);
        world.crtTexture.needsUpdate = true;
      }
      world.crtScreenMat.emissiveIntensity = pcOn ? 0.95 : 0;

      // =====================================================================
      // CAMERA CHOREOGRAPHY ACROSS ALL 9 SCENES (0 - 72s)
      // =====================================================================
      let targetFov = 46;
      if (ms < 1600) {
        // Scene 1: Wide outside Microsoft building
        const t = segProgress(ms, 0, 1500);
        _camTargetPos.set(lerp(-2.5, -1.35, t), lerp(1.75, 1.48, t), lerp(2.25, 1.9, t));
        _camTargetLook.set(lerp(-2.8, -1.65, t), lerp(1.38, 1.15, t), lerp(-1.0, 0.0, t));
      } else if (ms < 3400) {
        // Scene 1: Zoom in on FIRED paper
        const t = segProgress(ms, 1600, 2750);
        _camTargetPos.set(lerp(-1.35, -1.55, t), lerp(1.48, 1.12, t), lerp(1.9, 0.72, t));
        _camTargetLook.set(lerp(-1.65, -1.63, t), lerp(1.15, 1.05, t), lerp(0.0, 0.14, t));
      } else if (ms < 8000) {
        // Scene 1: Pull back for crumple, trash can throw & turn down street
        const t = segProgress(ms, 3400, 5200);
        _camTargetPos.set(lerp(-1.55, 1.35, t), lerp(1.12, 1.46, t), lerp(0.72, 2.55, t));
        _camTargetLook.set(lerp(-1.63, 0.45, t), lerp(1.05, 0.96, t), lerp(0.14, 0.28, t));
      } else if (ms < 12000) {
        // Scene 2: Lonely walk under streetlights
        const t = segProgress(ms, 8000, 12000);
        _camTargetPos.set(lerp(1.4, 7.6, t), 1.45, 2.95);
        _camTargetLook.set(lerp(2.4, 8.2, t), 1.02, 0.15);
      } else if (ms < 16000) {
        // Scene 2: Camera zooms into phone screen showing 02:17
        const tIn = segProgress(ms, 12200, 13700);
        const tOut = ms >= 15350 ? segProgress(ms, 15350, 16000) : 0;
        const zFactor = tIn * (1 - tOut);
        _camTargetPos.set(lerp(7.6, 8.38, zFactor), lerp(1.45, 1.18, zFactor), lerp(2.95, 0.88, zFactor));
        _camTargetLook.set(lerp(8.2, 8.34, zFactor), lerp(1.02, 1.08, zFactor), lerp(0.15, 0.35, zFactor));
        targetFov = lerp(46, 34, zFactor);
      } else if (ms < 20000) {
        // Scene 2: Remaining lonely walk home
        const t = segProgress(ms, 16000, 20000);
        _camTargetPos.set(lerp(7.6, 16.2, t), 1.52, 3.25);
        _camTargetLook.set(lerp(8.2, 17.5, t), 1.08, 0.05);
      } else if (ms < 23800) {
        // Scene 3: Opens front door -> hallway -> kitchen
        const t = segProgress(ms, 20000, 23400);
        _camTargetPos.set(lerp(16.2, 22.15, t), lerp(1.52, 1.62, t), lerp(3.25, 2.25, t));
        _camTargetLook.set(lerp(17.5, 22.0, t), 1.02, lerp(0.05, -0.85, t));
      } else if (ms < 26200) {
        // Scene 3: Frame Doritos bag grab
        const t = segProgress(ms, 23800, 25000);
        _camTargetPos.set(lerp(22.15, 22.8, t), lerp(1.62, 1.38, t), lerp(2.25, 1.15, t));
        _camTargetLook.set(22.0, 0.92, -0.95);
      } else if (ms < 29000) {
        // Scene 3: Walks down hallway into bedroom
        const t = segProgress(ms, 26200, 29000);
        _camTargetPos.set(lerp(22.8, 26.15, t), lerp(1.38, 1.68, t), lerp(1.15, 3.25, t));
        _camTargetLook.set(lerp(22.0, 25.55, t), 0.85, lerp(-0.95, 0.9, t));
      } else if (ms < 34500) {
        // Scene 4: Tight intimate framing on bed as eyes close & SNAP open!
        const t = segProgress(ms, 29200, 31500);
        _camTargetPos.set(lerp(26.15, 25.15, t), lerp(1.68, 1.24, t), lerp(3.25, 2.45, t));
        _camTargetLook.set(lerp(25.55, 25.05, t), lerp(0.85, 0.62, t), 1.15);
      } else if (ms < 39000) {
        // Scene 4: Follows sprint to Big Shelf rummage
        const t = segProgress(ms, 34500, 36200);
        _camTargetPos.set(lerp(25.15, 26.85, t), lerp(1.24, 1.48, t), lerp(2.45, 0.65, t));
        _camTargetLook.set(lerp(25.05, 26.25, t), lerp(0.62, 1.16, t), lerp(1.15, -1.9, t));
      } else if (ms < 41000) {
        // Scene 4: Close-up holding "netscapeit 2.7.9" CD smiling
        const t = segProgress(ms, 39000, 40000);
        _camTargetPos.set(lerp(26.85, 26.32, t), lerp(1.48, 1.22, t), lerp(0.65, -0.32, t));
        _camTargetLook.set(26.28, 1.16, -1.1);
        targetFov = lerp(46, 38, t);
      } else if (ms < 44800) {
        // Scene 5: Tracks over to PC desk, placing CD + pressing power button
        const t = segProgress(ms, 41000, 43400);
        _camTargetPos.set(lerp(26.32, 29.65, t), lerp(1.22, 1.42, t), lerp(-0.32, -0.18, t));
        _camTargetLook.set(lerp(26.28, 29.1, t), lerp(1.16, 1.02, t), lerp(-1.1, -1.55, t));
      } else if (ms < 63000) {
        // Scenes 5 & 6: Frames 1999 CRT screen cleanly (Win98 boot + File Manager + Zip extract)
        const t = segProgress(ms, 44800, 46800);
        _camTargetPos.set(lerp(29.65, 28.73, t), lerp(1.42, 1.08, t), lerp(-0.18, -0.92, t));
        _camTargetLook.set(lerp(29.1, 28.73, t), lerp(1.02, 1.076, t), lerp(-1.55, -1.58, t));
        targetFov = lerp(46, 40, t);
      } else if (ms < 71000) {
        // Scene 7: Third-person view from behind the stickman's desk!
        const t = segProgress(ms, 63000, 64300);
        _camTargetPos.set(lerp(28.73, 29.26, t), lerp(1.08, 1.54, t), lerp(-0.92, -0.02, t));
        _camTargetLook.set(28.73, 1.08, -1.52);
        targetFov = lerp(40, 45, t);
      } else {
        // Scene 8 (71 - 72s): Camera slowly zooms straight toward monitor into white!
        const t = segProgress(ms, 71000, WHITE_START_MS);
        _camTargetPos.set(lerp(29.26, 28.73, t), lerp(1.54, 1.078, t), lerp(-0.02, -1.51, t));
        _camTargetLook.set(28.73, 1.076, -1.58);
        targetFov = lerp(45, 28, t);
      }

      const dampLambda = 7.2;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, dampLambda, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, dampLambda, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, dampLambda, dt);

      _camCurrentLook.x = THREE.MathUtils.damp(_camCurrentLook.x, _camTargetLook.x, dampLambda, dt);
      _camCurrentLook.y = THREE.MathUtils.damp(_camCurrentLook.y, _camTargetLook.y, dampLambda, dt);
      _camCurrentLook.z = THREE.MathUtils.damp(_camCurrentLook.z, _camTargetLook.z, dampLambda, dt);
      camera.lookAt(_camCurrentLook);

      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, dampLambda, dt);
        camera.updateProjectionMatrix();
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const ms = now - startTime;
      const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
      prevTime = now;

      if (ms >= TOTAL_MS) {
        onCompleteRef.current();
        return;
      }

      // Scene 4 thought bubble visibility ("THE CD!!!")
      const bubbleOn = ms >= 32850 && ms <= 34550;
      if (bubbleOn !== lastBubble) {
        lastBubble = bubbleOn;
        setShowThoughtBubble(bubbleOn);
      }

      // Phase determination (3d -> white -> ui_fade -> final_title)
      let phase: '3d' | 'white' | 'ui_fade' | 'final_title' = '3d';
      if (ms >= FINAL_BLACK_START_MS) {
        phase = 'final_title';
      } else if (ms >= WHITE_END_MS) {
        phase = 'ui_fade';
      } else if (ms >= WHITE_START_MS) {
        phase = 'white';
      }
      if (phase !== lastPhase) {
        lastPhase = phase;
        setOverlayPhase(phase);
      }

      // Scene 8 subtle startup chime AFTER 6 full seconds of pure silence (78,050ms)
      if (ms >= WHITE_END_MS + 50 && ms < FINAL_BLACK_START_MS) {
        sfx.triggerOnce('s8_subtle_startup', () => sfx.playSubtleStartupChime());
      }
      // Scene 9 soft Windows 98-style startup chord (80,000ms)
      if (ms >= 80000) {
        sfx.triggerOnce('s9_win98_chord', () => sfx.playWin98StartupChord());
      }

      const nextWhite =
        ms < 71400
          ? 0
          : ms < WHITE_START_MS
          ? clamp01((ms - 71400) / (WHITE_START_MS - 71400))
          : ms < FINAL_BLACK_START_MS
          ? 1
          : 0;
      const nextUi =
        ms >= WHITE_END_MS && ms < FINAL_BLACK_START_MS
          ? clamp01((ms - WHITE_END_MS) / 850)
          : ms >= FINAL_BLACK_START_MS
          ? Math.max(0, 1 - clamp01((ms - FINAL_BLACK_START_MS) / 900))
          : 0;
      const nextBlack =
        ms >= FINAL_BLACK_START_MS
          ? clamp01((ms - FINAL_BLACK_START_MS) / 950)
          : 0;
      const nextTitle =
        ms >= 80100 ? clamp01((ms - 80100) / 1400) : 0;

      if (Math.abs(nextWhite - lastWhiteOp) > 0.015) {
        lastWhiteOp = nextWhite;
        setWhiteOpacity(nextWhite);
      }
      if (Math.abs(nextUi - lastUiOp) > 0.015) {
        lastUiOp = nextUi;
        setUiPreviewOpacity(nextUi);
      }
      if (Math.abs(nextBlack - lastBlackOp) > 0.015) {
        lastBlackOp = nextBlack;
        setBlackOpacity(nextBlack);
      }
      if (Math.abs(nextTitle - lastTitleOp) > 0.015) {
        lastTitleOp = nextTitle;
        setTitleOpacity(nextTitle);
      }

      if (ms < WHITE_START_MS) {
        updateSceneAtTime(ms, dt);
        renderer.render(scene, camera);
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          rafId = window.requestAnimationFrame(tick);
        }
      } else {
        // During Scenes 8 white hold & Scene 9 finale no WebGL redraws needed
        timeoutId = window.setTimeout(tick, 50);
      }
    };

    if (isSoftwareGl) {
      updateSceneAtTime(0, 0.016);
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      sfx.dispose();
      world.disposables.forEach((d) => d.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 h-screen w-screen overflow-hidden select-none bg-[#0b101b]"
      aria-label="Netscapeit Origin Story 3D Intro"
    >
      {/* Dedicated WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Scene 4 Thought Bubble Overlay ("THE CD!!!") */}
      {showThoughtBubble && overlayPhase === '3d' && (
        <div className="pointer-events-none absolute top-[18%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="bg-[#ffffff] text-[#000000] border-[3px] border-[#000000] rounded-2xl px-6 py-3 shadow-[4px_4px_0_#000000]">
            <span className="font-black text-2xl tracking-wide" style={{ fontFamily: 'Arial, sans-serif' }}>
              &ldquo;THE CD!!!&rdquo;
            </span>
          </div>
          <div className="w-4 h-4 bg-white border-2 border-black rounded-full mt-1.5" />
          <div className="w-2.5 h-2.5 bg-white border-2 border-black rounded-full mt-1 -ml-3" />
        </div>
      )}

      {/* WebGL Context Lost Fallback */}
      {webglLost && overlayPhase === '3d' && (
        <div className="absolute inset-0 bg-[#101520] text-[#e8e8e0] flex flex-col items-center justify-center p-6 text-center text-sm">
          <p className="font-bold mb-3">3D Viewport Suspended</p>
          <button
            type="button"
            onClick={() => onCompleteRef.current()}
            className="px-3 py-1 bg-[#c0c0c0] text-[#000000] bevel-out-sm text-xs font-bold cursor-pointer"
          >
            Open Netscapeit
          </button>
        </div>
      )}

      {/* Scene 8: 6-Second Pure White Hold (72s - 78s) */}
      {whiteOpacity > 0 && (
        <div
          className="absolute inset-0 bg-[#ffffff] pointer-events-none z-20"
          style={{ opacity: whiteOpacity }}
        />
      )}

      {/* Scene 8 -> 78s-79s: Authentic Netscapeit Interface Fade-In */}
      {uiPreviewOpacity > 0 && (
        <div
          className="absolute inset-0 bg-[#c0c0c0] flex flex-col z-[25] pointer-events-none"
          style={{ opacity: uiPreviewOpacity }}
        >
          <div
            className="h-6 px-2 flex items-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
          >
            Netscape Navigator 4.72 [netscapeit]
          </div>
          <div className="px-2 py-1 border-b border-[#808080] text-xs text-black flex gap-3">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Go</span>
            <span>Communicator</span>
            <span>Help</span>
          </div>
          <div className="px-2 py-1 border-b border-[#808080] text-xs text-black flex items-center gap-2">
            <span>Location:</span>
            <div className="flex-1 bg-white bevel-in-sm px-2 py-0.5 font-mono-retro text-xs">
              http://home.netscapeit.com/
            </div>
          </div>
          <div className="flex-1 m-1 bg-white bevel-in p-6 text-black">
            <h1 className="text-xl font-bold text-[#003366] mb-1">
              Netscapeit Navigator 4.72
            </h1>
            <p className="text-xs text-[#444444]">
              Connecting to Netcenter...
            </p>
          </div>
        </div>
      )}

      {/* Scene 9 (79s - 84s): Fade to Black & Glowing NETSCAPEIT Final Title */}
      {blackOpacity > 0 && (
        <div
          className="absolute inset-0 bg-[#000000] z-30 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
          style={{ opacity: blackOpacity }}
        >
          <div style={{ opacity: titleOpacity }}>
            <div
              className="text-5xl md:text-6xl font-black tracking-[0.18em] text-[#e8fff4] mb-4"
              style={{
                fontFamily: 'Georgia, serif',
                textShadow:
                  '0 0 18px rgba(42, 168, 128, 0.9), 0 0 42px rgba(24, 122, 92, 0.7)',
              }}
            >
              NETSCAPEIT
            </div>
            <p
              className="text-base md:text-xl text-[#c7ddd4] font-medium tracking-wide mb-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Sometimes getting fired is just the beginning.
            </p>
            <p className="text-xs tracking-[0.26em] uppercase text-[#7aa695]">
              THE END OF THE INTRO. THE BEGINNING OF NETSCAPEIT.
            </p>
          </div>
        </div>
      )}

      {/* Discreet Sound & Skip Controls during 3D sequence */}
      {overlayPhase === '3d' && (
        <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSound}
            className="px-2.5 py-1 bg-[#c0c0c0] text-[#000000] bevel-out-sm text-xs font-bold cursor-pointer"
          >
            {soundMuted ? 'Sound: Off' : 'Sound: On'}
          </button>
          <button
            type="button"
            onClick={() => onCompleteRef.current()}
            className="px-2.5 py-1 bg-[#c0c0c0] text-[#000000] bevel-out-sm text-xs font-bold cursor-pointer"
          >
            Skip Intro &gt;&gt;
          </button>
        </div>
      )}
    </div>
  );
};
