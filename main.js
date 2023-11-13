// Importe und Initialisierungen
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let modelLoader = new GLTFLoader();
let container, controls, camera, scene, renderer, light, background, id, teapot_material, teapot_shader, sphere, shaderMaterial;

import vertShader from "./shader/vertexShader.js";
import fragShader from "./shader/fragmentShader.js";

var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load('./model/textures/stone_brick_wall_001_diff_4k.jpg');

// Ruft die Init Methode auf, so dass sie als erstes gestartet wird.
init();

async function init() {
  // Container div wird angehängt.
  container = document.createElement("div");
  document.body.appendChild(container);

  // Erstellt Three.js Szene.
  scene = new THREE.Scene();

  // Erstellt eine Perspective Kamera mit einem leicht schrägen Winkel auf das Model.
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
  camera.position.set(3, 3, 3);

  // Erstellt ein Point Light, um eine schöne Schattierung auf dem Model zu erstellen, aktiviert Schatten und stellt die Auflösung der Shadowmap ein.
  light = new THREE.PointLight( 0xffffff, 10, 100 );
  light.position.set( 10, 10, 1 );
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;   
  scene.add( light );

  // Renderer
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  // OrbitControls und der Punkt um den die Controls rotieren und anschauen.
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set(0, 2, 0);

  // Beim Verändern des Fensters wird der Inhalt angepasst.
  window.addEventListener( 'resize', onWindowResize );
  
  // Lädt die Welt und Models.
  await createEnvironment();

  // Eine id wird zum Wechseln der Modelle benutzt und Model 0 direkt beim Starten angezeigt.
  id = 0;
  switchModels();

  // Die Buttons rufen die Methode zum Wechseln der Modelle auf.
  document.getElementById("left_button").addEventListener("click", () => {id--; switchModels(); });
  document.getElementById("right_button").addEventListener("click", () => {id++; switchModels(); });
  
  // Startet den loop.
  render();
}

// Fensteranpassung
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Render loop
function render() {
    if (shaderMaterial) {
        shaderMaterial.uniforms.uTime.value += 0.01; // Adjust the speed of the animation as needed
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

// Funktion zum Wechseln der Modelle. Zuerst werden alle Modelle von der Szene entfernt, also die Szene wird gecleared um anschließend das Model mit der hereingegebenen id anzuzeigen.
function switchModels() {
    // Szene wird geleert.
    scene.remove(teapot_material);
    scene.remove(teapot_shader);
    scene.remove(sphere);

    // Wechselt zwischen den ids, bei einem Klick der Buttons. Sobald er am Ende ist wird er wieder an den Anfang gesetzt und andersrum, um eine Endlosschleife zu simulieren.
    if (id == -1) {
        id = 2
    } else if (id == 3) {
        id = 0
    }

    // Switchcase zum Auswählen des Models mit der ids.
    switch (id) {
        case 0:
            createTeapot_material();
            break;
        case 1:
            createTeapot_shader();
            break;
        case 2:
            createSphere();
            break;
        default:
            break;
    }

}

// Umgebung wird geladen.
async function createEnvironment() {
    // Lädt die Skybox mit den einzelnen CubeTexture Positionen und setzt sie als Hintergrund der Szene.
    const loader = new THREE.CubeTextureLoader();
    texture = loader.load([
        "./skybox/posx.jpg",
        "./skybox/negx.jpg",
        "./skybox/posy.jpg",
        "./skybox/negy.jpg",
        "./skybox/posz.jpg",
        "./skybox/negz.jpg",
    ]);
    scene.background = texture;
    background = texture;


    // Erstellt das Plateu auf dem das Model schwebt und Schatten wirft. Kann keine Schatten werfen, aber auf dem Plateu können Schatten geworfen werden.
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
}

// Utah Teapot mit Material wird geladen.
async function createTeapot_material() {
    // Teekanne wird geladen und sie (bzw. ihre Kinder) kann Schatten werfen.
    teapot_material = new THREE.Object3D();
    modelLoader.load('./model/utah_teapot.glb', function (gltf) {
        teapot_material = gltf.scene;
        teapot_material.name = "teapot_material";
        teapot_material.translateY(teapot_material.scale.x * 1.5);
        teapot_material.scale.set(0.5, 0.5, 0.5);

        // Schattenwurf
        teapot_material.traverse( function( node ) {
            if ( node.isMesh ) { node.castShadow = true; }
        } );

        // Erstellt ein Glasmaterial: 
        // Bläuliche glasähnliche Farbe wird gesetzt.
        // Transparenz und Stärke wird aktiviert, damit man durchschauen kann, wie bei Glas. Opacity gibt Stärke an.
        // Metallness und Roughness werden gesetzt um das Glas ein wenig dunkler und nicht einfach transparent erscheinen zu lassen.
        // Das Hintergrundbild wird als Environment Map genommen mit voller Intensität, um Spiegeln vorzutäuschen.
        teapot_material.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshPhysicalMaterial({
                color: 0x98B4D4,
                transparent: true,
                opacity: 0.8,
                metalness: 1.0,
                roughness: 0,
                envMapIntensity: 1.0,
                envMap: background
              });
            }
          });

        scene.add(teapot_material);
    }, undefined, function (error) {
      console.error(error);
    })
}

// Utah Teapot mit Shader wird geladen.
async function createTeapot_shader() {

    // Shader und Uniforms
    // Der Fragment Shader wechselt die Farben durch.
    // Der Vertex Shader verschiebt die einzelnen Vertices mit der uAmplitude mithilfe einer Sinuskurve vor und zurück.
    shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uAmplitude: { value: 0.1 },
        },
        vertexShader: vertShader,
        fragmentShader: fragShader,
        });

    // Teekanne wird geladen und sie (bzw. ihre Kinder) kann Schatten werfen.
    teapot_shader = new THREE.Object3D();
    modelLoader.load('./model/utah_teapot.glb', function (gltf) {
        teapot_shader = gltf.scene;
        teapot_shader.name = "teapot_shader";
        teapot_shader.translateY(teapot_shader.scale.x * 1.5);
        teapot_shader.scale.set(0.5, 0.5, 0.5);
        teapot_shader.rotation.y = 180;

        // Schattenwurf
        teapot_shader.traverse( function( node ) {
            if ( node.isMesh ) { node.castShadow = true; }
        } );

        // Shadermaterial anwenden
        teapot_shader.children[0].material = shaderMaterial;

        scene.add(teapot_shader);
    }, undefined, function (error) {
      console.error(error);
    })

}

// Sphere mit Textur wird geladen.
async function createSphere() {
    // Die Kugel mit der Texture wird geladen und sie (bzw. ihre Kinder) kann Schatten werfen.
    sphere = new THREE.Object3D();
    modelLoader.load('./model/stone_brick_wall_001_4k.gltf', function (gltf) {
        sphere = gltf.scene;
        sphere.name = "sphere";
        sphere.translateY(sphere.scale.x * 2);

        //Schattenwurf
        sphere.traverse( function( node ) {
            if ( node.isMesh ) { node.castShadow = true; }
        } );

        scene.add(sphere);
    }, undefined, function (error) {
      console.error(error);
    })
}
