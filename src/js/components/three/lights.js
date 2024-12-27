
import {
    DirectionalLight,
    AmbientLight,
    HemisphereLight,
    Color
} from 'three'

export class Light {
    scene
    constructor(scene) {
        this.scene = scene;

        this.mainLight = new DirectionalLight(new Color(1, 1, 1, 1), 2);
        this.mainLight.position.set(-3, 4, 0);
        this.scene.add(this.mainLight);

        this.mainLight2 = new DirectionalLight(new Color(1, 1, 1, 1), 2);
        this.mainLight2.position.set(3, 4, 0);
        this.scene.add(this.mainLight2);

        this.mainLight3 = new DirectionalLight(new Color(1, 1, 1, 1), 2);
        this.mainLight3.position.set(3, -4, 0);
        this.scene.add(this.mainLight3);

        this.mainLight2 = new AmbientLight(new Color(1, 1, 1, 1));
        this.mainLight2.position.set(0, 5, 5)
        this.scene.add(this.mainLight2);
    }
}