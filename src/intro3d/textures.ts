import * as THREE from 'three';

export function createWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.05) * 8 + Math.cos(y * 0.17) * 4;
    const shade = Math.floor(wave + (Math.random() - 0.5) * 14);
    const r = Math.min(255, Math.max(0, 142 + shade));
    const g = Math.min(255, Math.max(0, 96 + Math.floor(shade * 0.7)));
    const b = Math.min(255, Math.max(0, 54 + Math.floor(shade * 0.45)));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 512, 2);
  }

  ctx.strokeStyle = 'rgba(48, 28, 12, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 128; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCarpetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#515660';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 68 + Math.floor(Math.random() * 30);
    ctx.fillStyle = `rgb(${v},${v + 3},${v + 9})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createAsphaltTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#252830';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 7000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 28 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMicrosoftSignTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c2430';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#60738a';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);

  // Classic 1999 bold italic Microsoft corporate logotype
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 64px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Microsoft', 256, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFiredPaperTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8f6ef';
  ctx.fillRect(0, 0, 256, 320);

  ctx.fillStyle = '#333333';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TERMINATION NOTICE', 128, 48);

  ctx.fillStyle = '#888888';
  ctx.fillRect(36, 72, 184, 3);

  ctx.fillStyle = '#cc0000';
  ctx.font = 'bold 62px Arial, Helvetica, sans-serif';
  ctx.fillText('FIRED', 128, 168);

  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 108, 216, 80);

  ctx.fillStyle = '#555555';
  ctx.fillRect(40, 224, 176, 6);
  ctx.fillRect(40, 244, 140, 6);
  ctx.fillRect(40, 264, 160, 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPhoneScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  // Classic 1999 green backlit LCD
  ctx.fillStyle = '#92c468';
  ctx.fillRect(0, 0, 256, 192);
  ctx.strokeStyle = '#3d5928';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 184);

  // Signal bars & battery
  ctx.fillStyle = '#182b0e';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(18 + i * 7, 32 - i * 4, 4, 8 + i * 4);
  }
  ctx.fillRect(212, 20, 24, 12);
  ctx.fillRect(236, 23, 4, 6);

  ctx.font = 'bold 74px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('02:17', 128, 124);

  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('MENU        NAMES', 128, 170);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createDoritosTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, '#c81010');
  grad.addColorStop(0.55, '#e02010');
  grad.addColorStop(1, '#8c0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 320);

  // Triangle graphic behind logo
  ctx.fillStyle = '#ffb800';
  ctx.beginPath();
  ctx.moveTo(128, 46);
  ctx.lineTo(222, 208);
  ctx.lineTo(34, 208);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#111111';
  ctx.fillRect(20, 126, 216, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DORITOS', 128, 162);

  ctx.fillStyle = '#ffe680';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('NACHO CHEESE', 128, 250);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPosterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#19263c';
  ctx.fillRect(0, 0, 256, 340);

  ctx.strokeStyle = '#d4cbb4';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 330);

  const grad = ctx.createLinearGradient(0, 30, 0, 210);
  grad.addColorStop(0, '#2a4572');
  grad.addColorStop(1, '#18243a');
  ctx.fillStyle = grad;
  ctx.fillRect(22, 24, 212, 190);

  ctx.fillStyle = '#f2b830';
  ctx.beginPath();
  ctx.arc(128, 114, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5f2ea';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NET 1999', 128, 260);

  ctx.fillStyle = '#9ac2eb';
  ctx.font = 'bold 15px Courier New, monospace';
  ctx.fillText('56K V.90 MODEM', 128, 294);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCdTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  ctx.clearRect(0, 0, 512, 512);

  const conic = ctx.createConicGradient(0.4, cx, cy);
  conic.addColorStop(0, '#dfe5ec');
  conic.addColorStop(0.18, '#b6d8fb');
  conic.addColorStop(0.32, '#f4d2e6');
  conic.addColorStop(0.5, '#d6dde5');
  conic.addColorStop(0.68, '#bff0da');
  conic.addColorStop(0.84, '#f8e6b8');
  conic.addColorStop(1, '#dfe5ec');

  ctx.fillStyle = conic;
  ctx.beginPath();
  ctx.arc(cx, cy, 246, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(200, 212, 226, 0.72)';
  ctx.beginPath();
  ctx.arc(cx, cy, 76, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b1d22';
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#737d8c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 244, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#092458';
  ctx.font = 'bold 48px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('netscapeit', cx, 132);

  ctx.fillStyle = '#14171f';
  ctx.font = 'bold 44px Courier New, monospace';
  ctx.fillText('2.7.9', cx, 392);

  ctx.fillStyle = '#3c4b66';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('CD-ROM  WIN98', cx, 430);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHpTowerFrontTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c9c6b9';
  ctx.fillRect(0, 0, 256, 512);

  ctx.fillStyle = '#636c7a';
  ctx.fillRect(22, 24, 212, 168);

  ctx.fillStyle = '#dbd7c7';
  ctx.fillRect(30, 38, 196, 52);
  ctx.strokeStyle = '#3a3e45';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 38, 196, 52);

  ctx.fillStyle = '#22262e';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('32x MAX CD-ROM', 42, 60);

  ctx.fillStyle = '#9aa0a8';
  ctx.fillRect(178, 70, 34, 11);

  ctx.fillStyle = '#dbd7c7';
  ctx.fillRect(30, 118, 196, 36);
  ctx.strokeRect(30, 118, 196, 36);
  ctx.fillStyle = '#1d2026';
  ctx.fillRect(58, 132, 132, 7);

  ctx.fillStyle = '#263954';
  ctx.fillRect(32, 224, 192, 46);
  ctx.fillStyle = '#eef3fb';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('hp pavilion', 128, 255);

  ctx.fillStyle = '#757880';
  for (let y = 390; y < 484; y += 11) {
    ctx.fillRect(34, y, 188, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const segProgress = (ms: number, start: number, end: number): number =>
  easeInOut(clamp01((ms - start) / (end - start)));

// Renders CRT screen for Scenes 5 (41-51s), 6 (51-63s), 7 (63-71s), and 8 (71-79s)
export function drawOriginCrtCanvas(
  ctx: CanvasRenderingContext2D,
  ms: number
): void {
  const W = 512;
  const H = 384;

  // Off prior to Scene 5 PC turn on (44.5s)
  ctx.fillStyle = '#111419';
  ctx.fillRect(0, 0, W, H);

  if (ms < 44500) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(185, 0);
    ctx.lineTo(75, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    return;
  }

  // 44.5s - 45.2s: CRT warm-up flash
  if (ms < 45200) {
    const t = segProgress(ms, 44500, 45200);
    const barH = Math.max(8, t * H);
    ctx.fillStyle = '#dbeaff';
    ctx.fillRect(0, H / 2 - barH / 2, W, barH);
    return;
  }

  // 45.2s - 46.0s: BIOS POST
  if (ms < 46000) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '15px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP Pavilion BIOS v4.51 (1999)', 24, 48);
    ctx.fillStyle = '#9e9e9e';
    ctx.fillText('Pentium III 500MHz · 64MB SDRAM OK', 24, 80);
    ctx.fillText('CD-ROM Drive [D:] Detected', 24, 112);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Booting Windows 98...', 24, 160);
    return;
  }

  // 46.0s - 50.0s: Windows 98 Boot Animation
  if (ms < 50000) {
    const pct = clamp01((ms - 46000) / 3800);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#85bce8');
    sky.addColorStop(0.65, '#b8dcf8');
    sky.addColorStop(1, '#e8f4fc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(125, 110, 105, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(385, 130, 120, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    const fx = 212;
    const fy = 62;
    ctx.fillStyle = '#e23a1d';
    ctx.fillRect(fx, fy, 38, 36);
    ctx.fillStyle = '#2ea431';
    ctx.fillRect(fx + 44, fy + 4, 38, 36);
    ctx.fillStyle = '#1e72d2';
    ctx.fillRect(fx - 2, fy + 42, 38, 36);
    ctx.fillStyle = '#f2b718';
    ctx.fillRect(fx + 42, fy + 46, 38, 36);

    ctx.fillStyle = '#002255';
    ctx.font = 'bold 31px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WINDOWS 98', W / 2, 212);

    ctx.fillStyle = '#143866';
    ctx.font = '15px Tahoma, Arial, sans-serif';
    ctx.fillText('Starting Windows 98...', W / 2, 244);

    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(56, 314, 400, 26);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 314, 400, 26);

    const barGrad = ctx.createLinearGradient(60, 0, 452, 0);
    barGrad.addColorStop(0, '#003399');
    barGrad.addColorStop(0.5, '#3399ff');
    barGrad.addColorStop(1, '#003399');
    ctx.fillStyle = barGrad;
    ctx.fillRect(60, 318, Math.max(14, pct * 392), 18);
    return;
  }

  // 50.0s - 51.0s: Windows 98 Desktop loaded
  ctx.fillStyle = '#008080';
  ctx.fillRect(0, 0, W, H - 28);

  // Desktop My Computer icon
  ctx.fillStyle = '#d8d4c4';
  ctx.fillRect(14, 16, 26, 22);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 16, 26, 22);
  ctx.fillStyle = '#3399ff';
  ctx.fillRect(18, 20, 18, 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('My Computer', 27, 50);

  // Taskbar
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, H - 28, W, 28);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(4, H - 24, 58, 20);
  ctx.strokeStyle = '#404040';
  ctx.strokeRect(4, H - 24, 58, 20);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Tahoma, sans-serif';
  ctx.fillText('Start', 33, H - 10);

  ctx.textAlign = 'right';
  ctx.font = '11px Tahoma, sans-serif';
  ctx.fillText('02:21 AM', W - 12, H - 10);

  if (ms < 51000) {
    return;
  }

  // --- Scene 6 (51s-63s): File Manager -> CD-ROM -> netscapeit.zip -> extract -> netscapeitinstaller.exe ---
  // --- Scene 7 (63s-71s): NETSCAPEIT INSTALLER [YES]/[NO] -> Installation successful! [OK] ---
  // --- Scene 8 (71s-79s): First launch ---
  let ptrX = 250;
  let ptrY = 190;
  let cdOpened = false;
  let showZip = false;
  let showExtractWin = false;
  let extractPct = 0;
  let showInstallerExe = false;
  let installerSelected = false;
  let showInstallerPrompt = false;
  let yesHover = false;
  let showSuccessPopup = false;
  let okHover = false;
  let clickPulse = false;
  let showHourglass = false;

  if (ms < 53000) {
    // 51-53s: File Manager open, pointer moves to CD-ROM (D:)
    const t = segProgress(ms, 51400, 52900);
    ptrX = lerp(250, 102, t);
    ptrY = lerp(190, 192, t);
  } else if (ms < 56200) {
    // 53-56.2s: CD-ROM opened -> netscapeit.zip appears -> pointer moves & double clicks it
    cdOpened = true;
    showZip = true;
    clickPulse = ms < 53300 || (ms >= 56000 && ms < 56200);
    const t = segProgress(ms, 53400, 55900);
    ptrX = lerp(102, 255, t);
    ptrY = lerp(192, 146, t);
  } else if (ms < 60200) {
    // 56.2-60.2s: Extraction window opens & extracts archive
    cdOpened = true;
    showZip = true;
    showExtractWin = true;
    extractPct = clamp01((ms - 56600) / 3300);
    ptrX = 255;
    ptrY = 146;
  } else if (ms < 63000) {
    // 60.2-63s: netscapeitinstaller.exe appears -> pointer moves & double clicks it
    cdOpened = true;
    showZip = true;
    showInstallerExe = true;
    const t = segProgress(ms, 60400, 62500);
    ptrX = lerp(255, 360, t);
    ptrY = 146;
    if (ms >= 62500) {
      installerSelected = true;
      clickPulse = true;
    }
  } else if (ms < 67200) {
    // Scene 7 (63-67.2s): NETSCAPEIT INSTALLER popup ("Would you like to open Netscapeit? [YES] [NO]")
    cdOpened = true;
    showZip = true;
    showInstallerExe = true;
    showInstallerPrompt = true;
    const t = segProgress(ms, 64600, 66700);
    ptrX = lerp(360, 214, t);
    ptrY = lerp(146, 224, t);
    yesHover = t > 0.7;
    if (ms >= 66850) clickPulse = true;
  } else if (ms < 71000) {
    // Scene 7 (67.2-71s): Installation successful! popup -> moves to OK & clicks OK
    cdOpened = true;
    showZip = true;
    showInstallerExe = true;
    showSuccessPopup = true;
    const t = segProgress(ms, 68200, 70400);
    ptrX = lerp(214, 256, t);
    ptrY = lerp(224, 228, t);
    okHover = t > 0.6;
    if (ms >= 70500) clickPulse = true;
  } else {
    // Scene 8 (71-72s): Opening Netscapeit!
    cdOpened = true;
    showZip = true;
    showInstallerExe = true;
    installerSelected = true;
    showHourglass = true;
    ptrX = 256;
    ptrY = 228;
  }

  // Draw File Manager Window
  const wx = 38;
  const wy = 18;
  const ww = 452;
  const wh = 318;
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(wx, wy, ww, wh);

  ctx.fillStyle = '#000080';
  ctx.fillRect(wx + 4, wy + 4, ww - 8, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Tahoma, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    cdOpened ? 'File Manager - CD-ROM (D:\\)' : 'File Manager - My Computer',
    wx + 12,
    wy + 20
  );

  ctx.fillStyle = '#000000';
  ctx.font = '11px Tahoma, sans-serif';
  ctx.fillText('File   Disk   Tree   View   Options   Window   Help', wx + 10, wy + 43);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(wx + 8, wy + 56, 144, 250);
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(wx + 8, wy + 56, 144, 250);

  ctx.fillStyle = '#000000';
  ctx.fillText('My Computer', wx + 18, wy + 80);
  ctx.fillStyle = '#333333';
  ctx.fillText('Floppy (A:)', wx + 32, wy + 104);
  ctx.fillText('Hard Disk (C:)', wx + 32, wy + 128);

  if (cdOpened) {
    ctx.fillStyle = '#000080';
    ctx.fillRect(wx + 14, wy + 178, 132, 22);
  }
  ctx.fillStyle = '#cfe6ff';
  ctx.beginPath();
  ctx.arc(wx + 28, wy + 189, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#555555';
  ctx.stroke();

  ctx.fillStyle = cdOpened ? '#ffffff' : '#000000';
  ctx.font = 'bold 11px Tahoma, sans-serif';
  ctx.fillText('CD-ROM (D:)', wx + 40, wy + 193);

  // Right Pane
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(wx + 158, wy + 56, 286, 250);
  ctx.strokeStyle = '#808080';
  ctx.strokeRect(wx + 158, wy + 56, 286, 250);

  if (showZip) {
    const zx = wx + 188;
    const zy = wy + 96;
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(zx + 12, zy, 38, 42);
    ctx.strokeStyle = '#7a5c00';
    ctx.strokeRect(zx + 12, zy, 38, 42);
    ctx.fillStyle = '#787878';
    ctx.fillRect(zx + 27, zy + 2, 8, 38);
    ctx.fillStyle = '#383838';
    ctx.fillRect(zx + 24, zy + 16, 14, 9);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('netscapeit.zip', zx + 31, zy + 58);
  }

  if (showInstallerExe) {
    const ex = wx + 292;
    const ey = wy + 96;
    if (installerSelected) {
      ctx.fillStyle = 'rgba(0,0,128,0.16)';
      ctx.fillRect(ex - 12, ey - 4, 88, 70);
    }
    ctx.fillStyle = '#003366';
    ctx.fillRect(ex + 10, ey, 44, 44);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(ex + 10, ey, 44, 44);
    ctx.fillStyle = '#005ca8';
    ctx.fillRect(ex + 14, ey + 4, 36, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 31px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('i', ex + 32, ey + 33);

    if (installerSelected) {
      ctx.fillStyle = '#000080';
      ctx.fillRect(ex - 18, ey + 47, 100, 16);
    }
    ctx.fillStyle = installerSelected ? '#ffffff' : '#000000';
    ctx.font = 'bold 10px Tahoma, sans-serif';
    ctx.fillText('netscapeitinstaller.exe', ex + 32, ey + 59);
  }

  // Extraction Dialog (Scene 6)
  if (showExtractWin) {
    const mx = wx + 104;
    const my = wy + 124;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(mx, my, 250, 96);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, 250, 96);
    ctx.fillStyle = '#000080';
    ctx.fillRect(mx + 3, my + 3, 244, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Extracting netscapeit.zip', mx + 10, my + 17);
    ctx.fillStyle = '#000000';
    ctx.fillText(
      `Extracting netscapeitinstaller.exe (${Math.round(extractPct * 100)}%)`,
      mx + 12,
      my + 44
    );
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx + 14, my + 58, 222, 18);
    ctx.strokeStyle = '#808080';
    ctx.strokeRect(mx + 14, my + 58, 222, 18);
    ctx.fillStyle = '#000080';
    ctx.fillRect(mx + 16, my + 60, Math.max(4, extractPct * 218), 14);
  }

  // Scene 7 Popup 1: NETSCAPEIT INSTALLER [YES] [NO]
  if (showInstallerPrompt) {
    const px = 106;
    const py = 104;
    const pw = 300;
    const ph = 152;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = '#000080';
    ctx.fillRect(px + 3, py + 3, pw - 6, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NETSCAPEIT INSTALLER', px + 10, py + 19);

    ctx.fillStyle = '#000000';
    ctx.font = '13px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Would you like to open Netscapeit?', px + pw / 2, py + 72);

    // YES Button
    ctx.fillStyle = yesHover ? '#d4d0c8' : '#c0c0c0';
    ctx.fillRect(px + 58, py + 104, 78, 28);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = yesHover ? 2.5 : 1.5;
    ctx.strokeRect(px + 58, py + 104, 78, 28);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText('YES', px + 97, py + 123);

    // NO Button
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(px + 164, py + 104, 78, 28);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 164, py + 104, 78, 28);
    ctx.fillText('NO', px + 203, py + 123);
  }

  // Scene 7 Popup 2: Installation successful! [OK]
  if (showSuccessPopup) {
    const px = 116;
    const py = 112;
    const pw = 280;
    const ph = 142;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = '#000080';
    ctx.fillRect(px + 3, py + 3, pw - 6, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Installation successful!', px + 10, py + 18);

    ctx.fillStyle = '#000000';
    ctx.font = '13px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Netscapeit successfully installed.', px + pw / 2, py + 70);

    ctx.fillStyle = okHover ? '#d4d0c8' : '#c0c0c0';
    ctx.fillRect(px + 96, py + 100, 88, 28);
    ctx.lineWidth = okHover ? 2.5 : 1.5;
    ctx.strokeRect(px + 96, py + 100, 88, 28);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText('OK', px + 140, py + 119);
  }

  if (clickPulse) {
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ptrX, ptrY, 13, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(ptrX, ptrY);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 20);
  ctx.lineTo(5, 15);
  ctx.lineTo(10, 24);
  ctx.lineTo(13, 22);
  ctx.lineTo(9, 13);
  ctx.lineTo(16, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (showHourglass) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 6, 11, 16);
    ctx.strokeRect(16, 6, 11, 16);
    ctx.fillStyle = '#0066cc';
    ctx.beginPath();
    ctx.moveTo(17, 7);
    ctx.lineTo(26, 7);
    ctx.lineTo(21.5, 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(21.5, 14);
    ctx.lineTo(26, 21);
    ctx.lineTo(17, 21);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
