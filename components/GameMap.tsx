'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationPanel from './LocationPanel';
import ResidentsPanel from './ResidentsPanel';
import type { LocationData, CharacterData } from '@/lib/content';

const VISITED_KEY = 'blindeye-visited';
const INTRO_KEY = 'blindeye-intro-v2';
const WORLD_SRC = '/art/world-golden.WEBP';
const WORLD_W = 2016;
const WORLD_H = 1152;

/** Marker + obstacle layout for the golden-hour town scene (fractions of world). */
const LOC_POS: Record<string, { x: number; y: number }> = {
  'little-opry': { x: 0.175, y: 0.52 },
  'eyelid-boarding-house': { x: 0.455, y: 0.48 },
  'chix-cafe': { x: 0.68, y: 0.44 },
  'general-store': { x: 0.745, y: 0.57 },
  'old-well': { x: 0.928, y: 0.8 },
  'railroad-crossing': { x: 0.55, y: 0.77 },
};

const OBSTACLES = [
  { x: 0.175, y: 0.53, r: 0.07 }, // red barn
  { x: 0.455, y: 0.52, r: 0.1 }, // boarding house
  { x: 0.68, y: 0.45, r: 0.048 }, // chix cafe
  { x: 0.745, y: 0.58, r: 0.065 }, // fill er up
  { x: 0.855, y: 0.4, r: 0.052 }, // church
  { x: 0.928, y: 0.815, r: 0.038 }, // old well
];

const WALK = { x0: 0.03, x1: 0.97, y0: 0.44, y1: 0.96 };

/** The railroad, as painted: sweeps in from the west, curves through town. */
const TRACK_PTS = [
  { x: -0.02, y: 0.505 },
  { x: 0.1, y: 0.53 },
  { x: 0.22, y: 0.6 },
  { x: 0.36, y: 0.69 },
  { x: 0.52, y: 0.745 },
  { x: 0.7, y: 0.775 },
  { x: 0.88, y: 0.8 },
  { x: 1.04, y: 0.825 },
];

const DISCOVER_R = 130;
const WANDER_SPEED = 210;

interface Pt {
  x: number;
  y: number;
}

function buildPath(pts: Pt[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = cum[cum.length - 1];
  return {
    total,
    at(s: number) {
      const c = Math.max(0, Math.min(total, s));
      let i = 1;
      while (i < cum.length - 1 && cum[i] < c) i++;
      const seg = Math.max(1e-6, cum[i] - cum[i - 1]);
      const t = (c - cum[i - 1]) / seg;
      const a = pts[i - 1];
      const b = pts[i];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        ang: Math.atan2(b.y - a.y, b.x - a.x),
      };
    },
  };
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}

interface GameState {
  wx: number; // wanderer pos (feet)
  wy: number;
  tx: number; // move target
  ty: number;
  moving: boolean;
  facing: 1 | -1;
  phase: number;
  camX: number;
  camY: number;
  zoom: number;
  freeLook: boolean;
  trainOn: boolean;
  trainS: number;
  nextTrain: number;
  smokeT: number;
  motes: Mote[];
  smoke: { x: number; y: number; life: number }[];
  keys: Set<string>;
  time: number;
  seen: Set<string>;
}

