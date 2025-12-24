/*─────────────────────────────────────────────────────────────────────────────
│                                                                             │
│      © 2025 — Soheyl Ashena                                                 │
│      Licensed under the MIT License.                                        │
│      You must retain this notice in any copies or derivative works.         │
│                                                                             │
│      Original Author: Soheyl Ashena                                         │
│      Unauthorized removal of attribution is prohibited.                     │
│                                                                             │
─────────────────────────────────────────────────────────────────────────────*/
import * as THREE from "three";
import gsap from "gsap";

import "./style.css";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

// ═════════════════════════════════════════════════════════════════════════
// |||   Three.JS logic
// ═════════════════════════════════════════════════════════════════════════

const gui = new GUI();
gui.hide();

// ─── 🔹 Texture loader ─────────────
// ──────────────────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader();

// ─── 🔹 Canvas ─────────────
// ──────────────────────────────────────────────────────────────────
const canvas = window.document.querySelector("#main-canvas")! as HTMLCanvasElement;

// ─── 🔹 WebGL renderer ─────────────
// ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
  alpha: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ─── 🔹 Camera ─────────────
// ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.set(0, 0, 1);

const orbitControl = new OrbitControls(camera, canvas);
orbitControl.enableDamping = true;
orbitControl.target.set(0, 0, 0);

// ─── 🔹 Scene ─────────────
// ──────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── 🔹 Starfield ─────────────
// ──────────────────────────────────────────────────────────────────
const starAlphaMap = textureLoader.load("/star-low2.jpg");
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 5000;
const positions = new Float32Array(starsCount * 3);
const colors = new Float32Array(starsCount * 3);
const minRadius = 50;
const maxRadius = 200;
const starsMaterial = new THREE.PointsMaterial({
  size: 1.5,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  alphaMap: starAlphaMap,
  alphaTest: 0.1,
});

for (let i = 0; i < starsCount; i++) {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = minRadius + Math.random() * (maxRadius - minRadius);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  let r, g, b;
  const colorType = Math.random();
  if (colorType < 0.3) {
    r = 0;
    g = 1;
    b = 1;
  } else if (colorType < 0.6) {
    r = 1;
    g = 1;
    b = 1;
  } else if (colorType < 0.9) {
    r = 1;
    g = 0.2;
    b = 0.5;
  } else {
    r = 1;
    g = 1;
    b = 0.2;
  }

  colors[i * 3] = r;
  colors[i * 3 + 1] = g;
  colors[i * 3 + 2] = b;
}

starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const starfield = new THREE.Points(starsGeometry, starsMaterial);

scene.add(starfield);

// ─── 🔹 Galaxy ─────────────
// ──────────────────────────────────────────────────────────────────
interface GalaxyParameters {
  count: number;
  size: number;
  radius: number;
  branches: number;
  randomness: number;
  randomnessPower: number;
  insideColor: string;
  outsideColor: string;
  time: number;
  rx: number;
  ry: number;
  rz: number;
  px: number;
  py: number;
  pz: number;
  galaxyPoints?: THREE.Points | null;
}

