import { World } from "./world";

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export class ThreeScene {
    // container div
    container: HTMLElement;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    light: THREE.DirectionalLight;

    // camera settings
    fov = 60;
    aspect: number;
    near: 0.01;
    far: 1000;

    loadManager: THREE.LoadingManager;
    loader: THREE.TextureLoader;
    woodMaterial: THREE.MeshBasicMaterial;

    backgroundColor = 0x87ceeb;

    constructor(public world: World) {
        this.loadManager = new THREE.LoadingManager();
        this.loader = new THREE.TextureLoader(this.loadManager);
        this.woodMaterial = new THREE.MeshBasicMaterial({ map: this.loader.load('https://threejsfundamentals.org/threejs/lessons/resources/images/compressed-but-large-wood-texture.jpg') });

        this.container = document.querySelector("#container");

        this.aspect = window.innerWidth / window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        this.camera.position.set(1, 1, 0);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.backgroundColor);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.container.appendChild(this.renderer.domElement);

        this.createHeightmap();

        this.setLight();

        this.createBox();
    }

    setLight(): void {
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.castShadow = true;

        this.light.shadow.camera.left = -1;
        this.light.shadow.camera.right = 1;
        this.light.shadow.camera.top = 1;
        this.light.shadow.camera.bottom = -1;
        this.light.shadow.camera.near = 0;
        this.light.shadow.camera.far = 2 * Math.sqrt(3);

        this.light.shadow.mapSize.width = 4096;
        this.light.shadow.mapSize.height = 4096;

        this.light.position.set(1, 1, 1);
        this.scene.add(this.light);

        // this.scene.add(new THREE.AxesHelper(300));
        // this.scene.add(new THREE.CameraHelper(this.light.shadow.camera));
        // this.scene.add(new THREE.DirectionalLightHelper(this.light, 2));
    }

    createHeightmap(): void {
        let plane = new THREE.PlaneBufferGeometry(1, 1, this.world.resolution - 1, this.world.resolution - 1);
        let position = plane.attributes.position;

        let colors = [];

        for (let z = 0; z < this.world.resolution; z++) {
            for (let x = 0; x < this.world.resolution; x++) {
                const i = (z * this.world.resolution) + x;
                const elevation = this.world.elevation[x][z];
                const height = (elevation / this.world.baseFrequency);
                position.setZ(i, height);

                const biome = this.world.getBiome(x, z);

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

        basicMesh.name = "terrain";
        shadowMesh.name = "terrain";

        this.scene.add(basicMesh);
        this.scene.add(shadowMesh);
    }

    createBox(height = 0.14, size = 1, depth = 0.005): void {
        let boxGeometry: THREE.BoxGeometry;
        let boxMesh: THREE.Mesh;

        boxGeometry = new THREE.BoxGeometry(size, depth, size);
        boxMesh = new THREE.Mesh(boxGeometry, this.woodMaterial);
        boxMesh.translateY(-(depth / 2) - 0.001);
        boxMesh.name = "box";
        this.scene.add(boxMesh);

        boxGeometry = new THREE.BoxGeometry(depth, height + depth, size + depth);
        boxMesh = new THREE.Mesh(boxGeometry, this.woodMaterial);
        boxMesh.translateX((size / 2) + (depth / 2));
        boxMesh.translateY((height / 2) - (depth / 2));
        boxMesh.translateZ(depth / 2);
        boxMesh.name = "box";
        this.scene.add(boxMesh);

        boxGeometry = new THREE.BoxGeometry(depth, height + depth, size + depth);
        boxMesh = new THREE.Mesh(boxGeometry, this.woodMaterial);
        boxMesh.translateX(-(size / 2) + -(depth / 2));
        boxMesh.translateY((height / 2) - (depth / 2));
        boxMesh.translateZ(-depth / 2);
        boxMesh.name = "box";
        this.scene.add(boxMesh);

        boxGeometry = new THREE.BoxGeometry(size + depth, height + depth, depth);
        boxMesh = new THREE.Mesh(boxGeometry, this.woodMaterial);
        boxMesh.translateX(-depth / 2);
        boxMesh.translateY((height / 2) - (depth / 2));
        boxMesh.translateZ((size / 2) + (depth / 2));
        boxMesh.name = "box";
        this.scene.add(boxMesh);

        boxGeometry = new THREE.BoxGeometry(size + depth, height + depth, depth);
        boxMesh = new THREE.Mesh(boxGeometry, this.woodMaterial);
        boxMesh.translateX(depth / 2);
        boxMesh.translateY((height / 2) - (depth / 2));
        boxMesh.translateZ(-(size / 2) + -(depth / 2));
        boxMesh.name = "box";
        this.scene.add(boxMesh);
    }

    removesMeshesWithName(name: string): void {
        let object = (<THREE.Mesh>this.scene.getObjectByName(name));
        while (object) {
            object.geometry.dispose();
            (<THREE.Material>object.material).dispose();
            this.scene.remove(object);
            object = (<THREE.Mesh>this.scene.getObjectByName(name));
        }
        this.renderer.renderLists.dispose();
    }
}
