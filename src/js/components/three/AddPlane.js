import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide } from "three";

export class AddPlane {
    constructor(scene) {
        this.scene = scene;
    }

    createPlane = (lines) => {
        console.log("lines", lines);

        // Find the Mechanical-Axis line
        const mechanicalAxisLine = lines.find(line => line.name === "Mechanical-Axis");
        if (mechanicalAxisLine) {
            // Assuming the line has a start and end point to define its direction
            const positionArray = mechanicalAxisLine.line.geometry.attributes.position.array;
            const startPoint = new Vector3(positionArray[0], positionArray[1], positionArray[2]);
            const endPoint = new Vector3(positionArray[positionArray.length - 3], positionArray[positionArray.length - 2], positionArray[positionArray.length - 1]);

            console.log("startPoint ", startPoint)
            console.log("End Point ", endPoint)

            // Calculate direction vector
            const direction = new Vector3().subVectors(endPoint, startPoint).normalize();

            // Calculate a perpendicular vector (cross product with an arbitrary vector)
            const arbitraryVector = new Vector3(0, 1, 0); // Y-axis as arbitrary
            const perpendicularVector = new Vector3().crossVectors(direction, arbitraryVector).normalize();

            // Create a plane using the perpendicular vector
            const planeGeometry = new PlaneGeometry(10, 10); // Adjust size as needed
            const planeMaterial = new MeshBasicMaterial({ color: 0xffff00, side: DoubleSide });
            const plane = new Mesh(planeGeometry, planeMaterial);

            // Position the plane at the midpoint of the line
            const midpoint = new Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
            plane.position.copy(midpoint);

            // Rotate the plane to align with the world up direction (Y-axis)
            plane.rotation.x = Math.PI / 2; // Rotate 90 degrees around the X-axis to make it horizontal

            // Add the plane to the scene
            this.scene.add(plane);
        } else {
            console.error("Mechanical-Axis line not found");
        }
    }
}