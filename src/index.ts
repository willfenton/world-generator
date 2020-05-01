// import * as $ from "jquery";
// (<any>window).jQuery = $

// import "bootstrap";
// import 'bootstrap/dist/css/bootstrap.css' // Import precompiled Bootstrap css

import { makeNoise2D } from "open-simplex-noise";

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

let seed: number;

const globalFrequency = 7.5;
const elevationExponent = 1.75;
const moistureExponent = 1.35;

var canvas = document.querySelector("canvas");

const width = 512;
const height = 512;

const ctx = canvas.getContext("2d");
const imageData = ctx.createImageData(width, height);
let mapImage: ImageBitmap;

let elevationNoise: Function;
let moistureNoise: Function;

const noiseMin = -Math.sqrt(3 / 4);
const noiseMax = +Math.sqrt(3 / 4);

const maxAxis = Math.max(width, height);

var elevation = create2DArray(width, height);
var moisture = create2DArray(width, height);

(<HTMLButtonElement>document.getElementById("generateButton")).onclick = generateWorld;

function generateWorld(): void {
    seed = parseInt((<HTMLInputElement>document.getElementById("seedInput")).value);
    console.log(seed);

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

            let r = biome.r;
            let g = biome.g;
            let b = biome.b;
            let a = 255;

            const i = (x + y * width) * 4;

            // rgba
            imageData.data[i] = r;
            imageData.data[i + 1] = g;
            imageData.data[i + 2] = b;
            imageData.data[i + 3] = a;
        }
    }

    createImageBitmap(imageData).then((imgBitmap) => {
        mapImage = imgBitmap;
        animate();
    });
}

function animate(): void {
    requestAnimationFrame(animate);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = Math.min(canvas.width, canvas.height, width, height);
    ctx.drawImage(mapImage, 0, 0, width, height, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
}

generateWorld();

// ctx.putImageData(imageData, 0, 0);

// console.log(canvas.width, canvas.height);

// console.log(elevation);
