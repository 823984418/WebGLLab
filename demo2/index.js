import {buildShader, buildProgram} from "../gltools.js";
import {fetchText} from "../iotools.js";
import {glMatrix, mat4} from "../gl-matrix";
import * as bunny from "../bunny.js";

/**
 * @type {HTMLCanvasElement}
 */
let canvas = document.querySelector("#mainCanvas");

canvas.width = 900;
canvas.height = 700;

let x = 0;
let y = 0;
let cX = 0;
let cY = 0;
let cZ = 0;

canvas.addEventListener("mousemove", event => {
    if (event.currentTarget === event.target && (event.buttons & 1) !== 0) {
        x = event.clientX / canvas.clientWidth - 0.5;
        y = event.clientY / canvas.clientHeight - 0.5;
    }
});

canvas.addEventListener("mousewheel", event => {
    cZ += event.deltaY * 0.001;
});

canvas.tabIndex = 0;
canvas.addEventListener("keypress", event => {
    switch (event.key) {
        case "w":
        case "W":
            cY += 0.01;
            break;
        case "s":
        case "S":
            cY -= 0.01;
            break;
        case "a":
        case "A":
            cX -= 0.01;
            break;
        case "d":
        case "D":
            cX += 0.01;
            break;
    }
});
/**
 * @type {WebGL2RenderingContext}
 */
let gl = canvas.getContext("webgl2");

// 创建着色程序
let program = buildProgram(gl, [
    buildShader(gl, gl.VERTEX_SHADER, await fetchText("shader.vsh")),
    buildShader(gl, gl.FRAGMENT_SHADER, await fetchText("shader.fsh")),
]);
let positionLocation = gl.getAttribLocation(program, "position");
let normalLocation = gl.getAttribLocation(program, "normal");
let matrixLocation = gl.getUniformLocation(program, "matrix");
let normalMatrixLocation = gl.getUniformLocation(program, "normalMatrix");


// 创建顶点输入
let vertexArrayObject = gl.createVertexArray();
gl.bindVertexArray(vertexArrayObject);
let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, bunny.VS, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

let normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, bunny.NS, gl.STATIC_DRAW);
gl.enableVertexAttribArray(normalLocation);
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

async function draw() {

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.useProgram(program);

    let view = mat4.lookAt(mat4.create(),
        [cX, cY, cZ],
        [cX, cY, cZ - 1],
        [0, 1, 0]);

    let perspective = mat4.perspective(mat4.create(),
        glMatrix.toRadian(60),
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.01, Infinity);

    let viewPerspective = mat4.mul(mat4.create(), perspective, view);


    let model = mat4.identity(mat4.create());
    mat4.translate(model, model, [0, 0, -1]);
    mat4.scale(model, model, [4, 4, 4]);
    mat4.rotateX(model, model, glMatrix.toRadian(y * 360));
    mat4.rotateY(model, model, glMatrix.toRadian(x * 360));
    mat4.translate(model, model, [0.03, -0.1, 0]);

    let matrixValue = mat4.mul(mat4.create(), viewPerspective, model);

    gl.uniformMatrix4fv(matrixLocation, false, matrixValue);

    let normalMatrix = mat4.invert(mat4.create(), model);
    mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(vertexArrayObject);

    gl.drawArrays(gl.TRIANGLES, 0, bunny.ELEMENT_COUNT);

    window.requestAnimationFrame(time => draw());
}


draw();

