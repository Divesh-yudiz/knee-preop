import { Line, BufferGeometry, LineBasicMaterial, Vector3 } from "three";
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

        // // New object to hold landmark positions
        // this.landmarkPositions = {
        //     "femur-center": { x: 0.169447412142406, y: -0.19680417926487503, z: -0.0025353797586148696 },
        //     "lateral-epicondyle": { x: -0.2317885127426279, y: -0.10126675257530587, z: -0.0991291634839625 },
        //     "medial-epicondyle": { x: 0.5505242107660995, y: -0.06931022879585313, z: -0.18931134100571845 },
        //     "Posterior-Medial-pt": { x: 0.4286202573635865, y: -0.16879356314191263, z: -0.3324094794881153 },
        //     "Posterior-Lateral-pt": { x: -0.11049877254882887, y: -0.14978487193251863, z: -0.29008818792210694 },
        //     "Distal-Lateral-pt": { x: -0.11353425617355768, y: -0.2727466425485731, z: -0.11564521933573854 },
        //     "Distal-Medial-pt": { x: 0.4098907339564983, y: -0.29802941918977244, z: -0.10657380917892606 },
        //     "hip-center": { x: -0.07131832546824651, y: 3.969435186945521, z: 0.37341088026731545 },
        //     "femur-proximal": { x: -0.3647719175423915, y: 3.894522935269224, z: 0.11911979340008819 },
        //     "femur-distal": { x: 0.16886025015302422, y: -0.1930512673596993, z: -0.013940259360945756 },
        // };
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

    // createStaticLines = async () => {
    //     const createdLines = []; // Array to store created lines and their names
    //     // if (this.landmarks.size >= 10) {
    //     // Traverse through each line in linesEndPoints
    //     for (const [lineName, points] of Object.entries(this.linesEndPoints)) {
    //         console.log("lines ::", lineName, points)
    //         const [startPoint, endPoint] = points;
    //         if (this.landmarkPositions[startPoint] && this.landmarkPositions[endPoint]) {
    //             console.log("this. landmark", this.landmarkPositions[startPoint])
    //             const startPosition = new Vector3().set(this.landmarkPositions[startPoint].x, this.landmarkPositions[startPoint].y, this.landmarkPositions[startPoint].z);
    //             const endPosition = new Vector3().set(this.landmarkPositions[endPoint].x, this.landmarkPositions[endPoint].y, this.landmarkPositions[endPoint].z);

    //             // Create a geometry and material for the line
    //             const geometry = new BufferGeometry().setFromPoints([startPosition, endPosition]);
    //             const material = new LineBasicMaterial({ color: 0xff0000 }); // Red color for the line

    //             // Create the line and add it to the scene
    //             const line = new Line(geometry, material);
    //             line.renderOrder = 0;
    //             this.scene.add(line);
    //             createdLines.push({ line: line, name: lineName }); // Store the created line and its name
    //         }
    //     }
    //     // Call createPlane after all lines have been created, passing the created lines and their names
    //     await this.addPlane.createPlane(createdLines, this.landmarkPositions);
    //     // }
    // }
}