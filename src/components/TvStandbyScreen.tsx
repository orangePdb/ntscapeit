import React, { useEffect, useRef } from 'react';

export const TvStandbyScreen: React.FC = () => {
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 240;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const buf = new Uint32Array(imageData.data.buffer);

    const drawStaticFrame = () => {
      for (let i = 0; i < buf.length; i++) {
        const lum = Math.random() > 0.5 ? 210 : 18;
        const alpha = Math.floor(Math.random() * 48);
        buf[i] = (alpha << 24) | (lum << 16) | (lum << 8) | lum;
      }
      // Subtle horizontal analog tracking line
      const lineY = Math.floor(Math.random() * height);
      const rowStart = lineY * width;
      for (let x = 0; x < width; x++) {
        buf[rowStart + x] = (90 << 24) | (235 << 16) | (235 << 8) | 235;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    drawStaticFrame();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(drawStaticFrame, 65);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label="Technical Difficulties. Please Stand By."
      className="fixed inset-0 h-screen w-screen bg-[#060607] overflow-hidden select-none cursor-default flex flex-col crt-flicker"
    >
      {/* NTSC 75% SMPTE Color Bars with slight composite chroma softness */}
      <div className="flex-1 flex flex-col w-full h-full blur-[0.7px] scale-[1.01]">
        {/* Top 67% Primary Color Bars (75% IRE Broadcast Levels) */}
        <div className="flex-[67] grid grid-cols-7 w-full">
          <div className="bg-[#b4b4b4]" />
          <div className="bg-[#b4b400]" />
          <div className="bg-[#00b4b4]" />
          <div className="bg-[#00b400]" />
          <div className="bg-[#b400b4]" />
          <div className="bg-[#b40000]" />
          <div className="bg-[#0000b4]" />
        </div>

        {/* Middle 8% Castellation / Reverse Blue Bars */}
        <div className="flex-[8] grid grid-cols-7 w-full">
          <div className="bg-[#0000b4]" />
          <div className="bg-[#121212]" />
          <div className="bg-[#b400b4]" />
          <div className="bg-[#121212]" />
          <div className="bg-[#00b4b4]" />
          <div className="bg-[#121212]" />
          <div className="bg-[#b4b4b4]" />
        </div>

        {/* Bottom 25% PLUGE & Luminance Blocks */}
        <div className="flex-[25] flex w-full">
          <div className="flex-[5] grid grid-cols-4">
            <div className="bg-[#00214c]" />
            <div className="bg-[#e6e6e6]" />
            <div className="bg-[#32006a]" />
            <div className="bg-[#121212]" />
          </div>
          <div className="flex-[1] grid grid-cols-3">
            <div className="bg-[#080808]" />
            <div className="bg-[#121212]" />
            <div className="bg-[#1e1e1e]" />
          </div>
          <div className="flex-[1] bg-[#121212]" />
        </div>
      </div>

      {/* Live Analog RF Static Grain Overlay */}
      <canvas
        ref={staticCanvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
      />

      {/* Classic 1990s Broadcast Chyron Matte Band — zero interactive exits */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full bg-[#0a0a0c]/95 border-t-[3px] border-b-[3px] border-[#d2d2cc] py-7 sm:py-10 px-6 text-center">
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.06em] text-[#efefea] uppercase leading-tight [text-shadow:3px_3px_0_#000000]"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            TECHNICAL DIFFICULTIES
          </h1>
          <p
            className="mt-2 sm:mt-3 text-xl sm:text-3xl md:text-4xl font-bold tracking-[0.14em] text-[#d4d4ce] uppercase [text-shadow:2px_2px_0_#000000]"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            PLEASE STAND BY
          </p>
        </div>
      </div>

      {/* Classic 90s CRT TV OSD Channel Indicator */}
      <div
        aria-hidden="true"
        className="absolute top-5 right-7 pointer-events-none font-mono-retro text-base sm:text-xl font-bold tracking-[0.12em] text-[#48d84c] [text-shadow:2px_2px_0_#000000]"
      >
        CH 03
      </div>

      {/* CRT Scanline, Shadow Mask & Tube Overscan Vignette */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />
      <div className="absolute inset-0 crt-vignette pointer-events-none" />
    </div>
  );
};
