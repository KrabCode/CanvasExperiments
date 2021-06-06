let gl, programInfo;
let positionAttributeLocation;

function main() {
    canvas = document.querySelector("#webgl");
    gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-2d", "fragment-shader-2d"]);
    positionAttributeLocation = gl.getAttribLocation(programInfo.program, "a_position");
    requestAnimationFrame(drawScene);
}

function drawScene(time) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(positionAttributeLocation);

    let t = time * 0.01;
    let shapeCount = 30;
    for (let shapeIndex = 0; shapeIndex < shapeCount; shapeIndex++) {
        // create / update
        let shapeNorm = map(shapeIndex, 0, shapeCount - 1, 0, 1);
        let detail = 6;
        let shape = {
            positionsArray: [],
            positionBuffer: gl.createBuffer(),
            vertexModulo: 2
        }
        let radius = shapeNorm * 2.5;
        for (let i = 0; i <= detail; i++) {
            let iNorm = map(i, 0, detail, 0, 1);
            let x = radius * Math.cos(iNorm * Math.PI * 2 + t * shapeNorm);
            let y = radius * Math.sin(iNorm * Math.PI * 2 + t * shapeNorm);
            shape.positionsArray.push(x);
            shape.positionsArray.push(y);
        }

        // draw
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.positionsArray), gl.STATIC_DRAW);
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = shape.vertexModulo;
        let type = gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

        let count = shape.positionsArray.length / shape.vertexModulo;
        gl.drawArrays(gl.LINE_LOOP, offset, count);
    }
    requestAnimationFrame(drawScene)
}

main()