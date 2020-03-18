import { Gltf } from "./gltfType";
import { TilesetJson } from "./tilesetJson";

export interface GeneratedTileResult {
    gltf: Gltf,
    tileset: TilesetJson
    tileDestination: string
    tilesetDestination: string
}