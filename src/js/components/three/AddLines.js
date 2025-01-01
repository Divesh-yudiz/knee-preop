import { Line, BufferGeometry, LineBasicMaterial } from "three";
import { AddPlane } from "./AddPlane";

export class AddLines {
    scene
    constructor(scene, landmarks) {
        this.scene = scene;
        this.landmarks = landmarks;
        this.addPlane = new AddPlane(this.scene);

        this.updatebutton = document.querySelector('.update-btn')
        this.updatebutton.addEventListener("click", this.createLines);

        this.linesEndPoints = {
            "Mechanical-Axis": ["femur-center", 'hip-center'],
            "Anatomical-Axis": ["femur-proximal", 'femur-distal'],
            "TEA": ["medial-epicondyle", 'lateral-epicondyle'],
            "PCA": ["Posterior-Medial-pt", 'Posterior-Lateral-pt'],
        }
    }

    createLines = async () => {
        const createdLines = []; // Array to store created lines and their names
        if (this.landmarks.size >= 10) {
            // Traverse through each line in linesEndPoints
            for (const [lineName, points] of Object.entries(this.linesEndPoints)) {
                console.log("lines ::", lineName, points)
                const [startPoint, endPoint] = points;
                if (this.landmarks.has(startPoint) && this.landmarks.has(endPoint)) {
                    console.log("this. landmark", this.landmarks.get(startPoint))
                    const startPosition = this.landmarks.get(startPoint).sphere.position;
                    const endPosition = this.landmarks.get(endPoint).sphere.position;

                    // Create a geometry and material for the line
                    const geometry = new BufferGeometry().setFromPoints([startPosition, endPosition]);
                    const material = new LineBasicMaterial({ color: 0xff0000 }); // Red color for the line

                    // Create the line and add it to the scene
                    const line = new Line(geometry, material);
                    line.renderOrder = 0;
                    this.scene.add(line);
                    createdLines.push({ line: line, name: lineName }); // Store the created line and its name
                }
            }
            // Call createPlane after all lines have been created, passing the created lines and their names
            await this.addPlane.createPlane(createdLines, this.landmarks);
        }
    }
}