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
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { degToRad } from "three/src/math/MathUtils.js";
import RAPIER from "@dimforge/rapier3d-compat";
import GUI from "lil-gui";
import "./style.css";

// ─── 🔹 Gui ─────────────
// ──────────────────────────────────────────────────────────────────
const gui = new GUI();
gui.hide();

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Physics ─────────────
// ──────────────────────────────────────────────────────────────────
let physicsWorld: RAPIER.World;
await RAPIER.init();
physicsWorld = new RAPIER.World({
  x: 0,
  y: -15,
  z: 0,
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Loading manager ─────────────
// ──────────────────────────────────────────────────────────────────
// const loadingScreen = document.getElementById("loading") as HTMLDivElement;
const loadingManager = new THREE.LoadingManager(() => {
  cubeCamera.update(renderer, scene);
});

// gsap.to(loadingScreen, {
//   opacity: 0,
//   duration: 1,
//   onComplete: () => {
//     loadingScreen.style.display = "none";
//   },
// });

// onProgress
// (_url, loaded, total) => {
//   const progress = (loaded / total) * 100;
// }

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Texture loader ─────────────
// ──────────────────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Canvas ─────────────
// ──────────────────────────────────────────────────────────────────
const canvas = window.document.querySelector("#main-canvas")! as HTMLCanvasElement;

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

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

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Camera ─────────────
// ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight);
camera.position.set(0, 20, 0);

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Scene ─────────────
// ──────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔊 Audio Setup ─────────────────────────────────────────────

const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const audioLoader = new THREE.AudioLoader(loadingManager);

// Background music
const bgMusic = new THREE.Audio(audioListener);

audioLoader.load("/sounds/ambient.mp3", (buffer) => {
  bgMusic.setBuffer(buffer);
  bgMusic.setLoop(true);
  bgMusic.setVolume(0.05);
});

const startAudio = () => {
  if (!bgMusic.isPlaying) {
    bgMusic.play();
    footstepSound.play();
    sprintSound.play();
  }
  window.removeEventListener("click", startAudio);
  window.removeEventListener("touchstart", startAudio);
};

window.addEventListener("click", startAudio);
window.addEventListener("touchstart", startAudio);

const jumpSound = new THREE.Audio(audioListener);
const sprintSound = new THREE.Audio(audioListener);
const footstepSound = new THREE.Audio(audioListener);

audioLoader.load("/sounds/forceField_001.ogg", (b) => jumpSound.setBuffer(b));
audioLoader.load("/sounds/spaceEngineLow_003.ogg", (b) => {
  sprintSound.setBuffer(b);
  sprintSound.setLoop(true);
  sprintSound.setVolume(0.0);
});
audioLoader.load("/sounds/spaceEngineLow_001.ogg", (b) => {
  footstepSound.setBuffer(b);
  footstepSound.setLoop(true);
  footstepSound.setVolume(0.1);
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Third person controller ─────────────
// ──────────────────────────────────────────────────────────────────
let player!: THREE.Object3D;
let playerMixer!: THREE.AnimationMixer;

// 🔹 Constants
// ─────────────────────────────────────────────────────────────
const MOVE_SPEED = 10;
const SPRINT_MULTIPLIER = 2;
const PLAYER_RADIUS = 0.5;
const RESPAWN_POSITION = new THREE.Vector3(5, 5, 0);
const MOUSE_SENSITIVITY = 0.002;
const SPRINT_LEAN_ANGLE = THREE.MathUtils.degToRad(25);
const LEAN_LERP_SPEED = 10;
const DEFAULT_UP = new THREE.Vector3(0, 1, 0);
const JUMP_FORCE = 18;
const GROUND_DETECTION_DISTANCE = 0.8;
const COYOTE_TIME = 0.1; // Time after leaving ground to allow jump
const LINEAR_DAMPING = 1; // Reduced from 4 for realistic gravity feel

// 🔹 Camera Offsets
// ─────────────────────────────────────────────────────────────
const CAMERA_OFFSET = new THREE.Vector3(0, 2, 5);
const CAMERA_TARGET_OFFSET = new THREE.Vector3(0, 1.5, 0);

// 🔹 State
// ─────────────────────────────────────────────────────────────
let yaw = 0;
let pitch = 0;
let isMoving = false;
let isSprinting = false;
let isGrounded = false;
let canJump = false;
let spaceJustPressed = false;
let coyoteCounter = 0;

// 🔹 Input
// ─────────────────────────────────────────────────────────────
const keys: Record<string, boolean> = {};
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Desktop keyboard
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// Mouse look
renderer.domElement.addEventListener("click", () => {
  if (!isMobile) renderer.domElement.requestPointerLock();
  else renderer.domElement.requestFullscreen();
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * MOUSE_SENSITIVITY;
  pitch -= e.movementY * MOUSE_SENSITIVITY;
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 3, Math.PI / 3);
});

// 🔹 Mobile Touch Input
// ─────────────────────────────────────────────────────────────
let leftTouchId: number | null = null;
let rightTouchId: number | null = null;
let mobileJump = false;
let mobileSprint = false;

const leftStart = new THREE.Vector2();
const rightStart = new THREE.Vector2();
const leftDelta = new THREE.Vector2();
const rightDelta = new THREE.Vector2();

window.addEventListener("touchstart", (e) => {
  for (const t of e.changedTouches) {
    if (t.clientX < window.innerWidth * 0.5 && leftTouchId === null) {
      leftTouchId = t.identifier;
      leftStart.set(t.clientX, t.clientY);
      leftDelta.set(0, 0);
    } else if (rightTouchId === null) {
      rightTouchId = t.identifier;
      rightStart.set(t.clientX, t.clientY);
      rightDelta.set(0, 0);
    }
  }
  mobileJump = e.touches.length >= 2;
  mobileSprint = e.touches.length >= 3;
});

window.addEventListener("touchmove", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === leftTouchId) {
      leftDelta.set(t.clientX - leftStart.x, t.clientY - leftStart.y);
    }
    if (t.identifier === rightTouchId) {
      rightDelta.set(t.clientX - rightStart.x, t.clientY - rightStart.y);
    }
  }
});

