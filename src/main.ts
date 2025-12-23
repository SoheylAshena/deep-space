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
import {
  CSS3DObject,
  CSS3DRenderer,
  GLTFLoader,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import { degToRad } from "three/src/math/MathUtils.js";
// import GUI from "lil-gui";

// ═════════════════════════════════════════════════════════════════════════
// |||   Three.JS logic
// ═════════════════════════════════════════════════════════════════════════

// const gui = new GUI();

// ─── 🔹 Loading manager ─────────────
// ──────────────────────────────────────────────────────────────────
const loadingManager = new THREE.LoadingManager(
  // onLoad
  () => {},
  // onProgress
  (_url, loaded, total) => {
    const progress = (loaded / total) * 100;
    console.log(`Loading assets: ${progress.toFixed()}%`);
  }
);

// ─── 🔹 Texture loader ─────────────
// ──────────────────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

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

// ─── 🔹 CSS Renderer ─────────────
// ──────────────────────────────────────────────────────────────────
const cssRendererContainer = document.querySelector("#css-renderer") as HTMLDivElement;
const domRenderer = new CSS3DRenderer();
domRenderer.setSize(window.innerWidth, window.innerHeight);
cssRendererContainer.appendChild(domRenderer.domElement);

console.log(domRenderer);

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
  size: 2.5,
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

// ─── 🔹 Home  ─────────────
// ──────────────────────────────────────────────────────────────────
const homeDiv = document.createElement("div");
homeDiv.className = "home";
homeDiv.innerHTML = `
  <h1>Soheyl Ashena</h1>
  <h2>Frontend Developer</h2>
`;

const homeObject = new CSS3DObject(homeDiv);
homeObject.position.set(0, 0, -10);
homeObject.scale.set(0.01, 0.01, 0.01);

// scene.add(homeObject);

// ─── 🔹 Contact ─────────────
// ──────────────────────────────────────────────────────────────────

// ─── 🔹 Projects ─────────────
// ──────────────────────────────────────────────────────────────────

// ─── 🔹 Skills ─────────────
// ──────────────────────────────────────────────────────────────────
const skillsGroup = new THREE.Group();
// scene.add(skillsGroup);

const skillsData = [
  { texture: textureLoader.load("/html.png"), color: "red" },
  { texture: textureLoader.load("/css.png"), color: "blue" },
  { texture: textureLoader.load("/js.png"), color: "yellow" },
  { texture: textureLoader.load("/typescript.png"), color: "blue" },
  { texture: textureLoader.load("/three.png"), color: "white" },
  { texture: textureLoader.load("/react.png"), color: "blue" },
  { texture: textureLoader.load("/next-js.png"), color: "white" },
  { texture: textureLoader.load("/tailwind.png"), color: "cyan" },
  { texture: textureLoader.load("/sass.jpg"), color: "magenta" },
];

gltfLoader.load("/skill-ball.glb", (loadedObject) => {
  skillsData.forEach((item, index) => {
    item.texture.colorSpace = THREE.SRGBColorSpace;
    item.texture.wrapS = THREE.RepeatWrapping;
    item.texture.repeat.x = -1;
    item.texture.offset.x = 1;

    const skillBall = loadedObject.scene.clone();
    const body = skillBall.children[0] as THREE.Mesh;
    const blades = skillBall.children[1] as THREE.Mesh;
    const screen = skillBall.children[2] as THREE.Mesh;

    screen.rotation.x = degToRad(-90);

    body.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 1,
    });

    blades.material = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 1,
    });

    screen.material = new THREE.MeshBasicMaterial({ map: item.texture });

    const distance = 2.5;
    const breakpoint = 3;
    const col = index % breakpoint;
    const row = Math.floor(index / breakpoint);
    skillBall.position.z = -col * distance;
    skillBall.position.y = -row * distance;

    gsap.to(body.rotation, {
      x: degToRad(360),
      repeat: -1,
      ease: "none",
      duration: 20,
    });
    gsap.to(blades.rotation, {
      x: degToRad(-360),
      repeat: -1,
      ease: "none",
      duration: 20,
    });

    skillsGroup.add(skillBall);
  });

  skillsGroup.rotation.y = Math.PI;
  centerObject(skillsGroup);
  skillsGroup.position.x = 10;
});

// ─── 🔹 Galaxy ─────────────
// ──────────────────────────────────────────────────────────────────
/**
 * Galaxy
 */

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
}

const generateGalaxy = (parameters: GalaxyParameters) => {
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
    // // Disc
    // float strength = distance(gl_PointCoord, vec2(0.5));
    // strength = step(0.5, strength);
    // strength = 1.0 - strength;

    // Diffuse point
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;

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

  // Rotate galaxy
  points.rotation.x = parameters.rx;
  points.rotation.y = parameters.ry;
  points.rotation.z = parameters.rz;

  scene.add(points);
};

