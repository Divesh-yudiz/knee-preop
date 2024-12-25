import { MeshBasicMaterial, Matrix3, Mesh, SphereGeometry, Group } from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class AddLabels {
    camera
    raycaster
    mouse
    femur
    tibia
    scene
    renderer
    orbitControls
    transformControls

    constructor(camera, raycaster, mouse, femur, tibia, scene, renderer, controls) {
        this.camera = camera;
        this.raycaster = raycaster;
        this.mouse = mouse;
        this.femur = femur;
        this.tibia = tibia;
        this.scene = scene;
        this.renderer = renderer;
        this.orbitControls = controls;
        this.transformControls = [];
        if (!this.orbitControls) {
            console.warn('OrbitControls not provided to AddLabels');
        }
        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundClick = this.onClick.bind(this);

        this.init();
    }

    init = () => {
        window.addEventListener('mousemove', this.boundMouseMove);
        window.addEventListener('click', this.boundClick);
    }

    onMouseMove = (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick = (event) => {
        // Add keyboard event listener for mode switching
        window.addEventListener('keydown', (event) => {
            const control = this.transformControls[this.transformControls.length - 1]?.control;
            if (!control) return;

            switch (event.key) {
                case 'w':
                    control.setMode('translate');
                    break;
                case 'e':
                    control.setMode('rotate');
                    break;
                case 'r':
                    control.setMode('scale');
                    break;
                case '+':
                case '=':
                    control.setSize(control.size + 0.1);
                    break;
                case '-':
                case '_':
                    control.setSize(Math.max(control.size - 0.1, 0.1));
                    break;
                case ' ':
                    control.enabled = !control.enabled;
                    break;
                case 'Escape':
                    control.reset();
                    break;
            }
        });

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.femur, this.tibia]);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const point = intersection.point;
            const normal = intersection.face.normal;

            // Create a helper position for normal visualization
            const normalMatrix = new Matrix3().getNormalMatrix(intersection.object.matrixWorld);
            const worldNormal = normal.clone().applyNormalMatrix(normalMatrix);

            console.log('Clicked on:', intersection.object === this.femur ? 'Femur' : 'Tibia');
            this.createSphere(point, worldNormal);
        }
    }

    createSphere = (position, normal) => {
        try {
            // Create a group first
            const group = new Group();
            this.scene.add(group);

            // Create and add sphere to the group
            const sphereGeometry = new SphereGeometry(0.01, 32, 32);
            const sphereMaterial = new MeshBasicMaterial({
                color: 0xff00ff,
                depthTest: false,
                transparent: true,
                opacity: 0.8
            });
            const sphere = new Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(position);
            sphere.renderOrder = 999;
            sphere.material.needsUpdate = true;
            group.add(sphere);

            // Enhanced transform control setup
            const transformControl = new TransformControls(this.camera, this.renderer.domElement);
            transformControl.setMode('translate');
            transformControl.setSize(0.5);

            // Get the helper/gizmo and add it to the scene
            const gizmo = transformControl.getHelper();
            this.scene.add(gizmo);

            // Attach control to the sphere
            transformControl.attach(sphere);

            if (this.orbitControls) {
                transformControl.addEventListener('dragging-changed', (event) => {
                    this.orbitControls.enabled = !event.value;
                });
            }

            this.transformControls.push({ control: transformControl, object: sphere, group: group });

            return sphere;
        } catch (error) {
            console.error('Error in createSphere:', error);
            return null;
        }
    }

    getScreenPosition = (position) => {
        const vector = position.project(this.camera);
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = -(vector.y * .5 + .5) * window.innerHeight;
        return { x, y };
    }

    cleanup = () => {
        // Remove keyboard event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        window.removeEventListener('mousemove', this.boundMouseMove);
        window.removeEventListener('click', this.boundClick);

        this.transformControls.forEach(({ control, object, group }) => {
            control.detach(); // Detach before cleanup
            if (object) {
                object.geometry.dispose();
                object.material.dispose();
            }
            if (group) {
                this.scene.remove(group);
            }
            this.scene.remove(control); // Remove control from scene
        });
        this.transformControls = [];
    }
}