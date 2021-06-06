// noinspection DuplicatedCode

"use strict";
let gl;
let shapes = [];
let programInfo;

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    programInfo = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);
    var fRotationRadians = 0;

    drawScene();

    // Setup a ui.
    webglLessonsUI.setupSlider("#fRotation", {value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360});

    function updateRotation(event, ui) {
        fRotationRadians = degToRad(ui.value);
        drawScene();
    }

    // Draw the scene.
    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Turn on culling. By default backfacing triangles
        // will be culled.
        gl.enable(gl.CULL_FACE);

        // Enable the depth buffer
        gl.enable(gl.DEPTH_TEST);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(programInfo);

        shapes = [];

        // Compute the projection matrix
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 2000;
        var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // Compute the camera's matrix
        var camera = [100, 150, 200];
        var target = [0, 35, 0];
        var up = [0, 1, 0];
        var cameraMatrix = m4.lookAt(camera, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        // Compute a view projection matrix
        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // Draw a F at the origin
        var worldMatrix = m4.yRotation(fRotationRadians);
        worldMatrix = m4.translate(worldMatrix, 0,0,35);

        // Multiply the matrices.
        var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
        var worldInverseMatrix = m4.inverse(worldMatrix);
        var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

        let bufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 24);
        let shape = {
            programInfo: programInfo,
            bufferInfo: bufferInfo,
            uniforms: {
                u_worldViewProjectionMatrix : worldViewProjectionMatrix,
                u_worldInverseTransposeMatrix : worldInverseTransposeMatrix,
                u_reverseLightDirectionLocation : m4.normalize([0.5, 0.7, 1]),
                u_color: [0.2, 1, 0.2, 1]
            }
        }
        shapes.push(shape);

        drawShapes();
    }
}


function drawShapes() {
    shapes.forEach(function(object) {
        let bufferInfo = object.bufferInfo;

        gl.useProgram(programInfo);

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        // Set the uniforms.
        webglUtils.setUniforms(programInfo, object.uniforms);

        // Draw
        gl.drawArrays(gl.POINTS, 0, bufferInfo.numElements);
    });
}

// Fill the buffer with the values that define a letter 'F'.

main();
