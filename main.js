import * as THREE from 'three';
import './style.css';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import gsap from "gsap"
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll();

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 7;

const canvas = document.querySelector("#draw");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// POSTPROCESSING SETUP
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.001; // You can tweak this value
composer.addPass(rgbShiftPass);

// Add OrbitControls to allow orbit interaction with the scene
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.1;
// controls.screenSpacePanning = false;
// controls.minDistance = 2;
// controls.maxDistance = 10;
// controls.maxPolarAngle = Math.PI / 2;

// Add some lights for the GLTF model
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);


// === Add HDRI environment as the scene background and environment ===
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const hdriPath = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr'; // provide your HDRI in the public folder under this name
let model;
new RGBELoader()
    .setDataType(THREE.FloatType)
    .load(
        hdriPath,
        (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            // scene.background = envMap;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        },
        undefined,
        (error) => {
            console.warn("Could not load HDRI:", error);
        }
    );

// Load the GLTF model properly
const loader = new GLTFLoader();
loader.load(
    '/DamagedHelmet.gltf',
    (gltf) => {
        model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(2, 2, 2);
        scene.add(model);
    },
    (xhr) => {
        // Optionally log loading progress
        // console.log(`Model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
        console.error('An error happened loading the GLTF model:', error);
    }
);
window.addEventListener("mousemove",(e) =>{
    if(model){
        const rotationX =(e.clientX/window.innerWidth  - .5) * ( Math.PI*0.5);
        const rotationY =(e.clientY/window.innerHeight- .5) *( Math.PI*0.5);
        gsap.to(model.rotation, { 
            x: rotationY,
            y: rotationX,
            duration: 0.9,
            ease: "power2.out"
        });
    }
})
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    window.requestAnimationFrame(animate);

    composer.render();
}
animate();