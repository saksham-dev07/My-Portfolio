varying vec2 vUv;
varying vec2 vShadowWorld;

void main()
{
    vUv = uv;
    vShadowWorld = (modelMatrix * vec4(position, 1.0)).xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