function makeGame(): GameState {
  const motes: Mote[] = [];
  for (let i = 0; i < 46; i++) {
    motes.push({
      x: Math.random() * WORLD_W,
      y: WORLD_H * 0.35 + Math.random() * WORLD_H * 0.62,
      vx: 6 + Math.random() * 14,
      vy: -4 - Math.random() * 8,
      r: 1 + Math.random() * 2.4,
      a: 0.12 + Math.random() * 0.22,
    });
  }
  return {
    wx: WORLD_W * 0.45,
    wy: WORLD_H * 0.8,
    tx: WORLD_W * 0.45,
    ty: WORLD_H * 0.8,
    moving: false,
    facing: 1,
    phase: 0,
    camX: WORLD_W * 0.45,
    camY: WORLD_H * 0.72,
    zoom: 1.45,
    freeLook: false,
    trainOn: false,
    trainS: 0,
    nextTrain: 16 + Math.random() * 22,
    smokeT: 0,
    motes,
    smoke: [],
    keys: new Set(),
    time: 0,
    seen: new Set(),
  };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* ---------- drawing ---------- */

function drawWanderer(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1, phase: number, moving: boolean) {
  const bob = moving ? Math.abs(Math.sin(phase)) * 3.2 : Math.sin(phase * 0.4) * 1.2;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(facing, 1);

  // shadow
  ctx.fillStyle = 'rgba(20,12,6,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2 + bob, 17, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = moving ? Math.sin(phase) * 6 : 0;
  // legs
  ctx.fillStyle = '#3a2b20';
  ctx.fillRect(-8, -20 + Math.max(0, legSwing * 0.4), 6, 20 - Math.max(0, legSwing * 0.4));
  ctx.fillRect(2, -20 + Math.max(0, -legSwing * 0.4), 6, 20 - Math.max(0, -legSwing * 0.4));
  // boots
  ctx.fillStyle = '#241a12';
  ctx.fillRect(-9, -4 + Math.max(0, legSwing * 0.4), 8, 5);
  ctx.fillRect(1, -4 + Math.max(0, -legSwing * 0.4), 8, 5);

  // cloak / body
  ctx.fillStyle = '#4d3d63';
  ctx.beginPath();
  ctx.moveTo(-14, -18);
  ctx.quadraticCurveTo(-15, -44, -9, -52);
  ctx.lineTo(9, -52);
  ctx.quadraticCurveTo(15, -44, 14, -18);
  ctx.quadraticCurveTo(0, -12, -14, -18);
  ctx.fill();
  // cloak shading
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.moveTo(2, -52);
  ctx.quadraticCurveTo(12, -44, 12, -20);
  ctx.lineTo(4, -22);
  ctx.quadraticCurveTo(6, -40, 2, -52);
  ctx.fill();
  // satchel
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(8, -38, 8, 10);
  ctx.strokeStyle = '#4a351d';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, -38, 8, 10);

  // head
  ctx.fillStyle = '#e9b98c';
  ctx.beginPath();
  ctx.arc(1, -60, 9.5, 0, Math.PI * 2);
  ctx.fill();
  // nose hint in facing direction
  ctx.fillStyle = '#d8a271';
  ctx.beginPath();
  ctx.arc(9, -59, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // wide-brim hat
  ctx.fillStyle = '#2e2318';
  ctx.beginPath();
  ctx.ellipse(1, -67, 17, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1, -67, 8, Math.PI, 0);
  ctx.quadraticCurveTo(1, -78, 9, -67);
  ctx.fill();
  // hat band
  ctx.fillStyle = '#a33327';
  ctx.fillRect(-7, -70.5, 16, 3);

  ctx.restore();
}

function drawTrainCar(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, kind: 'engine' | 'car', scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(scale, scale);
  if (kind === 'engine') {
    // shadow
    ctx.fillStyle = 'rgba(20,12,6,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 52, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = '#243320';
    ctx.beginPath();
    ctx.roundRect(-52, -16, 76, 26, 5);
    ctx.fill();
    // cab
    ctx.fillStyle = '#1b2718';
    ctx.beginPath();
    ctx.roundRect(-52, -34, 26, 22, 4);
    ctx.fill();
    // cab window (warm)
    ctx.fillStyle = '#f2b04a';
    ctx.fillRect(-46, -30, 14, 10);
    // chimney
    ctx.fillStyle = '#141a12';
    ctx.fillRect(12, -30, 8, 16);
    ctx.fillStyle = '#c9973f';
    ctx.fillRect(10, -33, 12, 4);
    // boiler bands
    ctx.fillStyle = '#c9973f';
    ctx.fillRect(-14, -16, 3, 26);
    ctx.fillRect(2, -16, 3, 26);
    // cowcatcher
    ctx.fillStyle = '#3a2c1c';
    ctx.beginPath();
    ctx.moveTo(24, -14);
    ctx.lineTo(40, 10);
    ctx.lineTo(24, 10);
    ctx.closePath();
    ctx.fill();
    // wheels
    ctx.fillStyle = '#101010';
    for (const wx of [-38, -18, 6, 20]) {
      ctx.beginPath();
      ctx.arc(wx, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9973f';
      ctx.beginPath();
      ctx.arc(wx, 12, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#101010';
    }
  } else {
    ctx.fillStyle = 'rgba(20,12,6,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 13, 38, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d3d24';
    ctx.beginPath();
    ctx.roundRect(-36, -14, 72, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#4a2f1b';
    for (let i = -30; i <= 30; i += 12) ctx.fillRect(i, -14, 3, 24);
    ctx.fillStyle = '#101010';
    for (const wx of [-24, 24]) {
      ctx.beginPath();
      ctx.arc(wx, 12, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  discovered: boolean,
  near: boolean,
  time: number,
) {
  const pulse = 1 + Math.sin(time * 3.2) * 0.18;
  const glow = discovered || near;
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,180,80,0.9)';
    ctx.shadowBlur = 18 * pulse;
  }
  ctx.fillStyle = glow ? '#ffbe5a' : 'rgba(255,190,90,0.45)';
  ctx.beginPath();
  ctx.arc(x, y, (glow ? 6 : 4) * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (discovered || near) {
    ctx.save();
    ctx.font = '600 15px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(label.toUpperCase()).width;
    const ly = y - 22;
    ctx.fillStyle = 'rgba(10,8,4,0.55)';
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 10, ly - 15, tw + 20, 24, 12);
    ctx.fill();
    ctx.fillStyle = discovered ? '#ffe9c4' : 'rgba(255,233,196,0.75)';
    ctx.fillText(label.toUpperCase(), x, ly + 2);
    ctx.restore();
  }
}

/* ---------- the game ---------- */

export default function GameMap({
  locations,
  characters,
}: {
  locations: LocationData[];
  characters: CharacterData[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const pathRef = useRef<ReturnType<typeof buildPath> | null>(null);
  const [selected, setSelected] = useState<LocationData | null>(null);
  const [showResidents, setShowResidents] = useState(false);
  const [intro, setIntro] = useState(true);
  const [visited, setVisited] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const uiRef = useRef({
    openLocation: (loc: LocationData) => {},
    discover: (slug: string, name: string) => {},
    zoomBy: (f: number) => {},
    recenter: () => {},
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = makeGame();
    gameRef.current = g;
    pathRef.current = buildPath(TRACK_PTS.map((p) => ({ x: p.x * WORLD_W, y: p.y * WORLD_H })));
    try {
      const v: string[] = JSON.parse(localStorage.getItem(VISITED_KEY) || '[]');
      setVisited(v);
      g.seen = new Set(v);
      if (localStorage.getItem(INTRO_KEY)) setIntro(false);
    } catch {
      /* ignore */
    }

    const img = new Image();
    img.src = WORLD_SRC;
    let imgOk = false;
    img.onload = () => {
      imgOk = true;
      setReady(true);
    };

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const baseScale = () => cssH / WORLD_H;
    const scaleNow = () => baseScale() * g.zoom;
    const viewOf = () => {
      const s = scaleNow();
      return {
        s,
        ox: cssW / 2 - g.camX * s,
        oy: cssH / 2 - g.camY * s,
      };
    };
    const toWorld = (sx: number, sy: number) => {
      const { s, ox, oy } = viewOf();
      return { x: (sx - ox) / s, y: (sy - oy) / s };
    };
    const clampCam = () => {
      const s = scaleNow();
      const vw = cssW / s;
      const vh = cssH / s;
      const m = 40;
      g.camX = vw >= WORLD_W + m * 2 ? WORLD_W / 2 : clamp(g.camX, vw / 2 - m, WORLD_W - vw / 2 + m);
      g.camY = vh >= WORLD_H + m * 2 ? WORLD_H / 2 : clamp(g.camY, vh / 2 - m, WORLD_H - vh / 2 + m);
    };

    const pushOutOfObstacles = (p: { x: number; y: number }, rad: number) => {
      for (const o of OBSTACLES) {
        const ox = o.x * WORLD_W;
        const oy = o.y * WORLD_H;
        const orad = o.r * WORLD_W;
        const dx = p.x - ox;
        const dy = p.y - oy;
        const d = Math.hypot(dx, dy);
        const min = orad + rad;
        if (d < min && d > 1e-4) {
          p.x = ox + (dx / d) * min;
          p.y = oy + (dy / d) * min;
        }
      }
      p.x = clamp(p.x, WALK.x0 * WORLD_W, WALK.x1 * WORLD_W);
      p.y = clamp(p.y, WALK.y0 * WORLD_H, WALK.y1 * WORLD_H);
    };

    /* ----- input ----- */
    const pointers = new Map<number, { x: number; y: number; sx: number; sy: number; t: number }>();
    let pinchD0 = 0;
    let pinchZoom0 = 1;
    let dragged = false;

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const r = canvas.getBoundingClientRect();
      pointers.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top, sx: e.clientX - r.left, sy: e.clientY - r.top, t: performance.now() });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
        pinchZoom0 = g.zoom;
        dragged = true;
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const r = canvas.getBoundingClientRect();
      const nx = e.clientX - r.left;
      const ny = e.clientY - r.top;
      const mdx = nx - p.x;
      const mdy = ny - p.y;
      p.x = nx;
      p.y = ny;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD0 > 0) {
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const before = toWorld(mid.x, mid.y);
          g.zoom = clamp(pinchZoom0 * (d / pinchD0), 0.9, 2.8);
          const after = toWorld(mid.x, mid.y);
          g.camX += before.x - after.x;
          g.camY += before.y - after.y;
          g.freeLook = true;
          clampCam();
        }
        return;
      }
      if (Math.hypot(p.x - p.sx, p.y - p.sy) > 9) {
        dragged = true;
        // drag pans the camera
        const { s } = viewOf();
        g.camX -= mdx / s;
        g.camY -= mdy / s;
        g.freeLook = true;
        clampCam();
      }
    };
    const onUp = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (!p) return;
      const quick = performance.now() - p.t < 600;
      if (!dragged && quick && pointers.size === 0) {
        // tap: location first, else walk there
        const w = toWorld(p.x, p.y);
        const { s } = viewOf();
        let hit: LocationData | null = null;
        for (const loc of locations) {
          const lp = LOC_POS[loc.slug];
          if (!lp) continue;
          const lx = lp.x * WORLD_W;
          const ly = lp.y * WORLD_H;
          const dScreen = Math.hypot(w.x - lx, w.y - ly) * s;
          if (dScreen < 52) {
            hit = loc;
            break;
          }
        }
        if (hit) {
          uiRef.current.openLocation(hit);
        } else {
          const t = { x: w.x, y: w.y };
          pushOutOfObstacles(t, 16);
          g.tx = t.x;
          g.ty = t.y;
          g.moving = true;
          g.freeLook = false;
        }
      }
      if (pointers.size === 0) dragged = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const before = toWorld(mx, my);
      g.zoom = clamp(g.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.9, 2.8);
      const after = toWorld(mx, my);
      g.camX += before.x - after.x;
      g.camY += before.y - after.y;
      g.freeLook = true;
      clampCam();
    };

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) return;
      if (down) {
        g.keys.add(k);
        g.freeLook = false;
      } else {
        g.keys.delete(k);
      }
      if (down) e.preventDefault();
    };
    const kd = onKey(true);
    const ku = onKey(false);

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    /* ----- ui bridge ----- */
    uiRef.current.openLocation = (loc: LocationData) => {
      setSelected(loc);
      setVisited((v) => {
        if (v.includes(loc.slug)) return v;
        const nv = [...v, loc.slug];
        try {
          localStorage.setItem(VISITED_KEY, JSON.stringify(nv));
        } catch {
          /* ignore */
        }
        return nv;
      });
      g.seen.add(loc.slug);
    };
    uiRef.current.discover = (slug: string, name: string) => {
      if (g.seen.has(slug)) return;
      g.seen.add(slug);
      setVisited((v) => {
        if (v.includes(slug)) return v;
        const nv = [...v, slug];
        try {
          localStorage.setItem(VISITED_KEY, JSON.stringify(nv));
        } catch {
          /* ignore */
        }
        return nv;
      });
      setToast(`Discovered — ${name}`);
      window.setTimeout(() => setToast(null), 2600);
    };
    uiRef.current.zoomBy = (f: number) => {
      g.zoom = clamp(g.zoom * f, 0.9, 2.8);
      g.freeLook = true;
      clampCam();
    };
    uiRef.current.recenter = () => {
      g.freeLook = false;
    };

    /* ----- simulation ----- */
    const update = (dt: number) => {
      g.time += dt;

      // keyboard movement
      const k = g.keys;
      const ax = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
      const ay = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
      if (ax !== 0 || ay !== 0) {
        g.moving = false;
        const len = Math.hypot(ax, ay) || 1;
        const p = { x: g.wx + (ax / len) * WANDER_SPEED * dt, y: g.wy + (ay / len) * WANDER_SPEED * dt };
        pushOutOfObstacles(p, 16);
        g.wx = p.x;
        g.wy = p.y;
        g.phase += dt * 11;
        if (ax !== 0) g.facing = ax > 0 ? 1 : -1;
        g.freeLook = false;
      } else if (g.moving) {
        const dx = g.tx - g.wx;
        const dy = g.ty - g.wy;
        const d = Math.hypot(dx, dy);
        if (d < 7) {
          g.moving = false;
        } else {
          const step = Math.min(d, WANDER_SPEED * dt);
          const p = { x: g.wx + (dx / d) * step, y: g.wy + (dy / d) * step };
          pushOutOfObstacles(p, 16);
          g.wx = p.x;
          g.wy = p.y;
          g.phase += dt * 11;
          if (Math.abs(dx) > 2) g.facing = dx > 0 ? 1 : -1;
        }
      } else {
        g.phase += dt * 2;
      }

      // camera follow
      if (!g.freeLook) {
        const t = Math.min(1, dt * 3.6);
        g.camX += (g.wx - g.camX) * t;
        g.camY += (g.wy - 40 - g.camY) * t;
      }
      clampCam();

      // discovery by proximity
      for (const loc of locations) {
        const lp = LOC_POS[loc.slug];
        if (!lp || g.seen.has(loc.slug)) continue;
        const d = Math.hypot(g.wx - lp.x * WORLD_W, g.wy - lp.y * WORLD_H);
        if (d < DISCOVER_R) uiRef.current.discover(loc.slug, loc.name);
      }

      // train schedule — unlisted, as it should be
      const path = pathRef.current;
      if (path) {
        if (!g.trainOn) {
          g.nextTrain -= dt;
          if (g.nextTrain <= 0) {
            g.trainOn = true;
            g.trainS = -260;
          }
        } else {
          g.trainS += 150 * dt;
          g.smokeT -= dt;
          if (g.smokeT <= 0) {
            const head = path.at(g.trainS + 52);
            g.smoke.push({ x: head.x + 12, y: head.y - 30, life: 1 });
            g.smokeT = 0.14;
          }
          if (g.trainS > path.total + 320) {
            g.trainOn = false;
            g.nextTrain = 55 + Math.random() * 50;
          }
        }
      }
      for (const s of g.smoke) s.life -= dt * 0.7;
      g.smoke = g.smoke.filter((s) => s.life > 0);

      // dust motes drift east on a warm breeze
      for (const m of g.motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.x > WORLD_W + 10) m.x = -10;
        if (m.y < WORLD_H * 0.3) m.y = WORLD_H * 0.97;
      }
    };

    /* ----- render ----- */
    const render = () => {
      const { s, ox, oy } = viewOf();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // sky-warm backdrop for overscroll
      const grad = ctx.createLinearGradient(0, 0, 0, cssH);
      grad.addColorStop(0, '#2b1f14');
      grad.addColorStop(1, '#17100a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(s, s);

      if (imgOk) ctx.drawImage(img, 0, 0, WORLD_W, WORLD_H);
      else {
        ctx.fillStyle = '#3a2c1c';
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      }

      // golden dust
      for (const m of g.motes) {
        ctx.globalAlpha = m.a * (0.7 + 0.3 * Math.sin(g.time * 2 + m.x));
        ctx.fillStyle = '#ffd98a';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // location markers
      for (const loc of locations) {
        const lp = LOC_POS[loc.slug];
        if (!lp) continue;
        const lx = lp.x * WORLD_W;
        const ly = lp.y * WORLD_H;
        // cull offscreen
        const sx = lx * s + ox;
        const sy = ly * s + oy;
        if (sx < -80 || sx > cssW + 80 || sy < -80 || sy > cssH + 80) continue;
        const discovered = g.seen.has(loc.slug);
        const near = Math.hypot(g.wx - lx, g.wy - ly) < 320;
        drawMarker(ctx, lx, ly, loc.name, discovered, near, g.time);
      }

      // train (sorted with wanderer by depth)
      const path = pathRef.current;
      const drawables: { y: number; fn: () => void }[] = [];
      if (g.trainOn && path) {
        const cars = [
          { off: 0, kind: 'engine' as const },
          { off: -108, kind: 'car' as const },
          { off: -196, kind: 'car' as const },
        ];
        let trainY = 0;
        const fns = cars.map((c) => {
          const p = path.at(g.trainS + c.off);
          trainY = Math.max(trainY, p.y);
          return () => drawTrainCar(ctx, p.x, p.y, p.ang, c.kind, 1);
        });
        drawables.push({ y: trainY, fn: () => fns.forEach((f) => f()) });
        // smoke
        drawables.push({
          y: trainY - 60,
          fn: () => {
            for (const p of g.smoke) {
              ctx.globalAlpha = Math.max(0, p.life) * 0.4;
              ctx.fillStyle = '#e8ddc8';
              ctx.beginPath();
              ctx.arc(p.x, p.y - (1 - p.life) * 46, 7 + (1 - p.life) * 16, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          },
        });
      }
      drawables.push({
        y: g.wy,
        fn: () => drawWanderer(ctx, g.wx, g.wy, g.facing, g.phase, g.moving || g.keys.size > 0),
      });
      drawables.sort((a, b) => a.y - b.y).forEach((d) => d.fn());

      ctx.restore();
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissIntro = () => {
    setIntro(false);
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={wrapRef} className="relative h-dvh w-full overflow-hidden bg-[#17100a] text-[#f2e8d5]">
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="animate-pulse font-display text-xl text-amber-100/70">Waking up Blind Eye…</p>
        </div>
      )}

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(20,10,4,0.5) 100%)' }}
      />

      {/* header */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-5">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-amber-50 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Blind Eye Land
          </h1>
          <p className="mt-0.5 text-xs text-white/60 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
            Discovered {visited.length} of {locations.length} corners
          </p>
        </div>
        <button
          onClick={() => setShowResidents(true)}
          className="rounded-full border border-amber-100/30 bg-black/40 px-4 py-2 text-sm text-amber-50 backdrop-blur-sm transition-colors hover:bg-amber-100/15"
        >
          Residents
        </button>
      </header>

      {/* zoom + recenter */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
        <button
          aria-label="Zoom in"
          onClick={() => uiRef.current.zoomBy(1.25)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-100/30 bg-black/45 text-xl text-amber-50 backdrop-blur-sm"
        >
          +
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => uiRef.current.zoomBy(1 / 1.25)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-100/30 bg-black/45 text-xl text-amber-50 backdrop-blur-sm"
        >
          −
        </button>
        <button
          aria-label="Back to wanderer"
          onClick={() => uiRef.current.recenter()}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-100/30 bg-black/45 text-amber-50 backdrop-blur-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="9" r="5.5" />
            <circle cx="9" cy="9" r="1.4" fill="currentColor" />
            <path d="M9 0v3.5M9 14.5V18M0 9h3.5M14.5 9H18" />
          </svg>
        </button>
      </div>

      {/* discovery toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-amber-200/40 bg-black/60 px-5 py-2 text-sm text-amber-100 backdrop-blur-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <LocationPanel location={selected} onClose={() => setSelected(null)} />
      <ResidentsPanel open={showResidents} characters={characters} onClose={() => setShowResidents(false)} />

      {/* intro */}
      <AnimatePresence>
        {intro && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#17100a]/85 p-6 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="max-w-md text-center">
              <h2 className="font-display text-5xl leading-tight text-amber-50">Blind Eye Land</h2>
              <p className="mt-4 text-lg italic leading-relaxed text-white/75">
                You&apos;ve arrived in Blind Eye.
                <br />
                Nobody remembers getting here.
              </p>
              <p className="mt-4 text-sm text-white/50">
                Tap anywhere to walk there. Walk up to the glowing marks to discover them. The train keeps its own schedule.
              </p>
              <button
                onClick={dismissIntro}
                className="mt-8 rounded-full border border-amber-100/40 px-8 py-3 text-sm uppercase tracking-[0.2em] text-amber-50 transition-colors hover:bg-amber-100/15"
              >
                Wander in
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
