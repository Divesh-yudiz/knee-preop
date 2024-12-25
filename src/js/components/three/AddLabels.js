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
    activeLandmark = null; // Track the currently active landmark

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

        this.getLabels();
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
        console.log("points::", intersects)

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const point = intersection.point;
            // Check if a landmark button is clicked
            const clickedLandmark = this.getClickedLandmark(event);
            console.log("points", clickedLandmark)
            if (clickedLandmark) {
                this.activateLandmark(clickedLandmark);
                return; // Exit after activating the landmark
            }

            // Create landmark if an active landmark is set
            if (this.activeLandmark) {
                this.createSphere(point, intersection.face.normal);
            }
        }
    }

    getClickedLandmark(event) {
        // Logic to determine if a landmark button was clicked
        // This function should return the name of the landmark if clicked
        const landmarks = [
            'femur-center', 'hip-center', 'femur-proximal',
            'femur-distal', 'medial-epicondyle', 'lateral-epicondyle',
            'Distal-Medial-pt', 'Distal-Lateral-pt',
            'Posterior-Medial-pt', 'Posterior-Lateral-pt'
        ];

        for (const landmark of landmarks) {
            const button = document.getElementById(landmark);
            if (button && button.contains(event.target)) {
                return landmark; // Return the clicked landmark
            }
        }
        return null; // No landmark clicked
    }

    activateLandmark(landmark) {
        // Check if the landmark is already active
        if (this.activeLandmark === landmark) {
            this.deactivateLandmark(landmark); // Toggle off if already active
            return;
        }

        // Deactivate the previous landmark if any
        if (this.activeLandmark) {
            this.deactivateLandmark(this.activeLandmark);
        }

        // Activate the new landmark
        this.activeLandmark = landmark;

        // Change button color to blue (active)
        const activeButton = document.getElementById(landmark);
        if (activeButton) {
            activeButton.parentElement.style.color = 'blue'; // Change label color to blue
        }
    }

    deactivateLandmark(landmark) {
        // Logic to change the button color back to light gray (inactive)
        const inactiveButton = document.getElementById(landmark);
        if (inactiveButton) {
            inactiveButton.parentElement.style.color = 'lightgray'; // Change label color to light gray
        }
        this.activeLandmark = null; // Clear the active landmark
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

            // Ensure translation control is only active if a landmark is created
            if (this.activeLandmark) {
                transformControl.attach(sphere);
            }

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

    getLabels = () => {
        // Get checkbox elements
        const femurCenterCheckbox = document.getElementById('femur-center-checkbox');
        const hipCenterCheckbox = document.getElementById('hip-center-checkbox');
        const femurProximalCheckbox = document.getElementById('femur-proximal-checkbox');
        const femurDistalCheckbox = document.getElementById('femur-distal-checkbox');
        const medialEpicondyleCheckbox = document.getElementById('medial-epicondyle-checkbox');
        const lateralEpicondyleCheckbox = document.getElementById('lateral-epicondyle-checkbox');
        const distalMedialPtCheckbox = document.getElementById('Distal-Medial-pt-checkbox');
        const distalLateralPtCheckbox = document.getElementById('Distal-Lateral-pt-checkbox');
        const posteriorMedialPtCheckbox = document.getElementById('Posterior-Medial-pt-checkbox');
        const posteriorLateralPtCheckbox = document.getElementById('Posterior-Lateral-pt-checkbox');

        // Set labels based on checkbox states, ensuring the checkbox exists
        this.femurCenter = femurCenterCheckbox?.checked ? document.getElementById('femur-center') : null;
        this.hipCenter = hipCenterCheckbox?.checked ? document.getElementById('hip-center') : null;
        this.femurProximal = femurProximalCheckbox?.checked ? document.getElementById('femur-proximal') : null;
        this.femurDistal = femurDistalCheckbox?.checked ? document.getElementById('femur-distal') : null;
        this.medialEpicondyle = medialEpicondyleCheckbox?.checked ? document.getElementById('medial-epicondyle') : null;
        this.lateralEpicondyle = lateralEpicondyleCheckbox?.checked ? document.getElementById('lateral-epicondyle') : null;
        this.DistalMedialPt = distalMedialPtCheckbox?.checked ? document.getElementById('Distal-Medial-pt') : null;
        this.DistalLateralPt = distalLateralPtCheckbox?.checked ? document.getElementById('Distal-Lateral-pt') : null;
        this.PosteriorMedialPt = posteriorMedialPtCheckbox?.checked ? document.getElementById('Posterior-Medial-pt') : null;
        this.PosteriorLateralPt = posteriorLateralPtCheckbox?.checked ? document.getElementById('Posterior-Lateral-pt') : null;
    }
}