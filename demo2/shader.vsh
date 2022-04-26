#version 300 es

in highp vec3 position;
in highp vec3 normal;

uniform highp mat4 matrix;
uniform highp mat4 normalMatrix;

out highp vec4 pNormal;

void main() {
    pNormal = normalize(normalMatrix * vec4(normal, 0.0));
//    pNormal = vec4(normal, 0.0);
    gl_Position = matrix * vec4(position, 1.0);

}
