#version 300 es

in highp vec3 position;

uniform highp mat4 matrix;

void main() {
    gl_Position = matrix * vec4(position, 1.0);
}