window.addEventListener("touchend", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === leftTouchId) leftTouchId = null;
    if (t.identifier === rightTouchId) rightTouchId = null;
  }
  leftDelta.set(0, 0);
  rightDelta.set(0, 0);

  mobileJump = e.touches.length >= 2;
  mobileSprint = e.touches.length >= 3;
});

// 🔹 Shared Objects
// ─────────────────────────────────────────────────────────────
const moveDir = new THREE.Vector3();
const camEuler = new THREE.Euler(0, 0, 0, "YXZ");
const camOffset = new THREE.Vector3();
const camTarget = new THREE.Vector3();

// 🔹 Player Loader
// ─────────────────────────────────────────────────────────────
let playerPivot: THREE.Object3D;
let playerBody: RAPIER.RigidBody;

gltfLoader.load("/robi.glb", (gltf) => {
  player = new THREE.Group();
  playerPivot = gltf.scene;

  player.add(playerPivot);
  player.scale.set(3, 3, 3);
  scene.add(player);

  // ---- PHYSICS BODY ----
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(RESPAWN_POSITION.x, RESPAWN_POSITION.y, RESPAWN_POSITION.z)
    .setLinearDamping(LINEAR_DAMPING)
    .setAngularDamping(10);

  playerBody = physicsWorld.createRigidBody(bodyDesc);
  playerBody.lockRotations(true, true);

  // Capsule collider
  const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, PLAYER_RADIUS)
    .setFriction(0.0)
    .setRestitution(0.0);

  physicsWorld.createCollider(colliderDesc, playerBody);

  playerMixer = new THREE.AnimationMixer(playerPivot);
  const hoverAnimation = gltf.animations.find((a) => a.name === "Scene");
  if (hoverAnimation) playerMixer.clipAction(hoverAnimation).play();
});

