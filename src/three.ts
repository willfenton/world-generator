import { makeNoise2D } from "open-simplex-noise";

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function create2DArray(columns: number, rows: number): Array<number> {
    var array = new Array(columns);

    for (let i = 0; i < columns; i++) {
        array[i] = new Array(rows);
        array[i].fill(0);
    }

    return array;
}

function noise(nx: number, ny: number, noiseFunc: Function, frequency = 1.0): number {
    let value = noiseFunc(
        nx * frequency * globalFrequency,
        ny * frequency * globalFrequency
    );
    return (value - noiseMin) / (noiseMax - noiseMin);
}

function getElevation(x: number, y: number): number {
    let elevation = 0;

    const nx = (x / maxAxis) - 0.5;
    const ny = (y / maxAxis) - 0.5;

    elevation += 1 * noise(nx, ny, elevationNoise, 1);
    elevation += 0.5 * noise(nx, ny, elevationNoise, 2);
    elevation += 0.25 * noise(nx, ny, elevationNoise, 4);

    elevation /= (1 + 0.5 + 0.25);

    elevation = Math.pow(elevation, elevationExponent);

    return elevation;
}

function getMoisture(x: number, y: number): number {
    let moisture = 0;

    const nx = (x / maxAxis) - 0.5;
    const ny = (y / maxAxis) - 0.5;

    moisture += 1 * noise(nx, ny, moistureNoise, 1);
    moisture += 0.5 * noise(nx, ny, moistureNoise, 2);
    moisture += 0.25 * noise(nx, ny, moistureNoise, 4);

    moisture /= (1 + 0.5 + 0.25);

    moisture = Math.pow(moisture, moistureExponent);

    return moisture;
}

class Biome {
    r: number;
    g: number;
    b: number;
    constructor(colorHex: string) {
        // get rgb values from hex color
        this.r = parseInt(colorHex.slice(1, 3), 16);
        this.g = parseInt(colorHex.slice(3, 5), 16);
        this.b = parseInt(colorHex.slice(5, 7), 16);
    }
}

function getBiome(elevation: number, moisture: number): Biome {
    if (elevation < 0.12) return biomes.OCEAN;
    if (elevation < 0.14) return biomes.BEACH;

    if (elevation > 0.8) {
        if (moisture < 0.1) return biomes.SCORCHED;
        if (moisture < 0.2) return biomes.BARE;
        if (moisture < 0.5) return biomes.TUNDRA;
        return biomes.SNOW;
    }

    if (elevation > 0.6) {
        if (moisture < 0.33) return biomes.TEMPERATE_DESERT;
        if (moisture < 0.66) return biomes.SHRUBLAND;
        return biomes.TAIGA;
    }

    if (elevation > 0.3) {
        if (moisture < 0.16) return biomes.TEMPERATE_DESERT;
        if (moisture < 0.50) return biomes.GRASSLAND;
        if (moisture < 0.83) return biomes.TEMPERATE_DECIDUOUS_FOREST;
        return biomes.TEMPERATE_RAIN_FOREST;
    }

    if (moisture < 0.16) return biomes.SUBTROPICAL_DESERT;
    if (moisture < 0.33) return biomes.GRASSLAND;
    if (moisture < 0.66) return biomes.TROPICAL_SEASONAL_FOREST;
    return biomes.TROPICAL_RAIN_FOREST;
}

const biomes = {
    OCEAN: new Biome("#43437A"),
    BEACH: new Biome("#8D8177"),
    SCORCHED: new Biome("#555555"),
    BARE: new Biome("#888888"),
    TUNDRA: new Biome("#BABAA9"),
    SNOW: new Biome("#DEDEE5"),
    TEMPERATE_DESERT: new Biome("#C9D29B"),
    SHRUBLAND: new Biome("#889977"),
    TAIGA: new Biome("#99AB77"),
    GRASSLAND: new Biome("#88AB55"),
    TEMPERATE_DECIDUOUS_FOREST: new Biome("#679359"),
    TEMPERATE_RAIN_FOREST: new Biome("#438855"),
    SUBTROPICAL_DESERT: new Biome("#D2B98B"),
    TROPICAL_SEASONAL_FOREST: new Biome("#569944"),
    TROPICAL_RAIN_FOREST: new Biome("#337755")
}

// let seed: number;
const seed = 0;

const globalFrequency = 10;
const elevationExponent = 2.25;
const moistureExponent = 1.35;

const width = 2048;
const height = 2048;

let elevationNoise: Function;
let moistureNoise: Function;

const noiseMin = -Math.sqrt(3 / 4);
const noiseMax = +Math.sqrt(3 / 4);

const maxAxis = Math.max(width, height);

var elevation = create2DArray(width, height);
var moisture = create2DArray(width, height);

// (<HTMLButtonElement>document.getElementById("generateButton")).onclick = generateWorld;

