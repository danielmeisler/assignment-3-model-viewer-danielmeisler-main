const fragmentShader = /* glsl */`
varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;

void main() {
    vec3 color = vec3(sin(uTime), cos(uTime * 1.5), abs(sin(uTime * 0.5)));
    gl_FragColor = vec4(color * vNormal * 0.5 + 0.5, 1.0);
}
`

export default fragmentShader;