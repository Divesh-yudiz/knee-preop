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
    sphereControls = new Map(); // Maps landmark IDs to their sphere and control data

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

        // Add button click listeners for landmarks
        this.addLandmarkButtonListeners();
    }

    // New method to handle landmark button clicks
    addLandmarkButtonListeners() {
        const buttons = document.querySelectorAll('.landmark-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const landmarkId = button.id;
                console.log(`${landmarkId} button clicked`);
                this.toggleLandmark(landmarkId);
            });
        });
    }

    onMouseMove = (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick = (event) => {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.femur, this.tibia]);
        console.log("intesects", intersects)
        if (intersects.length > 0 && this.activeLandmark) {
            // Check if the active landmark is enabled
            if (!this.landmarks[this.activeLandmark]) {
                console.log('This landmark is not enabled');
                return;
            }

            const intersection = intersects[0];
            const point = intersection.point;
            console.log("point", point)
            // Create new sphere only if it doesn't exist
            if (!this.sphereControls.has(this.activeLandmark)) {
                this.createSphere(point, intersection.face.normal);
                // if (sphere) {
                //     this.sphereControls.set(this.activeLandmark, {
                //         sphere,
                //         control: this.transformControls[this.transformControls.length - 1]
                //     });
                //     console.log("transformcontrols ::", this.transformControls)
                // }
            }
        }
    }

    getClickedLandmark(event) {
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
        if (this.activeLandmark == landmark) {
            this.deactivateLandmark(landmark); // Call deactivate if already active
            return;
        }
        this.activeLandmark = landmark;
        if (this.sphereControls.has(landmark)) {
            const controlData = this.sphereControls.get(landmark);
            controlData.control.visible = true;
            controlData.control.enabled = true;
        }
        const activeButton = document.getElementById(landmark);
        if (activeButton) {
            activeButton.style.borderColor = '#000'; // Active color
            activeButton.parentElement.style.color = '#000'; // Active color
        }
    }

    deactivateLandmark(landmark) {
        // Change the button and label color back to light gray (inactive)
        const inactiveButton = document.getElementById(landmark);
        if (inactiveButton) {
            inactiveButton.style.borderColor = '#808080'; // Change radio button border to gray
            inactiveButton.parentElement.style.color = '#808080'; // Change label color to gray
        }

        // Detach the transform control for the active landmark
        if (this.sphereControls.has(landmark)) {
            const controlData = this.sphereControls.get(landmark);
            console.log("sphere controls ::", this.sphereControls);
            // Check if controlData is defined before logging
            if (controlData) {
                console.log('Retrieved control for landmark:', landmark, controlData); // Debugging log
                if (controlData.control instanceof TransformControls) {
                    controlData.control.detach(); // Detach the transform control
                } else {
                    console.warn('Control is not an instance of TransformControls');
                }
            } else {
                console.warn('Control data is undefined for landmark:', landmark);
            }
        }

        this.activeLandmark = null; // Reset active landmark
    }

    createSphere = (position, normal) => {
        const group = new Group();
        this.scene.add(group);
        // Create and add sphere to the group
        const sphereGeometry = new SphereGeometry(0.01, 32, 32);
        const sphereMaterial = new MeshBasicMaterial({
            color: 0xff00ff,
            opacity: 1
        });
        const sphere = new Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(position);
        sphere.renderOrder = 0;
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

        // Ensure transformControl is created before storing it
        if (transformControl) {
            // Store the control correctly in the sphereControls map
            this.sphereControls.set(this.activeLandmark, {
                sphere,
                control: transformControl // Ensure this is the TransformControls instance
            });
        } else {
            console.warn('TransformControl is undefined');
        }

        console.log("transform controls....:", transformControl)

        return sphere;
    }

    getScreenPosition = (position) => {
        const vector = position.project(this.camera);
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = -(vector.y * .5 + .5) * window.innerHeight;
        return { x, y };
    }

    cleanup = () => {
        console.log("cleanup calling ")
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
        this.sphereControls.clear();
    }

    getLabels = () => {
        // Remove the checkbox state checks
        this.landmarks = {
            'femur-center': true, // Assume all landmarks are enabled
            'hip-center': true,
            'femur-proximal': true,
            'femur-distal': true,
            'medial-epicondyle': true,
            'lateral-epicondyle': true,
            'Distal-Medial-pt': true,
            'Distal-Lateral-pt': true,
            'Posterior-Medial-pt': true,
            'Posterior-Lateral-pt': true
        };
    }

    toggleLandmark(landmarkId) {
        const button = document.getElementById(landmarkId);
        if (this.activeLandmark == landmarkId) {
            this.deactivateLandmark(landmarkId);
        } else {
            this.activateLandmark(landmarkId);
        }
        // Update button styles
        this.updateButtonStyles();
    }

    updateButtonStyles() {
        const buttons = document.querySelectorAll('.landmark-btn');
        buttons.forEach(button => {
            if (this.activeLandmark == button.id) {
                button.style.borderColor = '#000'; // Active color
                button.style.color = '#000'; // Active text color
            } else {
                button.style.borderColor = '#808080'; // Inactive color
                button.style.color = '#808080'; // Inactive text color
            }
        });
    }
}