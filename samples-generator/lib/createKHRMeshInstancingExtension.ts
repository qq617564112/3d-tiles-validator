import { Gltf, GltfNode } from './gltfType';
import { KHRMeshInstancing } from './khrInstancingType';
const extensionName = 'KHR_mesh_instancing';

export function addKHRMeshInstancingExtension(
    gltf: Gltf,
    node: GltfNode,
    khrMeshInstancing: KHRMeshInstancing
) {
    if (gltf.extensionsUsed == null) {
        gltf.extensionsUsed = [extensionName];
    } else {
        gltf.extensionsUsed.push(extensionName);
    }

    if (node.extensions == null) {
        node.extensions = {};
    }

    node.extensions.KHR_mesh_instancing = khrMeshInstancing;
}
