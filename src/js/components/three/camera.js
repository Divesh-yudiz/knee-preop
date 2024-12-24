import {
    PerspectiveCamera,
} from 'three'


export class Camera {
    scene
    constructor(scene) {
        this.scene = scene;
        const aspectRatio = window.innerWidth / window.innerHeight;
        const fieldOfView = 60
        const nearPlane = 0.1
        const farPlane = 10000

        // set classic camera
        this.camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
        this.camera.position.set(0, 0, 1000)
        this.scene.add(this.camera)
    }
}