// ─────────────────────────────────────────────────────────────
// 🔹 Main Controller Update
// ─────────────────────────────────────────────────────────────
export function updateThirdPersonController(delta: number) {
  if (!playerBody || !player) return;

  // --- Sync Three.js mesh with physics body ---
  const pos = playerBody.translation();
  player.position.set(pos.x, pos.y, pos.z);

  // --- Ground detection using raycast ---
  const downRay = new RAPIER.Ray(pos, { x: 0, y: -1, z: 0 });
  const hit = physicsWorld.castRay(downRay, GROUND_DETECTION_DISTANCE, true);

  // Check velocity to detect if falling
  const currentVel = playerBody.linvel();
  const isFalling = currentVel.y < -0.1;

  isGrounded = hit !== null && !isFalling;

  // Coyote time - allow jump for a short time after leaving ground
  if (isGrounded) {
    coyoteCounter = COYOTE_TIME;
  } else {
    coyoteCounter -= delta;
  }
  canJump = coyoteCounter > 0;

  // --- Input ---
  let inputX = 0;
  let inputZ = 0;

  if (isMobile) {
    inputX = THREE.MathUtils.clamp(leftDelta.x / 60, -1, 1);
    inputZ = THREE.MathUtils.clamp(leftDelta.y / 60, -1, 1);
  } else {
    inputX = (keys["KeyA"] ? -1 : 0) + (keys["KeyD"] ? 1 : 0);
    inputZ = (keys["KeyW"] ? -1 : 0) + (keys["KeyS"] ? 1 : 0);
  }

  moveDir.set(inputX, 0, inputZ);

  isMoving = moveDir.lengthSq() > 0;
  isSprinting = keys["ShiftLeft"] || keys["ShiftRight"] || mobileSprint;

  if (isMoving) moveDir.normalize();
  moveDir.applyAxisAngle(DEFAULT_UP, yaw);

  // --- Apply movement velocity ---
  const speed = MOVE_SPEED * (isSprinting ? SPRINT_MULTIPLIER : 1);
  const moveVel = moveDir.clone().multiplyScalar(speed);
  playerBody.setLinvel({ x: moveVel.x, y: currentVel.y, z: moveVel.z }, true);

  // --- Handle jump ---
  const spacePressed = keys["Space"] || mobileJump;
  spaceJustPressed = spacePressed && !keys["_spacePrev"];

  if (spaceJustPressed && canJump) {
    playerBody.setLinvel({ x: currentVel.x, y: JUMP_FORCE, z: currentVel.z }, true);
    coyoteCounter = 0; // Use up coyote time
    jumpSound.play();
  }
  keys["_spacePrev"] = spacePressed;

  // --- Rotation ---
  if (isMoving) {
    const targetYaw = Math.atan2(moveDir.x, moveDir.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetYaw, delta * 10);
  }

  // --- Sprint lean ---
  const targetLean = isSprinting && isMoving ? SPRINT_LEAN_ANGLE : 0;
  playerPivot.rotation.x = THREE.MathUtils.lerp(
    playerPivot.rotation.x,
    targetLean,
    delta * LEAN_LERP_SPEED
  );

  // --- Animation speed ---
  if (playerMixer) {
    const targetTimeScale = isSprinting ? 2.0 : 1.0;
    playerMixer.timeScale = THREE.MathUtils.lerp(
      playerMixer.timeScale,
      targetTimeScale,
      delta * 10
    );
  }

  // --- Camera ---
  camEuler.set(pitch, yaw, 0);
  camOffset.copy(CAMERA_OFFSET).applyEuler(camEuler);
  camTarget.copy(player.position).add(CAMERA_TARGET_OFFSET);

  camera.position.copy(camTarget).add(camOffset);
  camera.lookAt(camTarget);
}

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Environment map ─────────────
// ──────────────────────────────────────────────────────────────────
const renderTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });

