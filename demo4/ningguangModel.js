import {DataViewEx, fetchBlob} from "../iotools.js";

let model = await fetchBlob("ningguang/凝光.pmx");

let modelView = new DataViewEx(await model.arrayBuffer());

let offset = 0;
let magic = modelView.getText(offset, 4);
offset += 4;

let version = modelView.getFloat32(offset, true);
offset += 4;

let globalDataCount = modelView.getUint8(offset);
offset += 1;
let globalData = new Uint8Array(globalDataCount);
globalData.set(modelView.subUint8Array(offset, globalDataCount));
offset += globalDataCount;

if (globalData[0] === 1) {
    modelView.defaultDecoder = new TextDecoder("UTF-8");
} else {
    modelView.defaultDecoder = new TextDecoder("UTF-16LE");
}

let modelVertexDataSize = globalData[1];
let vertexIndexSize = globalData[2];
let textureIndexSize = globalData[3];
let materialIndexSize = globalData[4];
let boneIndexSize = globalData[5];
let morphIndexSize = globalData[6];
let rigidBodyIndexSize = globalData[7];

let localModelNameLength = modelView.getUint32(offset, true);
offset += 4;
let localModelName = modelView.getText(offset, localModelNameLength);
offset += localModelNameLength;

let universalModelNameLength = modelView.getUint32(offset, true);
offset += 4;
let universalModelName = modelView.getText(offset, universalModelNameLength);
offset += universalModelNameLength;

let localCommentsLength = modelView.getUint32(offset, true);
offset += 4;
let localComments = modelView.getText(offset, localCommentsLength);
offset += localCommentsLength;

let universalCommentsLength = modelView.getUint32(offset, true);
offset += 4;
let universalComments = modelView.getText(offset, universalCommentsLength);
offset += universalCommentsLength;

let vertexCount = modelView.getUint32(offset, true);
offset += 4;

export let MODEL_VERTEX_POSITION = new Float32Array(vertexCount * 3);
export let MODEL_VERTEX_NORMAL = new Float32Array(vertexCount * 3);
export let MODEL_VERTEX_UV = new Float32Array(vertexCount * 2);
export let MODEL_VERTEX_DATA = new Float32Array(vertexCount * 4 * modelVertexDataSize);

for (let i = 0; i < vertexCount; i++) {
    MODEL_VERTEX_POSITION[i * 3] = modelView.getFloat32(offset, true);
    offset += 4;
    MODEL_VERTEX_POSITION[i * 3 + 1] = modelView.getFloat32(offset, true);
    offset += 4;
    MODEL_VERTEX_POSITION[i * 3 + 2] = modelView.getFloat32(offset, true);
    offset += 4;

    MODEL_VERTEX_NORMAL[i * 3] = modelView.getFloat32(offset, true);
    offset += 4;
    MODEL_VERTEX_NORMAL[i * 3 + 1] = modelView.getFloat32(offset, true);
    offset += 4;
    MODEL_VERTEX_NORMAL[i * 3 + 2] = modelView.getFloat32(offset, true);
    offset += 4;

    MODEL_VERTEX_UV[i * 2] = modelView.getFloat32(offset, true);
    offset += 4;
    MODEL_VERTEX_UV[i * 2 + 1] = modelView.getFloat32(offset, true);
    offset += 4;

    for (let j = 0; j < modelVertexDataSize * 4; j++) {
        MODEL_VERTEX_DATA[i * 4 * modelVertexDataSize + j] = modelView.getFloat32(offset, true);
        offset += 4;
    }

    let weightType = modelView.getUint8(offset);
    offset += 1;

    // 骨骼绑定，先跳过
    switch (weightType) {
        case -1:
            break;
        case 0:
            offset += boneIndexSize;
            break;
        case 1:
            offset += boneIndexSize * 2 + 4;
            break;
        case 2:
            offset += boneIndexSize * 4 + 4 * 4;
            break;
        case 3:
            offset += boneIndexSize * 2 + 4 + 4 * 3 * 3;
            break;
        case 4:
            offset += boneIndexSize * 4 + 4 * 4;
            break;
        default:
            throw new Error(`未知绑定类型: ${weightType}`);
    }

    // 边缘放大率
    offset += 4;

}

if (vertexIndexSize !== 2) {
    throw new Error("先写着16位顶点索引先");
}

let elementCount = modelView.getUint32(offset, true);
offset += 4;

export let MODEL_ELEMENT_INDEX = new Uint16Array(elementCount);
for (let i = 0; i < elementCount; i++) {
    MODEL_ELEMENT_INDEX[i] = modelView.getUint16(offset, true);
    offset += 2;
}

