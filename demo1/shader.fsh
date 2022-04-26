#version 300 es

out lowp vec4 color;

void main() {
    lowp float d = gl_FragCoord.w;
    color = vec4(vec3(d), 1.0);
}
