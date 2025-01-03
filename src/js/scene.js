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
import LoaderManager from '@/js/managers/LoaderManager'
import GUI from 'lil-gui'
import { Camera } from './components/three/camera'
import { Light } from './components/three/lights'
import { AddLabels } from './components/three/AddLabels'
import { AddLines } from './components/three/AddLines'
import Roboto_Regular from '../assets/gentilis_regular.typeface.json'
import Right_Femur from '../assets/Right_Femur.stl'
import Right_Tibia from '../assets/Right_Tibia.stl'


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
  loadingScreen

  constructor() {
    this.canvas = document.querySelector('.scene')
    this.loadingScreen = document.getElementById('loading-screen')
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.init();
  }

  init = async () => {
    // Show loading screen
    this.loadingScreen.style.display = 'flex';

    // Preload assets before initiating the scene
    const assets = [
      {
        name: 'femur',
        stl: Right_Femur,
      },
      {
        name: 'tibia',
        stl: Right_Tibia,
      },
      // {
      //   name: 'Roboto_Regular',
      //   font: Roboto_Regular
      // }
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

    // Hide loading screen after models are loaded
    this.loadingScreen.style.opacity = '1';
    setTimeout(() => {
      this.loadingScreen.style.transition = 'opacity 0.5s';
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        this.loadingScreen.style.display = 'none'; // Remove from view
      }, 500);
    }, 100); // Delay to allow for loading screen to show
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
    this.femur.renderOrder = 5;
    this.tibia = new Mesh(tibiaGeometry, tibiaMaterial);
    this.tibia.renderOrder = 5;

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

    this.landmarks = this.labels.sphereControls;
    this.lines = new AddLines(this.scene, this.landmarks)
  }

  setAxesHelper() {
    const axesHelper = new AxesHelper(3)
    // this.scene.add(axesHelper)
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
