import {
  Color,
  WebGLRenderer,
  Scene,
  AxesHelper,
  Raycaster,
  Vector2,
  Mesh,
  MeshStandardMaterial,
  Group,
  Box3,
  Vector3,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-js'
import LoaderManager from '@/js/managers/LoaderManager'
import GUI from 'lil-gui'
import { Camera } from './components/three/camera'
import { Light } from './components/three/lights'
import vertexShader from './glsl/main.vert'
import fragmentShader from './glsl/main.frag'
import gsap from 'gsap'
import { AddLabels } from './components/three/AddLabels'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';


export default class MainScene {
  canvas
  renderer
  scene
  camera
  controls
  stats
  width
  height
  scene1
  labels
  transformControl

  constructor() {
    this.canvas = document.querySelector('.scene')
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.init();
  }

  init = async () => {
    // Preload assets before initiating the scene
    const assets = [
      {
        name: 'femur',
        stl: './assets/Right_Femur.stl',
      },
      {
        name: 'tibia',
        stl: './assets/Right_Tibia.stl',
      }
    ]

    await LoaderManager.load(assets)
    this.setScene();
    this.camera = new Camera(this.scene);
    this.light = new Light(this.scene);
    this.setRender()
    this.setControls()

    this.setRaycaster()
    this.modelSetUp();
    this.setAxesHelper();
    this.handleResize()
    this.events()
  }

  setRender() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
  }

  setScene() {
    this.scene = new Scene();
    this.scene.background = new Color(0xffffff);
  }

  setControls() {
    this.controls = new OrbitControls(this.camera.camera, this.renderer.domElement)
  }

  modelSetUp() {
    // Get the loaded geometries
    const femurGeometry = LoaderManager.assets[`femur`].stl
    const tibiaGeometry = LoaderManager.assets[`tibia`].stl

    const femurMaterial = new MeshStandardMaterial({ color: 0xcccccc })
    const tibiaMaterial = new MeshStandardMaterial({ color: 0xcccccc })

    this.femur = new Mesh(femurGeometry, femurMaterial);
    this.femur.renderOrder = 1;
    this.tibia = new Mesh(tibiaGeometry, tibiaMaterial);
    this.tibia.renderOrder = 1;

    this.boneGroup = new Group();
    this.boneGroup.add(this.femur);
    this.boneGroup.add(this.tibia);
    this.boneGroup.scale.set(0.01, 0.01, 0.01);
    this.boneGroup.rotation.set(Math.PI * 1.5, 0, 0);
    const box = new Box3().setFromObject(this.boneGroup);
    const center = box.getCenter(new Vector3());
    this.boneGroup.position.sub(center);
    this.scene.add(this.boneGroup);

    this.labels = new AddLabels(
      this.camera.camera,
      this.raycaster,
      this.mouse,
      this.femur,
      this.tibia,
      this.scene,
      this.renderer,
      this.controls
    );
  }

  setAxesHelper() {
    const axesHelper = new AxesHelper(3)
    this.scene.add(axesHelper)
  }

  setGUI() {
    const gui = new GUI()
  }

  events() {
    window.addEventListener('resize', this.handleResize, { passive: true })
    this.draw(0)
  }

  draw = (time) => {
    this.renderer.render(this.scene, this.camera.camera)
    this.raf = window.requestAnimationFrame(this.draw)
  }

  handleResize = () => {
    this.width = window.innerWidth
    this.height = window.innerHeight

    // Update camera
    this.camera.camera.aspect = this.width / this.height
    this.camera.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  setRaycaster() {
    this.raycaster = new Raycaster()
    this.mouse = new Vector2()
  }
}