// Create several galaxies with varied parameters to fill the space
const galaxyConfigs: GalaxyParameters[] = [
  {
    count: 100000,
    size: 200,
    radius: 240,
    branches: 15,
    randomness: 0.25,
    randomnessPower: 2,
    insideColor: "#81e2ff",
    outsideColor: "#ff52ba",
    time: 15,
    rx: Math.PI / 4,
    ry: 0,
    rz: Math.PI / 4,
    px: 0,
    py: 0,
    pz: -260,
  },
  {
    count: 100000,
    size: 200,
    radius: 310,
    branches: 5,
    randomness: 0.5,
    randomnessPower: 3,
    insideColor: "#fff9e9",
    outsideColor: "#ffabab",
    time: 50,
    rx: 0,
    ry: Math.PI / 10,
    rz: Math.PI / 10,
    px: -320,
    py: -50,
    pz: 0,
  },
  {
    count: 70000,
    size: 200,
    radius: 230,
    branches: 15,
    randomness: 0.2,
    randomnessPower: 2.2,
    insideColor: "#9de3a8",
    outsideColor: "#67b3ff",
    time: 15,
    rx: 0,
    ry: 0,
    rz: 0,
    px: 350,
    py: 0,
    pz: 0,
  },
  {
    count: 50000,
    size: 200,
    radius: 250,
    branches: 4,
    randomness: 0.45,
    randomnessPower: 2.5,
    insideColor: "#ffd27a",
    outsideColor: "#ff6b6b",
    time: 14,
    rx: -Math.PI / 2,
    ry: 0,
    rz: Math.PI / 20,
    px: 180,
    py: 70,
    pz: 0,
  },
  {
    count: 65000,
    size: 200,
    radius: 220,
    branches: 10,
    randomness: 0.18,
    randomnessPower: 1.6,
    insideColor: "#c9a6ff",
    outsideColor: "#ffd9f0",
    time: 20,
    rx: -Math.PI / 5,
    ry: 0,
    rz: -Math.PI / 6,
    px: -200,
    py: 100,
    pz: -100,
  },
  {
    count: 100000,
    size: 200,
    radius: 400,
    branches: 3,
    randomness: 0.5,
    randomnessPower: 3,
    insideColor: "#aaffff",
    outsideColor: "#ffd6a5",
    time: 50,
    rx: Math.PI / 12,
    ry: -Math.PI / 20,
    rz: Math.PI / 10,
    px: 0,
    py: -200,
    pz: 0,
  },
  {
    count: 95000,
    size: 200,
    radius: 405,
    branches: 7,
    randomness: 0.22,
    randomnessPower: 2,
    insideColor: "#ffd1f2",
    outsideColor: "#bde0ff",
    time: 11,
    rx: 0,
    ry: 0,
    rz: 0,
    px: 0,
    py: 200,
    pz: 0,
  },
  {
    count: 48000,
    size: 200,
    radius: 295,
    branches: 5,
    randomness: 0.3,
    randomnessPower: 2.1,
    insideColor: "#fff7c2",
    outsideColor: "#c1f7ff",
    time: 7,
    rx: Math.PI / 9,
    ry: Math.PI / 7,
    rz: Math.PI / 11,
    px: -200,
    py: 120,
    pz: 160,
  },
];

galaxyConfigs.forEach((cfg) => generateGalaxy(cfg));

// ─── 🔹 UFO ─────────────
// ──────────────────────────────────────────────────────────────────
gltfLoader.load("/ufo.glb", (object) => {
  const ufoGroup = object.scene;
  const ufoModel = ufoGroup.children[0];

  ufoModel.scale.set(0.04, 0.04, 0.04);

  ufoModel.position.z = -25;
  ufoModel.rotation.x = degToRad(45);
  gsap.to(ufoModel.rotation, { y: Math.PI * 2, repeat: -1, ease: "linear", duration: 2 });
  gsap.to(ufoModel.rotation, {
    x: degToRad(-45),
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
    duration: 6,
  });

  ufoGroup.rotation.x = degToRad(25);
  gsap.to(ufoGroup.rotation, { y: -Math.PI * 2, repeat: -1, ease: "linear", duration: 10 });

  // scene.add(ufoGroup);
});

// ─── 🔹 Axis Helper ─────────────
// ──────────────────────────────────────────────────────────────────
// const axisHelper = new THREE.AxesHelper(1);
// scene.add(axisHelper);

// ─── 🔹 lights ─────────────
// ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, -5);
scene.add(directionalLight);

// ─── 🔹 Mouse damping ─────────────
// ──────────────────────────────────────────────────────────────────
const mousePositions = { x: 0, y: 0 };
// const baseCameraPosition = { x: camera.position.x, y: camera.position.y };

window.addEventListener("mousemove", (event) => {
  mousePositions.x = event.clientX / window.innerWidth - 0.5;
  mousePositions.y = event.clientY / window.innerHeight - 0.5;

  // uncomment to enable camera movement with mouse
  // gsap.to(camera.position, {
  //   x: baseCameraPosition.x - mousePositions.x,
  //   y: baseCameraPosition.y + mousePositions.y,
  // });
});

// ─── 🔹 Animation loop ─────────────
// ──────────────────────────────────────────────────────────────────
gsap.ticker.add(() => {
  renderer.render(scene, camera);
  domRenderer.render(scene, camera);
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

  // Update CSS renderer
  domRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── 🔹 Utilities ─────────────
// ──────────────────────────────────────────────────────────────────
function centerObject(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  object.position.sub(center);
}
