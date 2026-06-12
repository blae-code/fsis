import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/** Slow-drifting wireframe salvage debris field — desktop background layer */
export default function DebrisField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    const jade = new THREE.LineBasicMaterial({ color: 0x2ebfa5, transparent: true, opacity: 0.16 });
    const jadeDim = new THREE.LineBasicMaterial({ color: 0x2ebfa5, transparent: true, opacity: 0.07 });

    const group = new THREE.Group();
    const geos = [
      new THREE.IcosahedronGeometry(1.6, 0),
      new THREE.BoxGeometry(1.8, 0.9, 1.2),
      new THREE.DodecahedronGeometry(1.1, 0),
      new THREE.OctahedronGeometry(1.3, 0),
      new THREE.TetrahedronGeometry(1.0, 0),
      new THREE.BoxGeometry(0.7, 2.4, 0.7),
    ];
    const debris = [];
    geos.forEach((geo, i) => {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), i % 2 === 0 ? jade : jadeDim);
      const angle = (i / geos.length) * Math.PI * 2;
      edges.position.set(Math.cos(angle) * (5 + i * 0.8), Math.sin(angle) * 3 - 1, -2 - i * 1.2);
      edges.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      debris.push({ mesh: edges, rx: 0.0008 + i * 0.0003, ry: 0.0012 - i * 0.0001, drift: 0.0004 * (i % 2 ? 1 : -1) });
      group.add(edges);
    });

    // Central derelict hull — large stretched wireframe
    const hull = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.2, 1.8, 6, 6, 2)),
      new THREE.LineBasicMaterial({ color: 0x2ebfa5, transparent: true, opacity: 0.1 })
    );
    hull.rotation.z = Math.PI / 3;
    hull.position.set(0, 0.5, -6);
    group.add(hull);

    scene.add(group);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      debris.forEach((d) => {
        d.mesh.rotation.x += d.rx;
        d.mesh.rotation.y += d.ry;
        d.mesh.position.y += d.drift;
        if (d.mesh.position.y > 5) d.mesh.position.y = -5;
        if (d.mesh.position.y < -5) d.mesh.position.y = 5;
      });
      hull.rotation.y += 0.0005;
      group.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
      geos.forEach((g) => g.dispose());
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}