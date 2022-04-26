#version 300 es

in highp vec4 pNormal;

out lowp vec4 color;

void main() {
    lowp float d = gl_FragCoord.w;
    highp float n = dot(normalize(pNormal.xyz), normalize(vec3(1.0, 1.0, 1.0)));
    n = clamp(n, 0.0, 1.0) * 0.8 + 0.2;
    n = pow(n, 0.7);
    color = vec4(n, n, n, 1.0);
}
