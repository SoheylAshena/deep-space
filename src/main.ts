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

// ─── 🔹 CSS Renderer ─────────────
// ──────────────────────────────────────────────────────────────────
// const cssRendererContainer = document.querySelector("#css-renderer") as HTMLDivElement;
// const domRenderer = new CSS3DRenderer();
// domRenderer.setSize(window.innerWidth, window.innerHeight);
// cssRendererContainer.appendChild(domRenderer.domElement);

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
const SPRINT_VOLUME = 1.0;
const IDLE_VOLUME = 0.0;
const SPRINT_VOLUME_LERP = 5; // higher = faster response

const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const audioLoader = new THREE.AudioLoader();

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

// ─── 🔹 Character ─────────────
// ──────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// 🔹 Constants
// ─────────────────────────────────────────────────────────────
const MOVE_SPEED = 10;
const SPRINT_MULTIPLIER = 2;
const GRAVITY = -30;
const JUMP_FORCE = 15;
const PLAYER_RADIUS = 0.5;

const GROUND_CHECK_DISTANCE = 0.5;
const FALL_RESPAWN_Y = -50;
const RESPAWN_POSITION = new THREE.Vector3(0, 5, 0);
const MAX_AIR_TIME = 2.5;

const MOUSE_SENSITIVITY = 0.002;
const MOBILE_LOOK_SENSITIVITY = 0.003;

const COYOTE_TIME = 0.15;
const JUMP_BUFFER = 0.15;

const SPRINT_LEAN_ANGLE = THREE.MathUtils.degToRad(25);
const LEAN_LERP_SPEED = 10;

const DEFAULT_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_DOWN = new THREE.Vector3(0, -1, 0);

// ─────────────────────────────────────────────────────────────
// 🔹 Camera Offsets
// ─────────────────────────────────────────────────────────────
const CAMERA_OFFSET = new THREE.Vector3(0, 2, 5);
const CAMERA_TARGET_OFFSET = new THREE.Vector3(0, 1.5, 0);

// ─────────────────────────────────────────────────────────────
// 🔹 State
// ─────────────────────────────────────────────────────────────
let yaw = 0;
let pitch = 0;

let verticalVelocity = 0;
let airTime = 0;
let isGrounded = false;

let coyoteTimer = 0;
let jumpBufferTimer = 0;

let headBobTime = 0;

let isMoving = false;
let isSprinting = false;

// ─────────────────────────────────────────────────────────────
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
  else requestfullscreen(renderer.domElement);
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  yaw -= e.movementX * MOUSE_SENSITIVITY;
  pitch -= e.movementY * MOUSE_SENSITIVITY;
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 3, Math.PI / 3);
});

// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// 🔹 Raycasters & Shared Objects
// ─────────────────────────────────────────────────────────────
const groundRaycaster = new THREE.Raycaster();
const wallRaycaster = new THREE.Raycaster();
const cameraRaycaster = new THREE.Raycaster();

const moveDir = new THREE.Vector3();
const moveStep = new THREE.Vector3();
const wallNormal = new THREE.Vector3();
const camEuler = new THREE.Euler(0, 0, 0, "YXZ");
const camOffset = new THREE.Vector3();
const camTarget = new THREE.Vector3();

// Objects to collide against
const groundObjects: THREE.Object3D[] = [];
const wallObjects: THREE.Object3D[] = [];
const cameraCollisionObjects: THREE.Object3D[] = [];

// ─────────────────────────────────────────────────────────────
// 🔹 Player Loader
// ─────────────────────────────────────────────────────────────
let playerPivot!: THREE.Object3D;

gltfLoader.load("/robi.glb", (gltf) => {
  player = new THREE.Group();
  playerPivot = gltf.scene;

  player.add(playerPivot);
  player.position.copy(RESPAWN_POSITION);
  player.scale.set(3, 3, 3);

  scene.add(player);

  playerMixer = new THREE.AnimationMixer(playerPivot);
  const hoverAnimation = gltf.animations.find((a) => a.name === "Scene");
  if (hoverAnimation) playerMixer.clipAction(hoverAnimation).play();
});

