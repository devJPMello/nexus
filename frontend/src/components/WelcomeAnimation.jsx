import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import anime from 'animejs';
import './WelcomeAnimation.css';

const WelcomeAnimation = ({ onComplete, userName = 'Usuário' }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const containerRef = useRef(null);
  const [showText, setShowText] = useState(false);
  const [startTransition, setStartTransition] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    try {
      // Configuração do Three.js
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      // Câmera começa mais abaixo e vai subir, focando no centro
      camera.position.set(0, -3, 6);

      // Target para a câmera sempre olhar (objeto central)
      const cameraTarget = new THREE.Vector3(0, 0, 0);
      camera.lookAt(cameraTarget);

      const isMobile = window.innerWidth < 768;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      // Criar estrutura similar ao Hyperledger (nós conectados em rede)
      const nodes = [];
      const connections = [];

      // Geometria dos nós (esferas pequenas)
      const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);

      // Cores do tema - mais vibrantes e intensas
      const colors = [
        0x00d4ff, // Cyan brilhante
        0x8b5cf6, // Roxo vibrante
        0xec4899, // Rosa/magenta
        0x3b82f6, // Azul elétrico
        0x06b6d4, // Cyan
      ];

      // Criar nós em posições formando uma rede distribuída
      const nodePositions = [
        { x: 0, y: 0, z: 0 },      // Centro
        { x: -2, y: 1.5, z: -1 },  // Superior esquerda
        { x: 2, y: 1.5, z: -1 },   // Superior direita
        { x: -2, y: -1.5, z: -1 }, // Inferior esquerda
        { x: 2, y: -1.5, z: -1 },  // Inferior direita
        { x: 0, y: 2, z: 0.5 },    // Topo
        { x: 0, y: -2, z: 0.5 },   // Base
      ];

      nodePositions.forEach((pos, index) => {
        const color = colors[index % colors.length];
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0,
        });
        const node = new THREE.Mesh(nodeGeometry, material);
        node.position.set(pos.x, pos.y, pos.z);
        scene.add(node);
        nodes.push({ mesh: node, material });

        // Adicionar glow ao redor do nó (maior e mais intenso)
        const glowGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(node.position);
        scene.add(glow);
        nodes.push({ mesh: glow, material: glowMaterial, isGlow: true });
      });

      // Criar conexões entre nós (linhas)
      const connectionPairs = [
        [0, 1], [0, 2], [0, 3], [0, 4], // Centro para cantos
        [0, 5], [0, 6],                 // Centro para topo/base
        [1, 5], [2, 5],                 // Superiores para topo
        [3, 6], [4, 6],                 // Inferiores para base
        [1, 3], [2, 4],                 // Lados
      ];

      connectionPairs.forEach(([startIdx, endIdx]) => {
        const start = nodePositions[startIdx];
        const end = nodePositions[endIdx];

        const points = [
          new THREE.Vector3(start.x, start.y, start.z),
          new THREE.Vector3(end.x, end.y, end.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0x00d4ff, // Cyan mais brilhante
          transparent: true,
          opacity: 0,
        });

        const line = new THREE.Line(geometry, material);
        scene.add(line);
        connections.push({ line, material });
      });

      // Partículas de fundo (reduzidas)
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = isMobile ? 200 : 400;
      const posArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 20;
        posArray[i + 1] = (Math.random() - 0.5) * 20;
        posArray[i + 2] = (Math.random() - 0.5) * 10;
      }

      particlesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(posArray, 3)
      );

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.06,
        color: 0x00d4ff, // Cyan brilhante
        transparent: true,
        opacity: 0,
      });

      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      // Criar raios de luz nas bordas
      const lightRays = [];
      const rayCount = 8;

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const distance = 10;

        // Geometria do raio (cone alongado)
        const rayGeometry = new THREE.ConeGeometry(0.05, 12, 4);
        const rayMaterial = new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? 0x00d4ff : (i % 3 === 1 ? 0x8b5cf6 : 0xec4899),
          transparent: true,
          opacity: 0,
        });

        const ray = new THREE.Mesh(rayGeometry, rayMaterial);

        // Posicionar raios nas bordas, apontando para o centro
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        ray.position.set(x, 0, z);
        ray.lookAt(0, 0, 0);
        ray.rotation.x = Math.PI / 2;

        scene.add(ray);
        lightRays.push({ mesh: ray, material: rayMaterial, angle });
      }

      // Criar plano de fundo com textura de ruído (Perlin noise simulation)
      const backgroundGeometry = new THREE.PlaneGeometry(30, 30, 32, 32);
      const positions = backgroundGeometry.attributes.position;

      // Adicionar ruído às posições do plano para criar profundidade
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);

        // Simular ruído Perlin com funções trigonométricas
        const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5 +
                     Math.sin(x * 0.3 + y * 0.3) * 0.3;

        positions.setZ(i, noise - 5);
      }

      const backgroundMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0,
        wireframe: true,
      });

      const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
      backgroundMesh.position.z = -8;
      scene.add(backgroundMesh);

      // Criar anéis decorativos nas bordas
      const rings = [];
      const ringCount = 3;

      for (let i = 0; i < ringCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(
          8 + i * 2,
          0.03,
          8,
          32
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: i === 0 ? 0x00d4ff : (i === 1 ? 0x8b5cf6 : 0xec4899),
          transparent: true,
          opacity: 0,
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.z = -3 - i;
        scene.add(ring);
        rings.push({ mesh: ring, material: ringMaterial });
      }

      // Animação de renderização a 60 FPS
      let lastTime = performance.now();
      const targetFPS = 60;
      const frameTime = 1000 / targetFPS;

      const animate = (currentTime) => {
        if (!mounted) return;
        animationFrameRef.current = requestAnimationFrame(animate);

        const deltaTime = currentTime - lastTime;

        if (deltaTime >= frameTime) {
          lastTime = currentTime - (deltaTime % frameTime);

          // Manter câmera sempre focada no centro
          camera.lookAt(cameraTarget);

          renderer.render(scene, camera);
        }
      };
      animate(performance.now());

      // Animação da câmera subindo suavemente
      anime({
        targets: camera.position,
        y: [camera.position.y, 0],
        duration: 3000,
        easing: 'easeOutQuad',
      });

      // Animação dos nós aparecendo (mais intensos)
      nodes.forEach((node, index) => {
        anime({
          targets: node.material,
          opacity: node.isGlow ? [0, 0.5] : [0, 1],
          duration: 800,
          delay: 300 + (index * 80),
          easing: 'easeOutQuad',
        });
      });

      // Animação das conexões aparecendo (mais visíveis)
      connections.forEach((conn, index) => {
        anime({
          targets: conn.material,
          opacity: [0, 0.6],
          duration: 800,
          delay: 500 + (index * 50),
          easing: 'easeOutQuad',
        });
      });

      // Animação das partículas de fundo (mais intensas)
      anime({
        targets: particlesMaterial,
        opacity: [0, 0.5],
        duration: 1500,
        easing: 'easeOutQuad',
      });

      // Animação dos raios de luz (mais visíveis)
      lightRays.forEach((ray, index) => {
        anime({
          targets: ray.material,
          opacity: [0, 0.25],
          duration: 1200,
          delay: 400 + (index * 100),
          easing: 'easeOutQuad',
        });
      });

      // Animação do background com ruído (mais visível)
      anime({
        targets: backgroundMaterial,
        opacity: [0, 0.12],
        duration: 2000,
        easing: 'easeOutQuad',
      });

      // Animação dos anéis decorativos (mais visíveis)
      rings.forEach((ring, index) => {
        anime({
          targets: ring.material,
          opacity: [0, 0.15 - (index * 0.03)],
          duration: 1500,
          delay: 600 + (index * 200),
          easing: 'easeOutQuad',
        });

        // Rotação suave dos anéis
        anime({
          targets: ring.mesh.rotation,
          z: [0, Math.PI * 2],
          duration: 8000 + (index * 2000),
          easing: 'linear',
          loop: false,
        });
      });

      // Mostrar texto
      setTimeout(() => {
        if (mounted) setShowText(true);
      }, 600);

      // Animação de saída
      setTimeout(() => {
        if (!mounted) return;

        // Fade out de tudo
        nodes.forEach((node) => {
          anime({
            targets: node.material,
            opacity: 0,
            duration: 600,
            easing: 'easeInQuad',
          });
        });

        connections.forEach((conn) => {
          anime({
            targets: conn.material,
            opacity: 0,
            duration: 600,
            easing: 'easeInQuad',
          });
        });

        anime({
          targets: particlesMaterial,
          opacity: 0,
          duration: 600,
          easing: 'easeInQuad',
        });

        // Fade out dos raios de luz
        lightRays.forEach((ray) => {
          anime({
            targets: ray.material,
            opacity: 0,
            duration: 600,
            easing: 'easeInQuad',
          });
        });

        // Fade out do background
        anime({
          targets: backgroundMaterial,
          opacity: 0,
          duration: 600,
          easing: 'easeInQuad',
        });

        // Fade out dos anéis
        rings.forEach((ring) => {
          anime({
            targets: ring.material,
            opacity: 0,
            duration: 600,
            easing: 'easeInQuad',
          });
        });
      }, 3000);

      // Iniciar transição de saída
      const transitionTimeout = setTimeout(() => {
        if (mounted) setStartTransition(true);
      }, 3200);

      // Completar animação após transição
      const completeTimeout = setTimeout(() => {
        if (mounted) onComplete();
      }, 4000);

      // Cleanup
      return () => {
        mounted = false;
        clearTimeout(transitionTimeout);
        clearTimeout(completeTimeout);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        nodeGeometry.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        backgroundGeometry.dispose();
        backgroundMaterial.dispose();

        nodes.forEach(node => node.material.dispose());
        connections.forEach(conn => {
          conn.material.dispose();
          conn.line.geometry.dispose();
        });

        lightRays.forEach(ray => {
          ray.mesh.geometry.dispose();
          ray.material.dispose();
        });

        rings.forEach(ring => {
          ring.mesh.geometry.dispose();
          ring.material.dispose();
        });
      };
    } catch (error) {
      console.error('Erro ao inicializar WelcomeAnimation:', error);
      if (mounted) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }
  }, [onComplete]);

  useEffect(() => {
    if (showText) {
      // Animar texto
      anime({
        targets: '.welcome-text-container',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutExpo',
      });

      anime({
        targets: '.welcome-title',
        opacity: [0, 1],
        duration: 1000,
        delay: 200,
        easing: 'easeOutExpo',
      });

      anime({
        targets: '.welcome-subtitle',
        opacity: [0, 1],
        duration: 1000,
        delay: 400,
        easing: 'easeOutExpo',
      });

      // Animação de saída do texto
      setTimeout(() => {
        anime({
          targets: '.welcome-text-container',
          opacity: [1, 0],
          translateY: [0, -20],
          duration: 600,
          easing: 'easeInExpo',
        });
      }, 2400);
    }
  }, [showText]);

  // Efeito de transição final
  useEffect(() => {
    if (startTransition && containerRef.current) {
      // Animação de zoom e fade out do centro
      anime({
        targets: containerRef.current,
        scale: [1, 1.5],
        opacity: [1, 0],
        duration: 800,
        easing: 'easeInExpo',
      });
    }
  }, [startTransition]);

  return (
    <div
      ref={containerRef}
      className={`welcome-animation-container ${startTransition ? 'transitioning' : ''}`}
    >
      <canvas ref={canvasRef} className="welcome-canvas" />

      {showText && (
        <div className="welcome-text-container">
          <h1 className="welcome-title">
            Bem-vindo, <span className="user-name-highlight">{userName}</span>!
          </h1>
          <p className="welcome-subtitle">Conectando sua experiência...</p>
        </div>
      )}

      {startTransition && (
        <div className="transition-overlay"></div>
      )}
    </div>
  );
};

export default WelcomeAnimation;
