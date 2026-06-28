import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CargoBayPreview3D({ crates = [], capacity = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    const mount = ref.current; if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.8, 0.1, 1000); camera.position.set(9, 8, 12); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(mount.clientWidth || 520, 280); mount.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xdeb15a, 1.6));
    const grid = new THREE.GridHelper(12, 12, 0x8a6430, 0x3a2f20); scene.add(grid);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(12, .08, 6), new THREE.MeshBasicMaterial({ color: 0x5c4424, wireframe: true })); frame.position.y = .04; scene.add(frame);
    crates.slice(0, 18).forEach((c, i) => { const size = Math.max(.5, Math.min(2.2, Math.sqrt((c.scu_used || 1) / Math.max(capacity, 1)) * 8)); const box = new THREE.Mesh(new THREE.BoxGeometry(size, size * .7, size), new THREE.MeshStandardMaterial({ color: c.risk_level === 'high' ? 0xc0502d : c.risk_level === 'low' ? 0x8a8f45 : 0xe0a22e })); box.position.set(-5 + (i % 6) * 2, size * .35, -2 + Math.floor(i / 6) * 2); scene.add(box); });
    let raf; const animate = () => { raf = requestAnimationFrame(animate); scene.rotation.y += 0.003; renderer.render(scene, camera); }; animate();
    return () => { cancelAnimationFrame(raf); renderer.dispose(); mount.innerHTML = ''; };
  }, [crates, capacity]);
  return <div className="border p-3" style={{ borderColor: '#3A2F20', background: '#070503' }}><p className="font-mono text-[10px] tracking-[0.2em] mb-2" style={{ color: '#8A8F45' }}>THREE.JS CARGO BAY PREVIEW</p><div ref={ref} className="w-full h-[280px]" /></div>;
}