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

        // Add checkbox change listeners
        const checkboxes = document.querySelectorAll('[id$="-checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                console.log(`${checkbox.id} changed to:`, checkbox.checked);
                this.getLabels();
            });
        });
    }

    init = () => {
        window.addEventListener('mousemove', this.boundMouseMove);
        window.addEventListener('click', this.boundClick);

        // Add radio button change listeners
        const radioButtons = document.querySelectorAll('.control-group input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                console.log(`${radio.id} changed to:`, radio.checked);
                this.getLabels();
                // If the radio button is checked, set it as the active landmark
                if (radio.checked) {
                    const landmarkId = radio.id.replace('-checkbox', ''); // Remove -checkbox suffix if present
                    this.activateLandmark(landmarkId);
                }
            });
        });
    }

    onMouseMove = (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick = (event) => {
        const clickedLandmark = this.getClickedLandmark(event);
        if (clickedLandmark) {
            const checkbox = document.getElementById(`${clickedLandmark}-checkbox`);
            if (checkbox && checkbox.checked) {
                this.activateLandmark(clickedLandmark);
                // Show gizmo if sphere exists
                if (this.sphereControls.has(clickedLandmark)) {
                    const controlData = this.sphereControls.get(clickedLandmark);
                    controlData.control.visible = true;
                    controlData.control.enabled = true;
                }
                return;
            }
        }

        // Only create new sphere if we have an active landmark and clicked on the model
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.femur, this.tibia]);
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
                const sphere = this.createSphere(point, intersection.face.normal);
                if (sphere) {
                    this.sphereControls.set(this.activeLandmark, {
                        sphere,
                        control: this.transformControls[this.transformControls.length - 1]
                    });
                }
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
        // Deactivate previous landmark controls
        if (this.activeLandmark && this.sphereControls.has(this.activeLandmark)) {
            const prevControl = this.sphereControls.get(this.activeLandmark);
            prevControl.control.visible = false;
            prevControl.control.enabled = false;
        }

        // Check if the landmark is already active
        if (this.activeLandmark === landmark) {
            this.deactivateLandmark(landmark);
            return;
        }

        // Activate the new landmark
        this.activeLandmark = landmark;

        // Show controls if sphere exists for this landmark
        if (this.sphereControls.has(landmark)) {
            const controlData = this.sphereControls.get(landmark);
            controlData.control.visible = true;
            controlData.control.enabled = true;
        }

        // Update visual feedback
        const activeButton = document.getElementById(landmark);
        if (activeButton) {
            activeButton.style.borderColor = '#000';
            activeButton.parentElement.style.color = '#000';
        }
    }

    deactivateLandmark(landmark) {
        // Change the button and label color back to light gray (inactive)
        const inactiveButton = document.getElementById(landmark);
        if (inactiveButton) {
            inactiveButton.style.borderColor = '#808080'; // Change radio button border to gray
            inactiveButton.parentElement.style.color = '#808080'; // Change label color to gray
        }
        // Don't hide the sphere when deactivating landmark
        this.activeLandmark = null;
    }

    createSphere = (position, normal) => {
        try {
            // Create a group first
            console.log("sphere")
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
        this.sphereControls.clear();
    }

    getLabels = () => {
        // Store boolean values indicating whether each landmark is checked
        this.landmarks = {
            'femur-center': document.getElementById('femur-center')?.checked || false,
            'hip-center': document.getElementById('hip-center')?.checked || false,
            'femur-proximal': document.getElementById('femur-proximal')?.checked || false,
            'femur-distal': document.getElementById('femur-distal')?.checked || false,
            'medial-epicondyle': document.getElementById('medial-epicondyle')?.checked || false,
            'lateral-epicondyle': document.getElementById('lateral-epicondyle')?.checked || false,
            'Distal-Medial-pt': document.getElementById('Distal-Medial-pt')?.checked || false,
            'Distal-Lateral-pt': document.getElementById('Distal-Lateral-pt')?.checked || false,
            'Posterior-Medial-pt': document.getElementById('Posterior-Medial-pt')?.checked || false,
            'Posterior-Lateral-pt': document.getElementById('Posterior-Lateral-pt')?.checked || false
        };
    }

    toggleSphereControl = (landmarkId) => {
        const controlData = this.sphereControls.get(landmarkId);
        if (controlData) {
            const { control } = controlData;
            control.control.enabled = !control.control.enabled;
            control.control.visible = control.control.enabled;
        }
    }
}