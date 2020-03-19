import { FeatureMetatable } from './featureMetatableType';
import { KHRMeshInstancing } from './khrInstancingType';

export enum GltfComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126
}

export enum GltfType {
    SCALAR = 'SCALAR',
    VEC2 = 'VEC2',
    VEC3 = 'VEC3',
    VEC4 = 'VEC4',
    MAT2 = 'MAT2',
    MAT3 = 'MAT3',
    MAT4 = 'MAT4'
}

export interface GltfScene {
    nodes: number[];
}

export interface GltfNodeExtensions {
    KHR_mesh_instancing?: KHRMeshInstancing;
}

export interface GltfNode {
    name?: string;
    mesh?: number;
    children?: number[];
    rotation?: number[];
    scale?: number[];
    translation?: number[];
    matrix?: number[];
    extensions?: GltfNodeExtensions;
}

export interface GltfBuffer {
    uri?: string;
    byteLength: number;
}

export interface GltfBufferView {
    buffer: number;
    byteLength: number;
    byteOffset: number;
    target: GLenum;
}

export interface GltfAccessor {
    bufferView: number;
    byteOffset: number;
    componentType: GLenum;
    count: number;
    max?: number[];
    min?: number[];
    type: GltfType;
}

export interface GltfMesh {
    primitives?: GltfPrimitives;
}

export interface GltfPrimitives {
    attributes?: { [key: string]: number }[];
    indices?: number;
    material?: number;
    mode?: number;
}

export interface GltfExtensions {
    CESIUM_3dtiles_feature_metadata?: FeatureMetatable;
}

// TODO: Missing textures, images, materials.
//       Update this when the interface is missing something
//       you need!

export interface Gltf {
    scenes?: GltfScene[];
    nodes: GltfNode[];
    meshes: GltfMesh[];
    buffers: GltfBuffer[];
    bufferViews: GltfBufferView[];
    accessors: GltfAccessor[];
    asset: any[];
    extensions?: GltfExtensions;
    extensionsUsed?: string[];
}
