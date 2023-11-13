const vertexShader = /* glsl */`
varying vec2 vUv;
varying vec3 vNormal;

uniform float uTime;
uniform float uAmplitude;

void main() {
    vUv = uv;
    vNormal = normal;

    vec3 newPosition = position + normal * sin(uTime) * uAmplitude;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`

export default vertexShader;