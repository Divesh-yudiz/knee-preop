import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, BufferGeometry, LineBasicMaterial, Line, Group, BoxGeometry } from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";


export class AddPlane {
    constructor(scene) {
        this.scene = scene;
        this.plane;
        this.projectedTeaAxis;
        this.isRessectBoxVisible = false
        this.activateButtons();
        // this.fontLoader = new FontLoader();
        // this.fontLoader.load(Roboto_Regular, (font) => {
        //     this.font = font;
        // }, undefined, (error) => {
        //     console.error('Error loading font:', error);
        //     console.error('Failed to load font from:', Roboto_Regular);
        // });
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

        document.querySelector('#resection').addEventListener('change', (event) => {
            event.target.checked ? this.resectionStatus(true) : this.resectionStatus(false);
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
        currentValue = currentValue + amount;
        distalResectionElement.textContent = `${currentValue} mm`;
        this.updatedPosition = currentValue * 0.001; // Convert to meters
        if (state == 'plus') {
            this.distalResectionPlane.position.y += this.updatedPosition; // Move the plane up
        } else {
            this.distalResectionPlane.position.y -= this.updatedPosition; // Move the plane down
        }
        if (this.isRessectBoxVisible) {
            if (this.resectBox) {
                this.scene.remove(this.resectBox);
            }
            this.createResectBox(currentValue * 0.1);
        }
        this.distalResectionPlane.updateMatrix(); // Ensure the transformation is applied
    }

    resectionStatus = (status) => {
        if (status) {
            this.isRessectBoxVisible = true
            console.log("updated position ::", this.updatedPosition)
            this.createResectBox(this.updatedPosition);
        } else {
            this.isRessectBoxVisible = false
            this.scene.remove(this.resectBox)
        }
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

        // Access the positions of the spheres
        const distalMedialPt = this.landmarks.get("Distal-Medial-pt").sphere.position; // Get position of the sphere
        const distalLateralPt = this.landmarks.get("Distal-Lateral-pt").sphere.position; // Get position of the sphere

        console.log("Distal Medial Position:", distalMedialPt);
        console.log("Distal Lateral Position:", distalLateralPt);

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

    createResectBox = (scale = 1) => {
        console.log("scale", scale)
        const medianPosition = new Vector3(
            (this.distalMedialPlane.position.x + this.distalResectionPlane.position.x) / 2,
            (this.distalMedialPlane.position.y + this.distalResectionPlane.position.y) / 2,
            (this.distalMedialPlane.position.z + this.distalResectionPlane.position.z) / 2
        );

        const boxGeometry = new BoxGeometry(1, 1, 1);
        const boxMaterial = new MeshBasicMaterial({ color: 0x000000 });
        boxMaterial.colorWrite = false;
        this.resectBox = new Mesh(boxGeometry, boxMaterial);
        this.resectBox.position.copy(medianPosition);
        this.resectBox.scale.set(2, 0.1 * scale, 2);
        this.resectBox.renderOrder = 2;
        this.scene.add(this.resectBox);
        console.log("distal medial plane position ::", this.distalMedialPlane.position)
        this.createMeasurementLines(this.distalMedialPlane.position, this.distalResectionPlane.position)
        const distalLateralPt =this.landmarks.get("Distal-Lateral-pt").sphere.position;

        console.log("plane in y", this.distalResectionPlane.position.y)
        this.createMeasurementLines(distalLateralPt, new Vector3(distalLateralPt.x, this.distalResectionPlane.position.y, distalLateralPt.z))
    }

    createMeasurementLines = (pointA, pointB) => {
        const boxGeometry = new BoxGeometry(0.01, 0.01, 0.01); // Smaller box size
        const boxMaterial = new MeshBasicMaterial({ color: 0x00ff00 }); // Green color

        // Create a group to hold boxA, boxB, and the line
        const measurementGroup = new Group();
        measurementGroup.renderOrder = 0;
        // Create box at pointA
        const boxA = new Mesh(boxGeometry, boxMaterial);
        boxA.position.set(pointA.x, pointA.y, pointA.z);
        measurementGroup.add(boxA);

        // Create box at pointB
        const boxB = new Mesh(boxGeometry, boxMaterial);
        boxB.position.set(pointB.x, pointB.y, pointB.z);
        measurementGroup.add(boxB);

        // Calculate the median of the line
        const median = new Vector3(
            (pointA.x + pointB.x) / 2,
            (pointA.y + pointB.y) / 2,
            (pointA.z + pointB.z) / 2
        );

        // Create a line connecting pointA and pointB
        const lineGeometry = new BufferGeometry().setFromPoints([pointA, pointB]);
        const lineMaterial = new LineBasicMaterial({ color: 0x0000ff }); // Blue color
        const line = new Line(lineGeometry, lineMaterial);
        measurementGroup.add(line);

        this.scene.add(measurementGroup);



        // Add a text number at the median with a small font size
        const textGeometry = new TextGeometry(`Distance: ${pointA.distanceTo(pointB).toFixed(2)}`, {
            font: this.font,
            size: 5, // Reduced font size
            height: 0.01,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        const textMaterial = new MeshBasicMaterial({ color: 0xff0000 }); // Red color
        const textMesh = new Mesh(textGeometry, textMaterial);
        // textMesh.scale.set(0.9)
        textMesh.position.set(median.x, median.y, median.z);
        // this.scene.add(textMesh);
    }


}