const generateGalaxy = (parameters: GalaxyParameters) => {
  // Remove old galaxy from scene
  if (parameters.galaxyPoints) {
    scene.remove(parameters.galaxyPoints);
    parameters.galaxyPoints.geometry.dispose();
    (parameters.galaxyPoints.material as THREE.ShaderMaterial).dispose();
  }

  let geometry: THREE.BufferGeometry | null = null;
  let material: THREE.ShaderMaterial | null = null;
  let points: THREE.Points | null = null;

  /**
   * Geometry
   */

  geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(parameters.count * 3);
  const randomness = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count * 1);

  const insideColor = new THREE.Color(parameters.insideColor);
  const outsideColor = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * parameters.radius;

    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    positions[i3] = Math.cos(branchAngle) * radius;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = Math.sin(branchAngle) * radius;

    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    // Color
    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    // Scale
    scales[i] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  /**
   * Material
   */
  material = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: parameters.time },
      uSize: { value: parameters.size * renderer.getPixelRatio() },
      uPoseX: { value: parameters.px.toFixed(2) },
      uPoseY: { value: parameters.py.toFixed(2) },
      uPoseZ: { value: parameters.pz.toFixed(2) },
    },
    vertexShader: `
uniform float uTime;
uniform float uSize;
uniform float uPoseX;
uniform float uPoseY;
uniform float uPoseZ;

attribute vec3 aRandomness;
attribute float aScale;

varying vec3 vColor;

void main()
{
    /**
     * Position
     */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                
    // Rotate
    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) * uTime;
    angle += angleOffset;
    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    // Randomness
    modelPosition.xyz += aRandomness;

    // Position offset
    modelPosition.x += uPoseX;
    modelPosition.y += uPoseY;
    modelPosition.z += uPoseZ;
    

    

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
     * Size
     */
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / - viewPosition.z);

    /**
     * Color
     */
    vColor = color;
}`,
    fragmentShader: `varying vec3 vColor;

void main()
{
    // Disc
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = step(0.5, strength);
    strength = 1.0 - strength;

    // // Diffuse point
    // float strength = distance(gl_PointCoord, vec2(0.5));
    // strength *= 2.0;
    // strength = 1.0 - strength;

    // // Light point
    // float strength = distance(gl_PointCoord, vec2(0.5));
    // strength = 1.0 - strength;
    // strength = pow(strength, 10.0);

    // Final color
    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
}`,
  });

  gsap.to(material.uniforms.uTime, {
    value: parameters.time + 2,
    duration: 10,
    yoyo: true,
    repeat: -1,
    ease: "power1.inOut",
  });

  /**
   * Points
   */
  points = new THREE.Points(geometry, material);
  parameters.galaxyPoints = points;

  // Rotate galaxy
  points.rotation.x = parameters.rx;
  points.rotation.z = parameters.rz;

  gsap.to(points.rotation, { y: Math.PI * 2, repeat: -1, ease: "none", duration: 120 });

  scene.add(points);
};

// Create several galaxies with varied parameters to fill the space
const galaxyConfigs: GalaxyParameters[] = [
  {
    count: 200000,
    size: 500,
    radius: 180,
    branches: 11,
    randomness: 0.45,
    randomnessPower: 3,
    insideColor: "#ffffff",
    outsideColor: "#7d3f0d",
    time: 260,
    rx: 0.4,
    ry: 0,
    rz: 0,
    px: 0,
    py: 0,
    pz: -300,
  },
  {
    count: 120000,
    size: 500,
    radius: 90,
    branches: 4,
    randomness: 1.1,
    randomnessPower: 3,
    insideColor: "#ff85ff",
    outsideColor: "#008585",
    time: 160,
    rx: 0,
    ry: 0,
    rz: 0.7,
    px: 0,
    py: 0,
    pz: 300,
  },
];

galaxyConfigs.forEach((cfg) => {
  const folder = gui.addFolder("Galaxy");
  folder.add(cfg, "count", 1000, 500000, 1000).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "size", 1, 500).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "radius", 10, 500).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "branches", 2, 20, 1).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "randomness", 0, 2, 0.01).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "randomnessPower", 1, 10, 0.1).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "time", 0, 1000).onChange(() => generateGalaxy(cfg));
  folder.addColor(cfg, "insideColor").onChange(() => generateGalaxy(cfg));
  folder.addColor(cfg, "outsideColor").onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "px", -300, 300).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "py", -300, 300).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "pz", -300, 300).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "rx", 0, Math.PI * 2, 0.01).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "ry", 0, Math.PI * 2, 0.01).onChange(() => generateGalaxy(cfg));
  folder.add(cfg, "rz", 0, Math.PI * 2, 0.01).onChange(() => generateGalaxy(cfg));
  folder.close();
});

galaxyConfigs.forEach((cfg) => generateGalaxy(cfg));

// ─── 🔹 Animation loop ─────────────
// ──────────────────────────────────────────────────────────────────
gsap.ticker.add(() => {
  renderer.render(scene, camera);
  orbitControl.update();
});

// ─── 🔹 Responsive design ─────────────
// ──────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
