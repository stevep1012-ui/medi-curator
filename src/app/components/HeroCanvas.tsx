"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 3D animated landing hero — floating pills / capsules / round tablets rendered
 * with Three.js, gently drifting and rotating, with cursor parallax on the camera
 * and the hero glow. Transparent renderer so the CSS hero gradient shows through.
 * Respects prefers-reduced-motion (renders a single static frame, no loop).
 *
 * Requires the `three` package:  npm i three @types/three
 */
const ACCENT_HEX = [0x0a7d6e, 0xb5781a, 0x2f9e44, 0xc2452f, 0x5b6ad0, 0x12a08b, 0x0c7567];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const hero = canvas.closest(".hero") as HTMLElement | null;
    const bg = hero?.querySelector(".hero-bg") as HTMLElement | null;
    if (!hero) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 16);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c6c2, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 10, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfeee9, 0.7);
    rim.position.set(-8, -4, 4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    type Pill = THREE.Object3D & {
      userData: { rx: number; ry: number; rz: number; fx: number; fy: number; amp: number; spd: number; baseY: number };
    };
    const pills: Pill[] = [];
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

    const mkMat = (col: number, opts: Record<string, number> = {}) => {
      const m = new THREE.MeshPhysicalMaterial(Object.assign({ color: col, roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.25, transparent: true, opacity: 0.97 }, opts));
      disposables.push(m);
      return m;
    };
    const pushGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.push(g);
      return g;
    };

    // ① telescoping two-tone gelatin capsule
    function makeCapsule() {
      const r = rand(0.4, 0.6);
      const len = rand(1.0, 1.9);
      const g = new THREE.Group();
      const colBody = ACCENT_HEX[(Math.random() * ACCENT_HEX.length) | 0];
      const colCap = Math.random() < 0.45 ? 0xf3f5f4 : ACCENT_HEX[(Math.random() * ACCENT_HEX.length) | 0];
      const matBody = mkMat(colBody), matCap = mkMat(colCap);
      g.add(new THREE.Mesh(pushGeo(new THREE.CapsuleGeometry(r, len, 12, 24)), matBody));
      const rc = r * 1.05, capLen = len * 0.52, tip = len / 2 + r;
      const capCyl = new THREE.Mesh(pushGeo(new THREE.CylinderGeometry(rc, rc, capLen, 24, 1, true)), matCap);
      capCyl.position.y = tip - r - capLen / 2;
      const capDome = new THREE.Mesh(pushGeo(new THREE.SphereGeometry(rc, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)), matCap);
      capDome.position.y = capCyl.position.y + capLen / 2;
      g.add(capCyl, capDome);
      return g;
    }
    // ② biconvex round coated tablet (flattened disc), some with a score line
    function makeTablet() {
      const r = rand(0.55, 0.85);
      const g = new THREE.Group();
      const col = ACCENT_HEX[(Math.random() * ACCENT_HEX.length) | 0];
      const tab = new THREE.Mesh(pushGeo(new THREE.SphereGeometry(r, 30, 22)), mkMat(col, { roughness: 0.34 }));
      const flat = rand(0.4, 0.52); tab.scale.y = flat;
      g.add(tab);
      if (Math.random() < 0.6) {
        const score = new THREE.Mesh(pushGeo(new THREE.BoxGeometry(r * 1.7, 0.05, 0.05)), mkMat(0x0e1a19, { opacity: 0.18, clearcoat: 0 }));
        score.position.y = r * flat;
        g.add(score);
      }
      return g;
    }
    // ③ flattened oblong caplet
    function makeCaplet() {
      const r = rand(0.34, 0.46);
      const len = rand(1.1, 1.8);
      const g = new THREE.Group();
      const col = ACCENT_HEX[(Math.random() * ACCENT_HEX.length) | 0];
      const cap = new THREE.Mesh(pushGeo(new THREE.CapsuleGeometry(r, len, 12, 24)), mkMat(col, { roughness: 0.32 }));
      cap.scale.z = 0.62;
      g.add(cap);
      return g;
    }

    const COUNT = 16;
    for (let i = 0; i < COUNT; i++) {
      const kind = Math.random();
      const m = (kind < 0.5 ? makeCapsule() : kind < 0.8 ? makeTablet() : makeCaplet()) as Pill;
      m.position.set(rand(-11, 11), rand(-6.5, 6.5), rand(-7, 3));
      m.rotation.set(rand(0, 6.28), rand(0, 6.28), rand(0, 6.28));
      m.userData = {
        rx: rand(-0.004, 0.004), ry: rand(-0.006, 0.006), rz: rand(-0.003, 0.003),
        fx: rand(0, 6.28), fy: rand(0, 6.28), amp: rand(0.18, 0.5), spd: rand(0.4, 0.9), baseY: m.position.y,
      };
      m.scale.multiplyScalar(rand(0.75, 1.1));
      group.add(m);
      pills.push(m);
    }

    let W = 0, H = 0, tx = 0, ty = 0, mx = 0, my = 0, raf = 0;
    const t0 = performance.now();

    function resize() {
      const r = hero!.getBoundingClientRect();
      W = r.width; H = r.height;
      if (W === 0 || H === 0) return false;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      return true;
    }
    function render(now: number) {
      const t = (now - t0) / 1000;
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      for (const m of pills) {
        const u = m.userData;
        m.rotation.x += u.rx; m.rotation.y += u.ry; m.rotation.z += u.rz;
        m.position.y = u.baseY + Math.sin(t * u.spd + u.fy) * u.amp;
        m.position.x += Math.sin(t * 0.2 + u.fx) * 0.0012;
      }
      group.rotation.y += (mx * 0.5 - group.rotation.y) * 0.04;
      group.rotation.x += (-my * 0.4 - group.rotation.x) * 0.04;
      camera.position.x += (mx * 2.2 - camera.position.x) * 0.04;
      camera.position.y += (-my * 1.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      if (bg) bg.style.transform = `translate(${mx * 14}px, ${my * 10}px) scale(1.05)`;
      renderer.render(scene, camera);
    }
    function loop(now: number) {
      render(now);
      raf = requestAnimationFrame(loop);
    }
    function onMove(e: PointerEvent) {
      const r = hero!.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) / r.width;
      ty = (e.clientY - (r.top + r.height / 2)) / r.height;
    }
    function onLeave() {
      tx = 0; ty = 0;
    }

    if (resize()) {
      render(performance.now());
      if (!reduce) {
        raf = requestAnimationFrame(loop);
        window.addEventListener("pointermove", onMove, { passive: true });
        hero.addEventListener("pointerleave", onLeave);
      }
    }
    const ro = new ResizeObserver(() => {
      if (resize() && reduce) render(performance.now());
    });
    ro.observe(hero);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />;
}
