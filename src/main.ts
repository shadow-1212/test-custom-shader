import * as THREE from 'three'
import { renderer, scene } from './core/renderer'
import { fpsGraph, gui } from './core/gui'
import camera from './core/camera'
import { controls } from './core/orbit-control'

import './style.css'

// Shaders
import vertexShader from '/@/shaders/vertex.glsl'
import fragmentShader from '/@/shaders/fragment.glsl'
import fragCustom from '/@/shaders/fragCustom.glsl'
//cloudy shaders
import cloudyVertexShader from '/@/shaders/cloudyVertexShader.glsl'
import cloudyFragmentShader from '/@/shaders/cloudyFragmentShader.glsl'

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, 2.25)

scene.add(directionalLight)

// shadermatrielColor
const shaderProps= {
  color: '#ff0000',
}
// custom shader
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  wireframe: false,
  side: THREE.DoubleSide,
  uniforms: {
    uFrequency: { value: new THREE.Vector2(20, 0.2) },
    uAmplitude: { value:  new THREE.Vector2(0.3, 0.1) },
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color(shaderProps.color) },
  }
});

const testShader= new THREE.ShaderMaterial({
  vertexShader: `
      void main() {
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
      }
  `,
  fragmentShader: fragCustom,
  side: THREE.DoubleSide,
})

// Create the custom shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * modelViewPosition;
                }
            `,
  fragmentShader: `
                uniform vec2 resolution;
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vec2 position = -1.0 + 2.0 * vUv;
                    float r = length(position);
                    float angle = atan(position.y, position.x);
                    vec3 color = vec3(sin(r * 10.0 + time * 5.0), cos(angle * 5.0), sin(angle * 3.0));
                    gl_FragColor = vec4(color, 1.0);
                }
            `
});

const sphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uFrequency: { value: new THREE.Vector2(20, 15) },
  },
  vertexShader,
  fragmentShader,
})


const cloudyMaterial = new THREE.ShaderMaterial({
  vertexShader:cloudyVertexShader,
  fragmentShader:cloudyFragmentShader,
  side: THREE.DoubleSide,
})

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  // sphereMaterial,
  shaderMaterial,
)


sphere.position.set(0, 2, 0)
sphere.castShadow = true
scene.add(sphere)

const DirectionalLightFolder = gui.addFolder({
  title: 'Directional Light',
})

Object.keys(directionalLight.position).forEach(key => {
  DirectionalLightFolder.addInput(
    directionalLight.position,
    key as keyof THREE.Vector3,
    {
      min: -100,
      max: 100,
      step: 1,
    },
  )
})

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 50, 50),
  // new THREE.MeshToonMaterial({ color: '#444' }), /*we gonna use custom shader*/
  // shaderMaterial,
  cloudyMaterial,
)

plane.rotation.set(-Math.PI / 2, 0, 0)
plane.receiveShadow = true
scene.add(plane)

 // add some gui controls
//create a folder for X
const folderX= gui.addFolder({title: 'X', expanded: true})
// gui for the frequency X of the shaderMaterial
folderX.addInput(shaderMaterial.uniforms.uFrequency.value, 'x', {label:'Frequency',min: 0, max: 20, step: 0.1})
// gui for the amplitude X of the shaderMaterial
folderX.addInput(shaderMaterial.uniforms.uAmplitude.value, 'x', {label: 'Amplitude', min: 0, max: 5, step: 0.01})
// disable or enable wireframe of the shaderMaterial
gui.addInput(shaderMaterial, 'wireframe', {label: 'Wireframe'})

//create a folder for Y
const folderY= gui.addFolder({title: 'Y', expanded: true})
// gui for the frequency Y of the shaderMaterial
folderY.addInput(shaderMaterial.uniforms.uFrequency.value, 'y', {label:'Frequency',min: 0, max: 20, step: 0.1})
// hui for the amplitude Y of the shaderMaterial
folderY.addInput(shaderMaterial.uniforms.uAmplitude.value, 'y', {label: 'Amplitude', min: 0, max: 5, step: 0.01})



//gui to change the shaderProps.color to change to shaderMaterial.uColor
gui.addInput(shaderProps, 'color', {label: 'Color'}).on('change', (ev) => {
  shaderMaterial.uniforms.uColor.value = new THREE.Color(ev.value)
})

//get elapsed time
const clock = new THREE.Clock()
const loop = () => {
  const elapsedTime = clock.getElapsedTime()
  // update shaderMaterial uTime using elapsed time
  shaderMaterial.uniforms.uTime.value = elapsedTime
  sphereMaterial.uniforms.uTime.value = elapsedTime

  fpsGraph.begin()

  controls.update()
  renderer.render(scene, camera)

  fpsGraph.end()
  requestAnimationFrame(loop)
}

loop()