const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget);
cubeCamera.layers.set(1);

scene.environment = cubeCamera.renderTarget.texture;

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Starfield ─────────────
// ──────────────────────────────────────────────────────────────────
const starAlphaMap = textureLoader.load("/star-low2.jpg");
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 5000;
const positions = new Float32Array(starsCount * 3);
const colors = new Float32Array(starsCount * 3);
const minRadius = 500;
const maxRadius = 900;
const starsMaterial = new THREE.PointsMaterial({
  size: 15,
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

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Fantasy planet ─────────────
// ──────────────────────────────────────────────────────────────────
gltfLoader.load("/fantasy-planet.glb", (object) => {
  const fantasy = object.scene;
  fantasy.scale.set(20, 20, 20);
  fantasy.updateWorldMatrix(true, true);
  scene.add(fantasy);

  fantasy.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const geometry = mesh.geometry.clone();

    // APPLY WORLD TRANSFORMS TO GEOMETRY
    geometry.applyMatrix4(mesh.matrixWorld);

    const body = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());

    const colliderDesc = RAPIER.ColliderDesc.trimesh(
      geometry.attributes.position.array as Float32Array,
      geometry.index?.array as Uint32Array
    );

    physicsWorld.createCollider(colliderDesc, body);
  });
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Skills ─────────────
// ──────────────────────────────────────────────────────────────────
const skillsGroup = new THREE.Group();
scene.add(skillsGroup);

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
      roughness: 0.2,
      metalness: 1,
    });

    blades.material = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.2,
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
  skillsGroup.position.x = 20;
  skillsGroup.position.y = 7;
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Galaxies ─────────────
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
  parameters.galaxyPoints = points;

  // Rotate galaxy
  points.rotation.x = parameters.rx;
  points.rotation.z = parameters.rz;

  gsap.to(points.rotation, { y: Math.PI * 2, repeat: -1, ease: "none", duration: 120 });

  points.layers.enable(1);
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

galaxyConfigs.forEach((cfg) => generateGalaxy(cfg));

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 UFO ─────────────
// ──────────────────────────────────────────────────────────────────
gltfLoader.load("/ufo.glb", (object) => {
  const ufoGroup = object.scene;
  const ufoModel = ufoGroup.children[0];

  const ufoSound = new THREE.PositionalAudio(audioListener);
  audioLoader.load("/sounds/spaceEngine_003.ogg", (buffer) => {
    ufoSound.setBuffer(buffer);
    ufoSound.setLoop(true);
    ufoSound.setVolume(0.3);
    ufoSound.setRefDistance(10);
    ufoSound.play();
  });

  ufoModel.add(ufoSound);

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

  scene.add(ufoGroup);
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 lights ─────────────
// ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Animation loop ─────────────
// ──────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

gsap.ticker.add(() => {
  let delta = clock.getDelta();
  const myDelta = Math.min(delta, 0.1); // prevent large deltas

  updateThirdPersonController(myDelta);
  if (playerMixer) playerMixer.update(delta);

  physicsWorld.step();
  renderer.render(scene, camera);
  // domRenderer.render(scene, camera);
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

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
  // domRenderer.setSize(window.innerWidth, window.innerHeight);
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Utilities ─────────────
// ──────────────────────────────────────────────────────────────────
function centerObject(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  object.position.sub(center);
}

// function poseLikeGrid(array: THREE.Object3D[], breakpoint: number, distance: number) {
//   return array.map((item, index) => {
//     const col = index % breakpoint;
//     const row = Math.floor(index / breakpoint);
//     item.position.z = col * distance;
//     item.position.y = -row * distance;
//   });
// }

// function alignHtmlToObject3D(object: THREE.Object3D, camera: THREE.Camera, elem: HTMLElement) {
//   const tempV = new THREE.Vector3();
//   object.updateWorldMatrix(true, false);
//   object.getWorldPosition(tempV);
//   tempV.project(camera);
//   const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
//   const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;
//   elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
// }