let textureCount = modelView.getUint32(offset, true);
offset += 4;
export let MODEL_TEXTURES = new Array(textureCount);
for (let i = 0; i < textureCount; i++) {
    let length = modelView.getUint32(offset, true);
    offset += 4;
    MODEL_TEXTURES[i] = modelView.getText(offset, length);
    offset += length;
}

if (textureIndexSize !== 1) {
    throw new Error("先写着8位纹理索引先");
}

let materialCount = modelView.getUint32(offset, true);
offset += 4;
export let MODEL_MATERIALS = new Array(materialCount);
for (let i = 0; i < materialCount; i++) {
    let material = MODEL_MATERIALS[i] = {};

    let localNameLength = modelView.getUint32(offset, true);
    offset += 4;
    material.localName = modelView.getText(offset, localNameLength);
    offset += localNameLength;

    let universalNameLength = modelView.getUint32(offset, true);
    offset += 4;
    material.universalName = modelView.getText(offset, universalNameLength);
    offset += universalNameLength;

    // 漫反射颜色
    offset += 4 * 4;

    // 镜面光颜色
    offset += 3 * 4;

    // 镜面光强度
    offset += 4;

    // 环境颜色
    offset += 3 * 4;

    // 绘制标记
    material.flags = modelView.getUint8(offset);
    offset += 1;

    // 边缘颜色
    offset += 4 * 4;

    // 边缘比例
    offset += 4;

    // 纹理索引
    material.textureIndex = modelView.getInt8(offset);
    offset += textureIndexSize;

    // 环境纹理索引
    material.environmentTextureIndex = modelView.getInt8(offset);
    offset += textureIndexSize;

    // 环境混合模式
    offset += 1;

    // 贴图引用
    material.textureRef = modelView.getInt8(offset);
    offset += 1;

    // 贴图值
    switch (material.textureRef) {
        case 0:
            material.textureValue = modelView.getInt8(offset);
            offset += textureIndexSize;
            break;
        case 1:
            material.textureValue = modelView.getInt8(offset);
            offset += 1;
            break;
        default:
            throw new Error();
    }

    // 元数据
    let metadataLength = modelView.getUint32(offset, true);
    offset += 4;
    material.metadata = modelView.getText(offset, metadataLength);
    offset += metadataLength;

    material.elementCount = modelView.getUint32(offset, true);
    offset += 4;
}


if (boneIndexSize !== 2) {
    throw new Error("先写着16位骨骼索引先");
}

let boneCount = modelView.getUint32(offset, true);
offset += 4;
export let MODEL_BONES = new Array(boneCount);
for (let i = 0; i < boneCount; i++) {
    let bone = MODEL_BONES[i] = {};

    let localNameLength = modelView.getUint32(offset, true);
    offset += 4;
    bone.localName = modelView.getText(offset, localNameLength);
    offset += localNameLength;

    let universalNameLength = modelView.getUint32(offset, true);
    offset += 4;
    bone.universalName = modelView.getText(offset, universalNameLength);
    offset += universalNameLength;

    bone.position = [
        modelView.getFloat32(offset, true),
        modelView.getFloat32(offset + 4, true),
        modelView.getFloat32(offset + 8, true),
    ];
    offset += 3 * 4;

    bone.parentBoneIndex = modelView.getInt16(offset, true);
    offset += boneIndexSize;

    bone.layer = modelView.getUint32(offset, true);
    offset += 4;

    bone.flags = modelView.getUint16(offset, true);
    offset += 2;

    // 尾部位置
    if ((bone.flags & 0b1) !== 0) {
        offset += boneIndexSize;
    } else {
        offset += 3 * 4;
    }

    if ((bone.flags & 0b11_00000000) !== 0) {
        offset += boneIndexSize;
        offset += 4;
    }

    if ((bone.flags & 0b100_00000000) !== 0) {
        offset += 3 * 4;
    }

    if ((bone.flags & 0b1000_00000000) !== 0) {
        offset += 3 * 4;
        offset += 3 * 4;
    }

    if ((bone.flags & 0b100000_00000000) !== 0) {
        offset += boneIndexSize;
    }

    if ((bone.flags & 0b100000) !== 0) {
        offset += boneIndexSize;
        offset += 4;
        offset += 4;
        let linkCount = modelView.getUint32(offset, true);
        offset += 4;
        for (let j = 0; j < linkCount; j++) {
            offset += boneIndexSize;
            let hasLimit = modelView.getUint8(offset);
            offset += 1;
            if (hasLimit !== 0) {
                offset += 3 * 4;
                offset += 3 * 4;
            }
        }
    }
}


