import { makeNoise2D } from "open-simplex-noise";
import prand from 'pure-rand';

function noise(nx: number, ny: number, noiseFunc: Function, frequency: number, noiseMin: number, noiseMax: number): number {
    let value = noiseFunc(
        nx * frequency,
        ny * frequency
    );
    return (value - noiseMin) / (noiseMax - noiseMin);
}

function create2DArray(columns: number, rows: number): Array<number> {
    var array = new Array(columns);

    for (let i = 0; i < columns; i++) {
        array[i] = new Array(rows);
        array[i].fill(0);
    }

    return array;
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

export class World {
    baseFrequency = 10;
    elevationExponent = 2.25;
    moistureExponent = 1.35;

    elevation: Array<number>;
    moisture: Array<number>;

    elevationNoise: Function;
    moistureNoise: Function;

    noiseMin = -Math.sqrt(3 / 4);
    noiseMax = Math.sqrt(3 / 4);

    constructor(public resolution = 512, public seed = 0) {
        this.setSeed(this.seed);

        this.generate();
    }

    setSeed(seed: number) {
        this.seed = seed;

        // mersenne twister random number generator
        let rng = prand.mersenne(this.seed);

        // get seeds for elevation and moisture noise from the rng
        let elevationSeed, moistureSeed;
        [elevationSeed, rng] = rng.next();
        [moistureSeed, rng] = rng.next();

        // create elevation and moisture noise functions
        this.elevationNoise = makeNoise2D(elevationSeed);
        this.moistureNoise = makeNoise2D(moistureSeed);
    }

    // generate 
    generate(): void {
        this.elevation = create2DArray(this.resolution, this.resolution);
        this.moisture = create2DArray(this.resolution, this.resolution);

        for (let x = 0; x < this.resolution; x++) {
            for (let y = 0; y < this.resolution; y++) {
                this.elevation[x][y] = this.getElevation(x, y);
                this.moisture[x][y] = this.getMoisture(x, y);
            }
        }
    }

    getElevation(x: number, y: number): number {
        let elevation = 0;

        const nx = x / this.resolution;
        const ny = y / this.resolution;

        elevation += 1 * noise(nx, ny, this.elevationNoise, 1 * this.baseFrequency, this.noiseMin, this.noiseMax);
        elevation += 0.5 * noise(nx, ny, this.elevationNoise, 2 * this.baseFrequency, this.noiseMin, this.noiseMax);
        elevation += 0.25 * noise(nx, ny, this.elevationNoise, 4 * this.baseFrequency, this.noiseMin, this.noiseMax);

        elevation /= (1 + 0.5 + 0.25);

        elevation = Math.pow(elevation, this.elevationExponent);

        return elevation;
    }

    getMoisture(x: number, y: number): number {
        let moisture = 0;

        const nx = x / this.resolution;
        const ny = y / this.resolution;

        moisture += 1 * noise(nx, ny, this.moistureNoise, 1 * this.baseFrequency, this.noiseMin, this.noiseMax);
        moisture += 0.5 * noise(nx, ny, this.moistureNoise, 2 * this.baseFrequency, this.noiseMin, this.noiseMax);
        moisture += 0.25 * noise(nx, ny, this.moistureNoise, 4 * this.baseFrequency, this.noiseMin, this.noiseMax);

        moisture /= (1 + 0.5 + 0.25);

        moisture = Math.pow(moisture, this.moistureExponent);

        return moisture;
    }

    getBiome(x: number, y: number): Biome {
        const elevation = this.elevation[x][y];
        const moisture = this.moisture[x][y];

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
}
