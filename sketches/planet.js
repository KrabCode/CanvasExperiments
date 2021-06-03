// noinspection DuplicatedCode

"use strict"
let gl, canvas, programInfo;
let shapes = [];

function main(){
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    canvas = document.querySelector("#myCanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
    setupUniforms();
    setupShapes();
    requestAnimationFrame(mainLoop);
}

function mainLoop(time) {
    time *= 0.001;
    clearCanvas();
    updateCamera();
    updateUniforms();
    updateShapes(time);
    drawShapes();
    requestAnimationFrame(mainLoop);
}

function clearCanvas() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

let viewProjectionMatrix, worldViewProjectionMatrix, worldInverseMatrix, worldInverseTransposeMatrix;

function updateCamera() {
    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);

    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the camera's matrix
    var camera = [100, 150, 200];
    var target = [0, -35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);


    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);
    viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Draw a F at the origin
    var worldMatrix = m4.yRotation(0);
    // Multiply the matrices.

    worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);

    worldInverseMatrix = m4.inverse(worldMatrix);

    worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
}

let worldViewProjectionLocation, worldInverseTransposeLocation, colorLocation, reverseLightDirectionLocation;

function setupUniforms() {
    // lookup uniforms
    worldViewProjectionLocation = gl.getUniformLocation(programInfo.program, "u_worldViewProjection");
    worldInverseTransposeLocation = gl.getUniformLocation(programInfo.program, "u_worldInverseTranspose");
    colorLocation = gl.getUniformLocation(programInfo.program, "u_color");
    reverseLightDirectionLocation = gl.getUniformLocation(programInfo.program, "u_reverseLightDirection");
}

function updateUniforms() {
    gl.useProgram(programInfo.program);
    // Set the matrices
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

    // Set the color to use
    gl.uniform4fv(colorLocation, [1.0, 1.0, 1.0, 1]);

    // set the light direction.
    gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.7, 0.5, -1]));
}

function setupShapes() {
    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    let radius = 30;
    let subdivisionsAxis = 32;
    let subdivisionsHeight = 64;
    let sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, radius, subdivisionsAxis, subdivisionsHeight);
    let sphereUniforms = {
        u_colorMult: [1, 0.3, 0.3, 1],
        u_matrix: m4.identity(),
    };
    let sphere = {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
        radius: radius,
        update: function (time) {
            let matrix = m4.translate(worldViewProjectionMatrix, 0, 0, 0);
            this.uniforms.u_matrix = matrix;

        }
    }
    shapes.push(sphere);

    let asteroidCount = 1000;
    for(let i = 0; i < asteroidCount; i++) {
        let iNorm = map(i, 0, asteroidCount-1, 0, 1);
        radius = Math.min(10, 0.3+randomGaussian());
        subdivisionsAxis = 8;
        subdivisionsHeight = 16;
        let asteroidBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, radius, subdivisionsAxis, subdivisionsHeight);
        let asteroidUniforms = {
            u_colorMult: [1, 1.0, 1, 1],
            u_matrix: m4.identity(),
        };
        let asteroid = {
            programInfo: programInfo,
            bufferInfo: asteroidBufferInfo,
            uniforms: asteroidUniforms,
            translate: [-25+50*Math.random(),-20+40*Math.random(),-25+50*Math.random()],
            orbitRadius: Math.random(),
            update: function (time) {
                let matrix = m4.translate(worldViewProjectionMatrix, 0, 0, 0);
                let orbitSpeed = 0.2;

                let x = (sphere.radius*2+100*this.orbitRadius)*Math.cos(orbitSpeed*time+iNorm * Math.PI * 2) + this.translate[0];
                let y = this.translate[1];
                let z = (sphere.radius*2+100*this.orbitRadius)*Math.sin(orbitSpeed*time+iNorm * Math.PI * 2) + this.translate[2];
                matrix = m4.translate(matrix, x, y, z);
                matrix = m4.xRotate(matrix, time); // TODO spin me right round
                this.uniforms.u_matrix = matrix;
            }
        }
        shapes.push(asteroid);
    }
    console.log(shapes.length);
}

function updateShapes(time) {
    // Setup all the needed attributes.
    shapes.forEach(function (object) {
        object.update(time);
    });
}

function drawShapes() {
    shapes.forEach(function(object) {
        let bufferInfo = object.bufferInfo;

        gl.useProgram(object.programInfo.program);

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, object.programInfo, bufferInfo);

        // Set the uniforms.
        webglUtils.setUniforms(object.programInfo, object.uniforms);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });
}

main();