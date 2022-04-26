#version 300 es

in highp vec4 pNormal;
in highp vec2 pTexCoord;

uniform lowp sampler2D diffuseTexture;

out lowp vec4 color;

void main() {
    lowp float d = gl_FragCoord.w;
    highp float n = dot(normalize(pNormal.xyz), normalize(vec3(1.0, 1.0, 1.0)));
    n = clamp(n, 0.0, 1.0) * 0.8 + 0.2;
    lowp vec4 diffuse = texture(diffuseTexture, pTexCoord);
    color = diffuse * n;
    color = vec4(n, n, n, 1.0) * diffuse;

    color = pow(color, vec4(0.7));
}
