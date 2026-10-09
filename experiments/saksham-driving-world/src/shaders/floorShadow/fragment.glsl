uniform sampler2D tShadow;
uniform vec3 uShadowColor;
uniform float uAlpha;

varying vec2 vUv;
varying vec2 vShadowWorld;

#if ERASED_TREE_COUNT > 0
uniform vec4 uErasedTrees[ERASED_TREE_COUNT];
uniform vec2 uTreeShadowDirection;
#endif

void main()
{
    float shadowAlpha = 1.0 - texture2D(tShadow, vUv).r;
    shadowAlpha *= uAlpha;

    #if ERASED_TREE_COUNT > 0
    for(int i = 0; i < ERASED_TREE_COUNT; i++)
    {
        vec4 tree = uErasedTrees[i];
        vec2 ray = uTreeShadowDirection * tree.w;
        float along = clamp(dot(vShadowWorld - tree.xy, ray) / max(dot(ray, ray), .001), 0.0, 1.0);
        float distanceToTree = length(vShadowWorld - tree.xy - along * ray);
        shadowAlpha *= smoothstep(tree.z * .8, tree.z + .5, distanceToTree);
    }
    #endif

    gl_FragColor = vec4(uShadowColor, shadowAlpha);
}
