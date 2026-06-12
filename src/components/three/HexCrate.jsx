import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/** Small rotating wireframe FSIS hex cargo crate */
export default function HexCrate({ size = 180 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 1.6, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();

    const hexGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.6, 6, 1);
    const outer = new THREE.LineSegments(
      new THREE.EdgesGeometry(hexGeo),
      new THREE.LineBasicMaterial({ color: 0x2ebfa5, transparent: true, opacity: 0.85 })
    );
    group.add(outer);

    const innerGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.1, 6, 1);
    const inner = new THREE.LineSegments(
      new THREE.EdgesGeometry(innerGeo),
      new THREE.LineBasicMaterial({ color: 0x3de0c2, transparent: true, opacity: 0.4 })
    );
    group.add(inner);

    scene.add(group);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      inner.rotation.y -= 0.014;
      group.position.y = Math.sin(Date.now() * 0.0012) * 0.12;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      mount.removeChild(renderer.domElement);
      hexGeo.dispose();
      innerGeo.dispose();
      renderer.dispose();
    };
  }, [size]);

  return <div ref={mountRef} style={{ width: size, height: size }} className="pointer-events-none" />;
}