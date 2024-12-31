import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, BufferGeometry, LineBasicMaterial, Line, Group } from "three";

export class AddPlane {
    constructor(scene) {
        this.scene = scene;
        this.plane;
        this.projectedTeaAxis;
        this.activateButtons();
    }

    activateButtons = () => {
        // Add event listeners for the buttons
        document.querySelector('.vMinus-btn').addEventListener('click', () => {
            this.changeVarusValgus(-1);
        });
        document.querySelector('.vPlus-btn').addEventListener('click', () => {
            this.changeVarusValgus(1);
        });
        document.querySelector('.fMinus-btn').addEventListener('click', () => {
            this.changeFlexionExtension(-1);
        });
        document.querySelector('.fPlus-btn').addEventListener('click', () => {
            this.changeFlexionExtension(1);
        });
        document.querySelector('.dMinus-btn').addEventListener('click', () => {
            this.changeDistalResection(-1, 'minus');
        });
        document.querySelector('.dPlus-btn').addEventListener('click', () => {
            this.changeDistalResection(1, 'plus');
        });
    }

    // Function to change Varus/Valgus
    changeVarusValgus = (amount) => {
        if (this.vGroup) {
            const varusDegreeElement = document.getElementById('Varus-degree');
            let currentValue = parseInt(varusDegreeElement.textContent);
            currentValue += amount;
            varusDegreeElement.textContent = `${currentValue}°`;
            this.vGroup.rotation.set(0, 0, currentValue * 0.01);
        }
    }

    // Function to change Flexion/Extension
    changeFlexionExtension = (amount) => {
        const flexionDegreeElement = document.getElementById('Flexion-degree');
        let currentValue = parseInt(flexionDegreeElement.textContent);
        currentValue += amount;
        flexionDegreeElement.textContent = `${currentValue}°`;
        this.fGroup.rotation.set(currentValue * 0.01, 0, 0)
    }

    // Function to change Distal Resection
    changeDistalResection = (amount, state) => {
        const distalResectionElement = document.getElementById('Distal-resection');
        let currentValue = parseInt(distalResectionElement.textContent);
        currentValue = Math.max(0, currentValue + amount);
        distalResectionElement.textContent = `${currentValue} mm`;
        const updatedPosition = currentValue * 0.001; // Convert to meters
        console.log("updatedPosition", updatedPosition);
        if (state == 'plus') {
            this.distalResectionPlane.position.y += updatedPosition; // Set the position of the distal resection plane directly
        } else {
            this.distalResectionPlane.position.y -= updatedPosition;
        }
        this.distalResectionPlane.updateMatrix(); // Ensure the transformation is applied
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
            const planeGeometry = new PlaneGeometry(3, 3); // Adjust size as needed
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
            this.createAnteriorLine(lines)
        } else {
            console.error("TEA-Axis line not found");
        }
    }

    createAnteriorLine = (lines) => {
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
        this.vGroup = new Group();
        const varusValgusPlane = this.plane.clone();
        varusValgusPlane.material = varusValgusPlane.material.clone();
        varusValgusPlane.material = new MeshBasicMaterial({ color: 0x0000ff, side: DoubleSide }); // Set color to blue
        this.vGroup.add(varusValgusPlane);
        this.varusValgusPlane = varusValgusPlane;
        if (this.anteriorLine) {
            this.vGroup.add(this.anteriorLine);
        }
        // this.vGroup.rotation.set(0, 0, 0.01);
        this.scene.add(this.vGroup);

        this.createLateralLine();
    }

    createLateralLine = () => {
        this.lateralLine = this.anteriorLine.clone(); // Clone the anterior line
        const rotationAngle = -Math.PI / 2;
        this.lateralLine.rotation.z = rotationAngle;
        this.scene.add(this.lateralLine); // Add the lateral line to the scene
        this.createFlexionExtensionPlane();
    }

    createFlexionExtensionPlane = () => {
        this.fGroup = new Group();
        const flexionPlane = this.varusValgusPlane.clone();
        flexionPlane.material = new MeshBasicMaterial({ color: 0x0000ff, side: DoubleSide }); // Set color to red
        this.flexionPlane = flexionPlane;
        this.fGroup.add(flexionPlane);

        if (this.lateralLine) {
            this.fGroup.add(this.lateralLine);
        }
        this.scene.add(this.fGroup);
        this.createDistalMedialPlane();
    }

    createDistalMedialPlane = () => {
        console.log("landmarks", this.landmarks);
        const distalMedialPt = this.landmarks["Distal-Medial-pt"];
        const distalLateralPt = this.landmarks["Distal-Lateral-pt"];
        const medianPt = new Vector3(
            (distalMedialPt.x + distalLateralPt.x) / 2,
            (distalMedialPt.y + distalLateralPt.y) / 2,
            (distalMedialPt.z + distalLateralPt.z) / 2
        );

        const distalPlaneGeometry = new PlaneGeometry(3, 3);
        const distalPlaneMaterial = new MeshBasicMaterial({ color: 0x008080, side: DoubleSide }); // Set color to teal
        const distalPlaneMesh = new Mesh(distalPlaneGeometry, distalPlaneMaterial);
        distalPlaneMesh.position.set(distalMedialPt.x, distalMedialPt.y, distalMedialPt.z);
        distalPlaneMesh.rotation.x = -Math.PI / 2; // Rotate the plane horizontally
        this.scene.add(distalPlaneMesh);
        this.distalMedialPlane = distalPlaneMesh;
        this.createDistalResectionPlane();
    }

    createDistalResectionPlane = () => {
        this.distalResectionPlane = this.distalMedialPlane.clone();
        this.distalResectionPlane.name = "DistalResectionPlane";
        this.distalResectionPlane.position.y += 0.1;
        console.log("this.distalResectionPlane.position.y", this.distalResectionPlane.position.y)
        this.scene.add(this.distalResectionPlane)
    }

    

}