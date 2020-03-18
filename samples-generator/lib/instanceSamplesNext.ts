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

    function getTilesetOpts(
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
        args: SamplesGeneratorArguments,
        skipTilesetJson: boolean = false
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
        const tileFolderName = 'InstancedWithoutBatchTable';
        const tileFilename = toCamelCase(tileFolderName) + ext;

        let tilesetJson: TilesetJson = null;
        if (!skipTilesetJson) {
            const tilesetOpts = getTilesetOpts(
                tileFilename,
                args.geometricError,
                args.versionNumber
            );
            tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        }

        return {
            gltf: gltf,
            tileset: tilesetJson,
            rootDir: opts.rootDir,
            tileFolderName: tileFolderName,
            tileFilename: tileFilename
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
        const tileFolderName = 'InstancedWithBatchTable';
        const tileFilename = toCamelCase(tileFolderName) + ext;

        const result = await createInstancedWithoutBatchTable(args, true);
        result.gltf = createFeatureMetadataExtension(
            result.gltf,
            batchTableJson as any,
            undefined
        );

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        return {
            gltf: result.gltf,
            tileset: tilesetJson,
            rootDir: opts.rootDir,
            tileFolderName: tileFolderName,
            tileFilename: tileFilename
        };
    }

    export async function createInstancedWithBinaryBatchTable(
        args: SamplesGeneratorArguments
    ): Promise<GeneratedTileResult> {
        const opts = getDefaultOpts();
        const batchTableBinary = InstanceTileUtils.generateBatchTableBinary(
            opts.instancesLength,
            opts.modelSize
        );

        const ext = args.useGlb ? '.glb' : '.gltf';
        const tileFolderName = 'InstancedWithBinaryBatchTable';
        const tileFilename = toCamelCase(tileFolderName) + ext;

        const result = await createInstancedWithoutBatchTable(args, true);
        result.gltf = createFeatureMetadataExtension(
            result.gltf,
            batchTableBinary.json as any,
            batchTableBinary.binary
        );

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        return {
            gltf: result.gltf,
            tileset: tilesetJson,
            rootDir: opts.rootDir,
            tileFolderName: tileFolderName,
            tileFilename: tileFilename
        };
    }
}
