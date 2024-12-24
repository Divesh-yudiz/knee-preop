import { MeshBasicMaterial, Quaternion, Vector3, Mesh, Texture, Raycaster, Scene } from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

export class AddLabels {
    camera
    raycaster
    mouse
    femur
    tibia
    scene

    constructor(camera, raycaster, mouse, femur, tibia, scene = new Scene()) {
        this.camera = camera;
        this.raycaster = raycaster;
        this.mouse = mouse;
        this.femur = femur;
        this.tibia = tibia;
        this.scene = scene;
        this.init();
    }

    init = () => {
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
    }

    onMouseMove = (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick = (event) => {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects([this.femur, this.tibia]);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            const point = intersects[0].point;
            const normal = intersects[0].face.normal;

            console.log('Clicked on:', intersectedObject === this.femur ? 'Femur' : 'Tibia');

            this.createDecal(point, normal, intersectedObject === this.femur ? 'Femur' : 'Tibia');
        }
    }

    createDecal = (position, normal, text) => {
        const decalMaterial = new MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.8 });
        const decalGeometry = new DecalGeometry(this.femur, position, new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal), new Vector3(1, 1, 1));

        const decalMesh = new Mesh(decalGeometry, decalMaterial);
        decalMesh.lookAt(normal);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(255, 255, 255, 1)';
        context.fillRect(0, 0, 256, 64);
        context.fillStyle = 'black';
        context.font = 'bold 24px Arial';
        context.fillText(text, 10, 30);

        const texture = new Texture(canvas);
        texture.needsUpdate = true;
        decalMaterial.map = texture;
        this.scene.add(decalMesh);
    }

    getScreenPosition = (position) => {
        const vector = position.project(this.camera);
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = -(vector.y * .5 + .5) * window.innerHeight;
        return { x, y };
    }
}