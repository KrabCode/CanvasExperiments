// noinspection DuplicatedCode

"use strict"
let gl, canvas, programInfo;
let shapes = [];
let fieldOfViewRadians, worldViewProjectionLocation, worldInverseTransposeLocation, colorLocation, reverseLightDirectionLocation;


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

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    fieldOfViewRadians = degToRad(60);
    setupShapes();
    requestAnimationFrame(mainLoop);
}

function mainLoop(time) {
    time *= 0.001;
    clearCanvas();
    drawShapes(time);
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

function setupShapes() {
    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    let radius = 30;
    let subdivisionsAxis = 12;
    let subdivisionsHeight = 24;
    let sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, radius, subdivisionsAxis, subdivisionsHeight);
    let sphereUniforms = {
        u_colorMult: [1, 1, 1, 1],
    };
    let sphere = {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
        radius: radius,
        update: function (time) {
            // Compute the projection matrix
            let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            let zNear = 1;
            let zFar = 2000;
            let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

            // Compute the camera's matrix
            let camera = [100, 150, 200];
            let target = [0, 35, 0];
            let up = [0, 1, 0];
            let cameraMatrix = m4.lookAt(camera, target, up);

            // Make a view matrix from the camera matrix.
            let viewMatrix = m4.inverse(cameraMatrix);

            // Compute a view projection matrix
            let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

            // Draw a F at the origin
            let worldMatrix = m4.identity();
            worldMatrix = m4.translate(worldMatrix, 0,0, 135);

            // Multiply the matrices.
            let worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
            let worldInverseMatrix = m4.inverse(worldMatrix);
            let worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

            this.uniforms.u_color = [1.0, 1.0, 1.0, 1];
            this.uniforms.u_reverseLightDirectionMatrix = m4.normalize([0.7, 0.5, 0.7]);
            this.uniforms.u_worldViewProjectionMatrix = worldViewProjectionMatrix;
            this.uniforms.u_worldInverseTransposeMatrix = worldInverseTransposeMatrix;
        }
    }
    shapes.push(sphere);
    console.log(shapes.length);
}

function drawShapes(time) {
    shapes.forEach(function(object) {
        let bufferInfo = object.bufferInfo;

        gl.useProgram(object.programInfo.program);

        object.update(time);
        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, object.programInfo, bufferInfo);

        // Set the uniforms.
        webglUtils.setUniforms(object.programInfo, object.uniforms);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });
}

main();