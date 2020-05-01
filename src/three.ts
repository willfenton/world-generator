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

    const nx = x / maxAxis;
    const ny = y / maxAxis;

    elevation += 1 * noise(nx, ny, elevationNoise, 1);
    elevation += 0.5 * noise(nx, ny, elevationNoise, 2);
    elevation += 0.25 * noise(nx, ny, elevationNoise, 4);

    elevation /= (1 + 0.5 + 0.25);

    elevation = Math.pow(elevation, elevationExponent);

    return elevation;
}

function getMoisture(x: number, y: number): number {
    let moisture = 0;

    const nx = x / maxAxis;
    const ny = y / maxAxis;

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

const globalFrequency = 7.5;
const elevationExponent = 2.25;
const moistureExponent = 1.35;

const width = 256;
const height = 256;

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

function init(): void {

    container = document.getElementById('container');

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 500;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(20, 100, 20);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    function addLight(x: number, y: number, z: number): void {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        scene.add(light);
    }

    addLight(-1, 2, 4);
    addLight(1, 2, -2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize, false);

    createHeightmap();

    function createHeightmap() {

        const geometry = new THREE.Geometry();

        const cellsAcross = width - 1;
        const cellsDeep = height - 1;
        for (let z = 0; z < cellsDeep; ++z) {
            for (let x = 0; x < cellsAcross; ++x) {
                // the corner positions
                const x0 = x;
                const x1 = x + 1;
                const z0 = z;
                const z1 = z + 1;

                // look up the height for the for points
                // around this cell
                const e00 = elevation[x0][z0];
                const e01 = elevation[x1][z0];
                const e10 = elevation[x0][z1];
                const e11 = elevation[x1][z1];

                const em = (e00 + e01 + e10 + e11) / 4;

                const m00 = moisture[x0][z0];
                const m01 = moisture[x1][z0];
                const m10 = moisture[x0][z1];
                const m11 = moisture[x1][z1];

                const mm = (m00 + m01 + m10 + m11) / 4;

                const biome = getBiome(em, mm);

                const h00 = e00 * 48;
                const h01 = e01 * 48;
                const h10 = e10 * 48;
                const h11 = e11 * 48;

                // compute the average height
                const hm = (h00 + h01 + h10 + h11) / 4;

                // remember the first index of these 5 vertices
                const ndx = geometry.vertices.length;

                // add the 4 corners for this cell and the midpoint
                geometry.vertices.push(
                    new THREE.Vector3(x0, h00, z0),
                    new THREE.Vector3(x1, h01, z0),
                    new THREE.Vector3(x0, h10, z1),
                    new THREE.Vector3(x1, h11, z1),
                    new THREE.Vector3((x0 + x1) / 2, hm, (z0 + z1) / 2),
                );

                let faces = [new THREE.Face3(ndx, ndx + 4, ndx + 1),
                new THREE.Face3(ndx + 1, ndx + 4, ndx + 3),
                new THREE.Face3(ndx + 3, ndx + 4, ndx + 2),
                new THREE.Face3(ndx + 2, ndx + 4, ndx + 0)];

                for (let face of faces) {
                    face.vertexColors = [
                        (new THREE.Color()).setRGB(biome.r / 255, biome.g / 255, biome.b / 255),
                        (new THREE.Color()).setRGB(biome.r / 255, biome.g / 255, biome.b / 255),
                        (new THREE.Color()).setRGB(biome.r / 255, biome.g / 255, biome.b / 255)
                    ];
                    geometry.faces.push(face);
                }

                // add the texture coordinates for each vertex of each face.
                const u0 = x / cellsAcross;
                const v0 = z / cellsDeep;
                const u1 = (x + 1) / cellsAcross;
                const v1 = (z + 1) / cellsDeep;
                const um = (u0 + u1) / 2;
                const vm = (v0 + v1) / 2;
                geometry.faceVertexUvs[0].push(
                    [new THREE.Vector2(u0, v0), new THREE.Vector2(um, vm), new THREE.Vector2(u1, v0)],
                    [new THREE.Vector2(u1, v0), new THREE.Vector2(um, vm), new THREE.Vector2(u1, v1)],
                    [new THREE.Vector2(u1, v1), new THREE.Vector2(um, vm), new THREE.Vector2(u0, v1)],
                    [new THREE.Vector2(u0, v1), new THREE.Vector2(um, vm), new THREE.Vector2(u0, v0)],
                );
            }
        }

        geometry.computeFaceNormals();

        // center the geometry
        geometry.translate(width / -2, 0, height / -2);

        // const material = new THREE.MeshPhongMaterial({ color: 'green', map: texture });
        let material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
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