let morphCount = modelView.getInt32(offset, true);
offset += 4;
export let MODEL_MORPHS = new Array(morphCount);
for (let i = 0; i < morphCount; i++) {
    let morph = MODEL_MORPHS[i] = {};

    let localNameLength = modelView.getUint32(offset, true);
    offset += 4;
    morph.localName = modelView.getText(offset, localNameLength);
    offset += localNameLength;

    let universalNameLength = modelView.getUint32(offset, true);
    offset += 4;
    morph.universalName = modelView.getText(offset, universalNameLength);
    offset += universalNameLength;

    morph.panelType = modelView.getUint8(offset);
    offset += 1;

    let type = morph.type = modelView.getUint8(offset);
    offset += 1;

    let offsetSize = modelView.getInt32(offset, true);
    offset += 4;

    let offsetData = morph.offsetData = new Array(offsetSize);
    for (let j = 0; j < offsetSize; j++) {
        switch (type) {
            case 0:
            case 9:
                offset += morphIndexSize;
                offset += 4;
                break;
            case 1:
                offset += vertexIndexSize;
                offset += 3 * 4;
                break;
            case 2:
                offset += boneIndexSize;
                offset += 3 * 4;
                offset += 4 * 4;
                break;
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                offset += vertexIndexSize;
                offset += 4 * 4;
                break;
            case 8:
                offset += materialIndexSize;
                offset += 1;
                offset += 4 * 4;
                offset += 3 * 4;
                offset += 4;
                offset += 3 * 4;
                offset += 4 * 4;
                offset += 4;
                offset += 4 * 4;
                offset += 4 * 4;
                offset += 4 * 4;
                break;
            default:
                throw new Error();
        }

    }


}


let displayFrameCount = modelView.getInt32(offset, true);
offset += 4;
export let MODEL_DISPLAY_FRAMES = new Array(displayFrameCount);
for (let i = 0; i < displayFrameCount; i++) {
    let displayFrame = MODEL_DISPLAY_FRAMES[i] = {};

    let localNameLength = modelView.getUint32(offset, true);
    offset += 4;
    displayFrame.localName = modelView.getText(offset, localNameLength);
    offset += localNameLength;

    let universalNameLength = modelView.getUint32(offset, true);
    offset += 4;
    displayFrame.universalName = modelView.getText(offset, universalNameLength);
    offset += universalNameLength;

    displayFrame.special = modelView.getUint8(offset);
    offset += 1;

    let count = modelView.getInt32(offset, true);
    offset += 4;
    let data = displayFrame.data = new Array(count);
    for (let j = 0; j < count; j++) {
        let item = data[j] = {};
        let type = item.type = modelView.getInt8(offset);
        offset += 1;
        switch (type) {
            case 0:
                offset += boneIndexSize;
                break;
            case 1:
                offset += morphIndexSize;
                break;
            default:
                throw new Error();
        }
    }

}


let rigidBodyCount = modelView.getInt32(offset, true);
offset += 4;
export let MODEL_RIGID_BODY = new Array(rigidBodyCount);
for (let i = 0; i < rigidBodyCount; i++) {
    let rigidBody = MODEL_RIGID_BODY[i] = {};

    let localNameLength = modelView.getUint32(offset, true);
    offset += 4;
    rigidBody.localName = modelView.getText(offset, localNameLength);
    offset += localNameLength;

    let universalNameLength = modelView.getUint32(offset, true);
    offset += 4;
    rigidBody.universalName = modelView.getText(offset, universalNameLength);
    offset += universalNameLength;

    offset += boneIndexSize;

    offset += 1;

    offset += 2;

    offset += 1;

    offset += 3 * 4;

    offset += 3 * 4;

    offset += 3 * 4;

    offset += 4;

    offset += 4;

    offset += 4;

    offset += 4;

    offset += 4;

    offset += 1;
}

let jointCount = modelView.getInt32(offset, true);
offset += 4;
export let MODEL_JOINT = new Array(jointCount);
for (let i = 0; i < jointCount; i++) {
    let joint = MODEL_JOINT[i] = {};

    let localNameLength = modelView.getUint32(offset, true);
    offset += 4;
    joint.localName = modelView.getText(offset, localNameLength);
    offset += localNameLength;

    let universalNameLength = modelView.getUint32(offset, true);
    offset += 4;
    joint.universalName = modelView.getText(offset, universalNameLength);
    offset += universalNameLength;

    offset += 1;

    offset += rigidBodyIndexSize;

    offset += rigidBodyIndexSize;
    offset += 3 * 4;
    offset += 3 * 4;
    offset += 3 * 4;
    offset += 3 * 4;
    offset += 3 * 4;
    offset += 3 * 4;
    offset += 3 * 4;
    offset += 3 * 4;
}


MODEL_TEXTURES[3] = "Texture/未知hack.png";

console.log(MODEL_TEXTURES);
console.log(MODEL_MATERIALS);
console.log(MODEL_BONES);
console.log(MODEL_MORPHS);
console.log(MODEL_DISPLAY_FRAMES);
console.log(MODEL_RIGID_BODY);
console.log(MODEL_JOINT);