// ─────────────────────────────────────────────────────────────
// 🔹 Main Controller Update
// ─────────────────────────────────────────────────────────────
export function updateThirdPersonController(delta: number) {
  if (!player) return;

  // ===== Ground Check =====
  groundRaycaster.set(player.position, DEFAULT_DOWN);
  const groundHits = groundRaycaster.intersectObjects(groundObjects, true);

  isGrounded = groundHits.length > 0 && groundHits[0].distance < GROUND_CHECK_DISTANCE;

  if (isGrounded) {
    airTime = 0;
    coyoteTimer = COYOTE_TIME;
    verticalVelocity = Math.max(0, verticalVelocity);
    player.position.y = groundHits[0].point.y + GROUND_CHECK_DISTANCE;
  } else {
    airTime += delta;
    coyoteTimer -= delta;
  }

  // ===== Jump =====
  if (keys["Space"] || mobileJump) {
    jumpBufferTimer = JUMP_BUFFER;
  } else {
    jumpBufferTimer -= delta;
  }

  if (jumpBufferTimer > 0 && coyoteTimer > 0) {
    verticalVelocity = JUMP_FORCE;
    jumpBufferTimer = 0;
    coyoteTimer = 0;

    jumpSound.play();
  }

  // ===== Gravity =====
  console.log(verticalVelocity);
  verticalVelocity += GRAVITY * delta;
  player.position.y += verticalVelocity * delta;

  // ===== Respawn =====
  if (player.position.y < FALL_RESPAWN_Y || airTime > MAX_AIR_TIME) {
    player.position.copy(RESPAWN_POSITION);
    verticalVelocity = 0;
    airTime = 0;
  }

  // ===== Movement Input =====
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

  // ===== Sprint Forward Lean =====
  const targetLean = isSprinting && isMoving ? SPRINT_LEAN_ANGLE : 0;
  playerPivot.rotation.x = THREE.MathUtils.lerp(
    playerPivot.rotation.x,
    targetLean,
    delta * LEAN_LERP_SPEED
  );

  // ===== Sprint Sound Volume =====
  const targetSprintVolume = isSprinting ? SPRINT_VOLUME : IDLE_VOLUME;
  const currentVolume = sprintSound.getVolume();
  const newVolume = THREE.MathUtils.lerp(
    currentVolume,
    targetSprintVolume,
    delta * SPRINT_VOLUME_LERP
  );
  sprintSound.setVolume(newVolume);

  // ===== Movement, Collisions, Rotation =====
  if (isMoving) {
    moveDir.normalize().applyAxisAngle(DEFAULT_UP, yaw);

    let speed = MOVE_SPEED;
    if (isSprinting) speed *= SPRINT_MULTIPLIER;

    // Player animation speed
    playerMixer.timeScale = isSprinting ? 2.0 : 1.0;

    // Move step
    moveStep.copy(moveDir).multiplyScalar(speed * delta);

    // Wall collision
    wallRaycaster.set(
      player.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
      moveStep.clone().normalize()
    );
    wallRaycaster.far = moveStep.length() + PLAYER_RADIUS;

    const wallHits = wallRaycaster.intersectObjects(wallObjects, true);
    if (wallHits.length === 0) {
      player.position.add(moveStep);
    } else if (wallHits[0].face) {
      wallNormal.copy(wallHits[0].face.normal).transformDirection(wallHits[0].object.matrixWorld);
      moveStep.projectOnPlane(wallNormal);
      player.position.add(moveStep);
    }

    // Smooth rotation toward movement direction
    const targetYaw = Math.atan2(moveDir.x, moveDir.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetYaw, delta * 10);
  }

  // ===== Mobile Look =====
  if (isMobile && rightTouchId !== null) {
    yaw -= rightDelta.x * MOBILE_LOOK_SENSITIVITY;
    pitch -= rightDelta.y * MOBILE_LOOK_SENSITIVITY;
    pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 3, Math.PI / 3);
  }

  // ===== Camera =====
  camEuler.set(pitch, yaw, 0);
  camOffset.copy(CAMERA_OFFSET).applyEuler(camEuler);
  camTarget.copy(player.position).add(CAMERA_TARGET_OFFSET);

  cameraRaycaster.set(camTarget, camOffset.clone().normalize());
  const camHits = cameraRaycaster.intersectObjects(cameraCollisionObjects, true);

  if (camHits.length > 0 && camHits[0].distance < camOffset.length()) {
    camOffset.setLength(Math.max(camHits[0].distance - 0.5, 1));
  }

  camera.position.copy(camTarget).add(camOffset);
  camera.lookAt(camTarget);

  const targetFov = isSprinting ? 60 : 45;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
  camera.updateProjectionMatrix();

  // ===== Head Bob =====
  if (isGrounded && isMoving) {
    headBobTime += delta * 10;
  } else {
    headBobTime = 0;
  }

  camera.position.y += Math.sin(headBobTime) * 0.05;
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

// ─── 🔹 Home  ─────────────
// ──────────────────────────────────────────────────────────────────
// const homeDiv = document.createElement("div");
// homeDiv.className = "home";
// homeDiv.innerHTML = `
//   <h1>Soheyl Ashena</h1>
//   <h2>Frontend Developer</h2>
// `;

// const homeObject = new CSS3DObject(homeDiv);
// homeObject.position.set(0, 0, -10);
// homeObject.scale.set(0.01, 0.01, 0.01);

// scene.add(homeObject);

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
  const planet = fantasy.children[0].children[0];

  fantasy.scale.set(20, 20, 20);

  gsap.to(planet.rotation, { y: Math.PI * 2, repeat: -1, ease: "linear", duration: 60 });

  groundObjects.push(fantasy);
  wallObjects.push(fantasy);
  cameraCollisionObjects.push(fantasy);
  // scene.add(fantasy);
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Land ─────────────
// ──────────────────────────────────────────────────────────────────
gltfLoader.load("/land.glb", (object) => {
  const land = object.scene;
  land.scale.set(0.2, 0.2, 0.2);
  groundObjects.push(land);
  cameraCollisionObjects.push(land);
  scene.add(land);
});

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Contact ─────────────
// ──────────────────────────────────────────────────────────────────

/************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************
 ************************************************************/

// ─── 🔹 Projects ─────────────
// ──────────────────────────────────────────────────────────────────

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
  renderer.render(scene, camera);
  let delta = clock.getDelta();

  updateThirdPersonController(delta);
  if (playerMixer) playerMixer.update(delta);

  // Dead zone
  if (leftDelta.length() < 6) leftDelta.set(0, 0);
  if (rightDelta.length() < 6) rightDelta.set(0, 0);

  // Damping (smooth decay)
  leftDelta.multiplyScalar(0.85);
  rightDelta.multiplyScalar(0.85);

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

function requestfullscreen(element: HTMLCanvasElement) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    (element as any).webkitRequestFullscreen();
  }
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
