#version 300 es

in highp vec3 position;
in highp vec3 normal;
in highp vec2 texCoord;

uniform highp mat4 matrix;
uniform highp mat4 normalMatrix;

out highp vec3 pNormal;
out highp vec2 pTexCoord;

void main() {
    pNormal = normalize(normalMatrix * vec4(normal, 0.0)).xyz;
    pTexCoord = texCoord;
    //    pNormal = vec4(normal, 0.0);
    gl_Position = matrix * vec4(position, 1.0);

}