function generateWorld(): void {
    // seed = parseInt((<HTMLInputElement>document.getElementById("seedInput")).value);

    elevationNoise = makeNoise2D(seed);
    moistureNoise = makeNoise2D(seed + 1);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            elevation[x][y] = getElevation(x, y);
            moisture[x][y] = getMoisture(x, y);
        }
    }

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const pixelElevation = elevation[x][y];
            const pixelMoisture = moisture[x][y];

            let biome = getBiome(pixelElevation, pixelMoisture);

            if (biome === biomes.OCEAN) {
                elevation[x][y] = 0.119;
                // elevation[x][y] = 0;
            }
        }
    }

    init();
    animate();
}

var container;

var camera, scene, renderer;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

generateWorld();

function setLight(scene) {
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.castShadow = true;

    // light.shadow.bias = -0.0001;

    light.shadow.camera.left = -1; // --------- added
    light.shadow.camera.right = 1;
    light.shadow.camera.top = 1;
    light.shadow.camera.bottom = -1;
    light.shadow.camera.near = 0;
    light.shadow.camera.far = 3;

    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;

    // scene.add(new THREE.AxesHelper(300));

    // scene.add(new THREE.CameraHelper(light.shadow.camera)); // -------- added

    light.position.set(1, 1, 1); // CHANGED
    scene.add(light);
    // scene.add(new THREE.DirectionalLightHelper(light, 2));
}

function createBox(scene: THREE.Scene, height = 0.14, size = 1, depth = 0.005): void {
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);

    const woodMaterial = new THREE.MeshBasicMaterial({ map: loader.load('https://threejsfundamentals.org/threejs/lessons/resources/images/compressed-but-large-wood-texture.jpg') });

    let boxGeometry: THREE.BoxGeometry;
    let boxMesh: THREE.Mesh;

    boxGeometry = new THREE.BoxGeometry(size, depth, size);
    boxMesh = new THREE.Mesh(boxGeometry, woodMaterial);
    boxMesh.translateY(-(depth / 2) - 0.001);
    scene.add(boxMesh);

    boxGeometry = new THREE.BoxGeometry(depth, height + depth, size + depth);
    boxMesh = new THREE.Mesh(boxGeometry, woodMaterial);
    boxMesh.translateX((size / 2) + (depth / 2));
    boxMesh.translateY((height / 2) - (depth / 2));
    boxMesh.translateZ(depth / 2);
    scene.add(boxMesh);

    boxGeometry = new THREE.BoxGeometry(depth, height + depth, size + depth);
    boxMesh = new THREE.Mesh(boxGeometry, woodMaterial);
    boxMesh.translateX(-(size / 2) + -(depth / 2));
    boxMesh.translateY((height / 2) - (depth / 2));
    boxMesh.translateZ(-depth / 2);
    scene.add(boxMesh);

    boxGeometry = new THREE.BoxGeometry(size + depth, height + depth, depth);
    boxMesh = new THREE.Mesh(boxGeometry, woodMaterial);
    boxMesh.translateX(-depth / 2);
    boxMesh.translateY((height / 2) - (depth / 2));
    boxMesh.translateZ((size / 2) + (depth / 2));
    scene.add(boxMesh);

    boxGeometry = new THREE.BoxGeometry(size + depth, height + depth, depth);
    boxMesh = new THREE.Mesh(boxGeometry, woodMaterial);
    boxMesh.translateX(depth / 2);
    boxMesh.translateY((height / 2) - (depth / 2));
    boxMesh.translateZ(-(size / 2) + -(depth / 2));
    scene.add(boxMesh);
}

function init(): void {

    container = document.getElementById('container');

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(1, 1, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    setLight(scene);

    createHeightmap();

    createBox(scene);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // renderer.shadowMap.renderSingleSided = false;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    function createHeightmap() {
        let plane = new THREE.PlaneBufferGeometry(1, 1, width - 1, height - 1);
        let position = plane.attributes.position;

        let colors = [];

        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                const i = (z * height) + x;
                position.setZ(i, elevation[x][z] / 5);

                const biome = getBiome(elevation[x][z], moisture[x][z]);

                colors.push(biome.r / 255, biome.g / 255, biome.b / 255);
            }
        }

        plane.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

        let basicMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
        let basicMesh = new THREE.Mesh(plane, basicMaterial);

        let shadowMaterial = new THREE.ShadowMaterial({ opacity: .5 });
        let shadowMesh = new THREE.Mesh(plane, shadowMaterial);

        basicMesh.castShadow = false;
        basicMesh.receiveShadow = false;

        shadowMesh.castShadow = true;
        shadowMesh.receiveShadow = true;

        basicMesh.rotation.x = -Math.PI / 2;
        shadowMesh.rotation.x = -Math.PI / 2;

        plane.computeFaceNormals();
        plane.computeVertexNormals();

        scene.add(basicMesh);
        scene.add(shadowMesh);
    }
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    render();
}

function render() {
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}
