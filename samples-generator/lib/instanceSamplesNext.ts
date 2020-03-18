const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;
const gltfToGlb = gltfPipeline.gltfToGlb;

import fsExtra = require('fs-extra');
import path = require('path');
import { InstanceTile } from './instanceUtilsNext';
import { SamplesGeneratorArguments } from './arguments';
import { addBinaryBuffers } from './gltfUtil';
import { Gltf } from './gltfType';
import { toCamelCase } from './utility';
import { addKHRMeshInstancingExtension } from './createKHRMeshInstancingExtension';
import saveJson = require('./saveJson');
import saveBinary = require('./saveBinary');
import { TilesetJson } from './tilesetJson';
import createTilesetJsonSingle = require('./createTilesetJsonSingle');

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
    ) {
        const opts = getDefaultOpts();
        const tilesetName = 'InstancedWithoutBatchTable';
        const ext = args.useGlb ? '.glb' : '.gltf';
        const fileName = toCamelCase(tilesetName) + ext;
        const tilesetOpts = getTilesetOpts(
            fileName,
            args.geometricError,
            args.versionNumber
        );

        const tileDestination = path.join(opts.rootDir, tilesetName, fileName);

        const tilesetDestination = path.join(
            opts.rootDir,
            tilesetName,
            'tileset.json'
        );

        const positions = InstanceTile.getPositions(
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

        const tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await saveJson(
            tilesetDestination,
            tilesetJson,
            args.prettyJson,
            args.gzip
        );
        if (!args.useGlb) {
            await saveJson(tileDestination, gltf, args.prettyJson, args.gzip);
        } else {
            const result = (await gltfToGlb(gltf, args.gltfConversionOptions))
                .glb;
            await saveBinary(tileDestination, result, args.gzip);
        }
    }
}
