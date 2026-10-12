uniform sampler2D uTexture;
uniform vec3 uColor;
uniform float uTextureAlpha;
uniform float uScreenTime;
uniform float uScreenMotion;

varying vec2 vUv;

void main()
{
    vec4 textureColor = texture2D(uTexture, vUv);

    gl_FragColor = mix(vec4(uColor, 1.0), textureColor, uTextureAlpha);
    // A gentle refresh shimmer, not flashes or repeated texture uploads.
    float refresh = .992 + .008 * sin(vUv.y * 55.0 - uScreenTime * 1.7);
    gl_FragColor.rgb *= mix(1.0, refresh, uScreenMotion * uTextureAlpha);
	#include <colorspace_fragment>
}
