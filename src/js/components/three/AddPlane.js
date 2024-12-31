import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, BufferGeometry, LineBasicMaterial, Line, Group } from "three";

export class AddPlane {
    constructor(scene) {
        this.scene = scene;
        this.plane;
        this.projectedTeaAxis;
    }

    createPlane = (lines, landmarks) => {
        console.log("lines", lines);
        this.landmarks = landmarks;
        // Find the Mechanical-Axis line
        const mechanicalAxisLine = lines.find(line => line.name === "Mechanical-Axis");
        if (mechanicalAxisLine) {
            // Assuming the line has a start and end point to define its direction
            const positionArray = mechanicalAxisLine.line.geometry.attributes.position.array;
            const startPoint = new Vector3(positionArray[0], positionArray[1], positionArray[2]);
            const endPoint = new Vector3(positionArray[positionArray.length - 3], positionArray[positionArray.length - 2], positionArray[positionArray.length - 1]);
            const direction = new Vector3().subVectors(endPoint, startPoint).normalize();
            const arbitraryVector = new Vector3(0, 1, 0); // Y-axis as arbitrary
            const perpendicularVector = new Vector3().crossVectors(direction, arbitraryVector).normalize();
            const planeGeometry = new PlaneGeometry(10, 10); // Adjust size as needed
            const planeMaterial = new MeshBasicMaterial({ color: 0x808080, side: DoubleSide });
            const plane = new Mesh(planeGeometry, planeMaterial);
            let midpoint;
            if (Math.abs(startPoint.y) < 0.1) {
                midpoint = startPoint;
            } else if (Math.abs(endPoint.y) < 0.1) {
                midpoint = endPoint;
            } else {
                midpoint = new Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
            }
            plane.position.copy(startPoint);
            plane.rotation.x = Math.PI / 2;
            this.scene.add(plane);
            this.plane = plane;
            console.log("plane position::", plane.position)
            this.projectTeaAxis(lines, plane.position);
        } else {
            console.error("Mechanical-Axis line not found");
        }
    }

    projectTeaAxis = (lines, startPoint) => {
        const teaAxisLine = lines.find(line => line.name === "TEA");
        if (teaAxisLine) {
            const teaAxisLineClone = teaAxisLine.line.clone();
            teaAxisLineClone.material = new MeshBasicMaterial({ color: 0xffff00 });
            teaAxisLineClone.position.set(startPoint.x, startPoint.y + 0.09, startPoint.z);
            this.scene.add(teaAxisLineClone);
            this.projectedTeaAxis = teaAxisLineClone;
            console.log("TEA-Axis position set to:", teaAxisLineClone.position);
            this.createLineFromFemurCenter(lines)
        } else {
            console.error("TEA-Axis line not found");
        }
    }

    createLineFromFemurCenter = (lines) => {
        const planeposition = new Vector3(this.plane.position.x, this.plane.position.y + 0.1, this.plane.position.z - 0.19)
        const anteriorLine = new BufferGeometry().setFromPoints([
            planeposition,
            new Vector3().subVectors(this.plane.position, this.projectedTeaAxis.position).multiplyScalar(10).add(planeposition) // Lower the position on y axis
        ]);
        const anteriorLineMaterial = new LineBasicMaterial({ color: 0x00ff00 });
        const anteriorLineMesh = new Line(anteriorLine, anteriorLineMaterial);
        this.scene.add(anteriorLineMesh);
        this.anteriorLine = anteriorLineMesh;
        const rotationAngle = -Math.PI / 2;
        anteriorLineMesh.rotation.x = rotationAngle;
        this.createVarusValgusPlane();
    }

    createVarusValgusPlane = () => {
        // Create a group to hold the plane and anterior line
        const group = new Group();

        // Duplicate the existing plane and set its color to blue without changing the original plane's color
        const duplicatedPlane = this.plane.clone();
        duplicatedPlane.material = duplicatedPlane.material.clone();
        duplicatedPlane.material.color.set(0x0000ff); // Set color to blue
        group.add(duplicatedPlane);

        // Add the anterior line to the group
        if (this.anteriorLine) {
            group.add(this.anteriorLine);
        }

        // Optionally, you can set the position or rotation of the group here
        // group.position.set(...);
        // group.rotation.set(0,0,-90);

        // Add the group to the scene
        this.scene.add(group);
    }
}