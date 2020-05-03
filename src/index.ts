import { World } from "./world";
import { ThreeScene } from "./3D";

import * as THREE from 'three';


$(function () {
    $("[rel='tooltip']").tooltip();
})

const world = new World(512, 0);
const scene = new ThreeScene(world);

window.addEventListener("resize", onWindowResize, false);

animate();

function onWindowResize(): void {
    scene.camera.aspect = window.innerWidth / window.innerHeight;
    scene.camera.updateProjectionMatrix();

    scene.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(): void {
    requestAnimationFrame(animate);

    render();
}

function render(): void {
    scene.camera.lookAt(scene.scene.position);

    scene.renderer.render(scene.scene, scene.camera);
}

const shadowCheckbox: HTMLInputElement = document.querySelector("#shadowsCheck");
shadowCheckbox.onchange = function () {
    console.log(shadowCheckbox.checked);
    scene.light.castShadow = shadowCheckbox.checked;
}

const boxCheckbox: HTMLInputElement = document.querySelector("#boxCheck");
boxCheckbox.onchange = function () {
    if (boxCheckbox.checked) {
        scene.createBox();
    }
    else {
        scene.removesMeshesWithName("box");
    }
}

const seedInput: HTMLInputElement = document.querySelector("#seedInput");

const generateButton: HTMLButtonElement = document.querySelector("#generateButton");

const resolutionSelect: HTMLSelectElement = document.querySelector("#resolutionSelect");

const form: HTMLFormElement = document.querySelector("#controlsForm");
form.onsubmit = function () {
    world.setSeed(parseInt(seedInput.value));
    world.resolution = parseInt(resolutionSelect.value);
    world.generate();
    scene.removesMeshesWithName("terrain");
    scene.createHeightmap();
    return false;
}
