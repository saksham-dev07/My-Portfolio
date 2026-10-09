import * as THREE from 'three'

import shaderFragment from '../../shaders/floorShadow/fragment.glsl'
import shaderVertex from '../../shaders/floorShadow/vertex.glsl'

export default function()
{
    const uniforms = {
        tShadow: { value: null },
        uShadowColor: { value: null },
        uAlpha: { value: null }
    }

    const material = new THREE.ShaderMaterial({
        defines: { ERASED_TREE_COUNT: 0 },
        wireframe: false,
        transparent: true,
        uniforms,
        vertexShader: shaderVertex,
        fragmentShader: shaderFragment
    })

    return material
}
