const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;

import { InstanceTileUtils } from './instanceUtilsNext';
import { SamplesGeneratorArguments } from './arguments';
import { addBinaryBuffers } from './gltfUtil';
import { Gltf } from './gltfType';
import { toCamelCase } from './utility';
import { addKHRMeshInstancingExtension } from './createKHRMeshInstancingExtension';
import { TilesetJson } from './tilesetJson';
import { GeneratedTileResult } from './generatedTileResult';
import saveJson = require('./saveJson');
import saveBinary = require('./saveBinary');
import createTilesetJsonSingle = require('./createTilesetJsonSingle');
import fsExtra = require('fs-extra');
import path = require('path');
import createFeatureMetadataExtension = require('./createFeatureMetadataExtension');

export namespace InstanceSamplesNext {
    function getDefaultOpts() {
        return {
            instancesLength: 25,
            tileWidth: 200,
            modelSize: 20,
            transform: Matrix4.IDENTITY,
            instancesUri: 'data/box.glb',
            rootDir: path.join('output', 'Instanced'),
            embed: false
        };
    }

    export function getTilesetOpts(
        contentUri: string,
        geometricError: number,
        versionNumber: string
    ): TilesetJson {
        return {
            contentUri: contentUri,
            geometricError: geometricError,
            versionNumber: versionNumber
        };
    }

    export async function createInstancedWithoutBatchTable(
        args: SamplesGeneratorArguments
    ): Promise<GeneratedTileResult> {
        const opts = getDefaultOpts();
        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const glb = (await fsExtra.readFile(opts.instancesUri)) as Buffer;
        const gltf = (await glbToGltf(glb, args.gltfConversionOptions))
            .gltf as Gltf;

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'InstancedWithoutBatchTable';
        const fileName = toCamelCase(tilesetName) + ext;
        const tilesetOpts = getTilesetOpts(
            fileName,
            args.geometricError,
            args.versionNumber
        );

        const tileFolder = path.join(opts.rootDir, tilesetName);
        const tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        return {
            gltf: gltf,
            tileset: tilesetJson,
            tileDestination: path.join(tileFolder, fileName),
            tilesetDestination: path.join(tileFolder, 'tileset.json')
        };
    }

    export async function createInstancedWithBatchTable(
        args: SamplesGeneratorArguments
    ): Promise<GeneratedTileResult> {
        const opts = getDefaultOpts();
        const batchTableJson = InstanceTileUtils.generateBatchTable(
            opts.instancesLength,
            opts.modelSize
        );

        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'InstancedWithBatchTable';
        const fileName = toCamelCase(tilesetName) + ext;
        const tileFolder = path.join(opts.rootDir, tilesetName);

        const result = await createInstancedWithoutBatchTable(args);
        result.gltf = createFeatureMetadataExtension(
            result.gltf,
            batchTableJson as any,
            undefined
        );

        return {
            gltf: result.gltf,
            tileset: result.tileset,
            tileDestination: path.join(tileFolder, fileName),
            tilesetDestination: path.join(tileFolder, 'tileset.json')
        }
    }
}
