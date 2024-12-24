
export class AddLabels {
    camera
    raycaster
    mouse
    femur
    tibia

    constructor(camera, raycaster, mouse, femur, tibia) {
        this.camera = camera;
        this.raycaster = raycaster;
        this.mouse = mouse;
        this.femur = femur;
        this.tibia = tibia;
        this.init();
    }

    init() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects([this.femur, this.tibia]);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            console.log('Clicked on:', intersectedObject === this.femur ? 'Femur' : 'Tibia');
            // Add your label creation logic here
        }
    }
}