import {buildShader, buildProgram} from "../gltools.js";
import {fetchText, loadImage} from "../iotools.js";
import {glMatrix, mat4, vec3} from "../gl-matrix/index.js";
import {
    MODEL_ELEMENT_INDEX, MODEL_MATERIALS,
    MODEL_TEXTURES,
    MODEL_VERTEX_NORMAL,
    MODEL_VERTEX_POSITION,
    MODEL_VERTEX_UV
} from "./ningguangModel.js";


/**
 * @type {HTMLCanvasElement}
 */
let canvas = document.querySelector("#mainCanvas");

canvas.width = window.devicePixelRatio * document.body.clientWidth;
canvas.height = window.devicePixelRatio * document.body.clientHeight;

let x = 0;
let y = 0;
let downX = 0;
let downY = 0;
let cX = 0;
let cY = 0;
let cZ = 0;
let rx = 0.125;
let ry = 0.25;

canvas.addEventListener("touchstart", event => {
    if (event.currentTarget === event.target) {
        event.preventDefault();
        downX += x;
        downY += y;
        x = event.touches[0].clientX / canvas.clientWidth - 0.5;
        y = event.touches[0].clientY / canvas.clientHeight - 0.5;
        downX -= x;
        downY -= y;
    }
});

canvas.addEventListener("touchmove", event => {
    if (event.currentTarget === event.target) {
        event.preventDefault();
        x = event.touches[0].clientX / canvas.clientWidth - 0.5;
        y = event.touches[0].clientY / canvas.clientHeight - 0.5;
    }
});

canvas.addEventListener("mousedown", event => {
    if (event.currentTarget === event.target) {
        if ((event.buttons & 0b1) !== 0) {
            downX += x;
            downY += y;
            x = event.clientX / canvas.clientWidth - 0.5;
            y = event.clientY / canvas.clientHeight - 0.5;
            downX -= x;
            downY -= y;
        }
    }
});

canvas.addEventListener("mousemove", event => {
    if (event.currentTarget === event.target) {
        if ((event.buttons & 0b1) !== 0) {
            x = event.clientX / canvas.clientWidth - 0.5;
            y = event.clientY / canvas.clientHeight - 0.5;
        }
        if ((event.buttons & 0b10) !== 0) {
            rx = event.clientX / canvas.clientWidth - 0.5;
            ry = event.clientY / canvas.clientHeight - 0.5;
        }
    }
});


canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
})

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


let shaders = await Promise.all([
    fetchText("shader.vsh").then(s => buildShader(gl, gl.VERTEX_SHADER, s)),
    fetchText("shader.fsh").then(s => buildShader(gl, gl.FRAGMENT_SHADER, s)),
]);

// 创建着色程序
let program = buildProgram(gl, shaders);
let positionLocation = gl.getAttribLocation(program, "position");
let normalLocation = gl.getAttribLocation(program, "normal");
let texCoordLocation = gl.getAttribLocation(program, "texCoord");
let matrixLocation = gl.getUniformLocation(program, "matrix");
let normalMatrixLocation = gl.getUniformLocation(program, "normalMatrix");
let diffuseTextureLocation = gl.getUniformLocation(program, "diffuseTexture");
let lightLocation = gl.getUniformLocation(program, "light");


// 创建顶点输入
let vertexArrayObject = gl.createVertexArray();
gl.bindVertexArray(vertexArrayObject);
let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, MODEL_VERTEX_POSITION, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

let normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, MODEL_VERTEX_NORMAL, gl.STATIC_DRAW);
gl.enableVertexAttribArray(normalLocation);
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

let texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, MODEL_VERTEX_UV, gl.STATIC_DRAW);
gl.enableVertexAttribArray(texCoordLocation);
gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);


// 创建索引缓冲
let elementBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, MODEL_ELEMENT_INDEX, gl.STATIC_DRAW);

/**
 * @type {WebGLTexture[]}
 */
let diffuseTextures = new Array(MODEL_TEXTURES.length);

/**
 * @type {Promise<Image>[]}
 */
let diffuseTexturePromises = new Array(MODEL_TEXTURES.length);
for (let i = 0; i < MODEL_TEXTURES.length; i++) {
    diffuseTexturePromises[i] = loadImage(`ningguang/${MODEL_TEXTURES[i]}`);
}
let diffuseTextureImages = await Promise.all(diffuseTexturePromises);

for (let i = 0; i < MODEL_TEXTURES.length; i++) {
    let diffuseTexture = diffuseTextures[i] = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, diffuseTextureImages[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
}

async function draw() {

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

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
    mat4.scale(model, model, [0.05, 0.05, 0.05]);
    mat4.rotateX(model, model, glMatrix.toRadian((downY + y) * 360));
    mat4.rotateY(model, model, glMatrix.toRadian((downX + x) * 360));
    mat4.rotateY(model, model, glMatrix.toRadian(180));
    mat4.translate(model, model, [0, -10, 0]);

    let matrixValue = mat4.mul(mat4.create(), viewPerspective, model);

    gl.uniformMatrix4fv(matrixLocation, false, matrixValue);

    let normalMatrix = mat4.invert(mat4.create(), model);
    mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix);

    gl.uniform1i(diffuseTextureLocation, 0);
    let light = [0, 0, 1];
    vec3.rotateY(light, light, [0, 0, 0], glMatrix.toRadian(rx * 360));
    vec3.rotateX(light, light, [0, 0, 0], glMatrix.toRadian(ry * 180));
    gl.uniform3f(lightLocation, light[0], light[1], light[2]);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(vertexArrayObject);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);

    let offset = 0;
    for (let i = 0; i < MODEL_MATERIALS.length; i++) {
        let material = MODEL_MATERIALS[i];
        if ((material.flags & 0x1b) === 0) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseTextures[material.textureIndex]);
        let count = material.elementCount;
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offset * Uint16Array.BYTES_PER_ELEMENT);
        offset += count;
    }

    window.requestAnimationFrame(time => draw());
}

draw();

