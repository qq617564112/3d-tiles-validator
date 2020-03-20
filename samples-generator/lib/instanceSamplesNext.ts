const Cesium = require('cesium');
const Cartesian3 = Cesium.Cartesian3;
const Matrix4 = Cesium.Matrix4;
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;
const gltfToGlb = gltfPipeline.gltfToGlb;
const util = require('../lib/utility');
const wgs84Transform = util.wgs84Transform;

import { InstanceTileUtils } from './instanceUtilsNext';
import { SamplesGeneratorArguments as GeneratorArgs } from './arguments';
import { addBinaryBuffers } from './gltfUtil';
import { Gltf } from './gltfType';
import { toCamelCase } from './utility';
import { addKHRMeshInstancingExtension } from './createKHRMeshInstancingExtension';
import { TilesetJson } from './tilesetJson';
import saveJson = require('./saveJson');
import saveBinary = require('./saveBinary');
import createTilesetJsonSingle = require('./createTilesetJsonSingle');
import fsExtra = require('fs-extra');
import path = require('path');
import createFeatureMetadataExtension = require('./createFeatureMetadataExtension');

export namespace InstanceSamplesNext {

    const instancesModelSize = 20.0;
    const longitude = -1.31968;
    const latitude = 0.698874;

    interface TileOptions {
        instancesLength: number;
        tileWidth: number;
        modelSize: number;
        instancesUri: string;
        rootDir: string;
        embed: boolean;
        transform: object; // should be a Cesium.Matrix4
    }

    function getDefaultTileOptions(): TileOptions {
        return {
            instancesLength: 25,
            tileWidth: 200,
            modelSize: 20,
            instancesUri: 'data/box.glb',
            rootDir: path.join('output', 'Instanced'),
            embed: false,
            transform: wgs84Transform(longitude, latitude, instancesModelSize / 2.0)
        }
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

    async function getGltfFromUri(
        uri: string,
        gltfConversionOptions: { resourceDirectory: string }
    ): Promise<Gltf> {
        const glb = (await fsExtra.readFile(uri)) as Buffer;
        return (await glbToGltf(glb, gltfConversionOptions)).gltf as Gltf;
    }

    async function writeOutputToDisk(
        destFolder: string,
        tileFileName: string,
        tileset: TilesetJson,
        gltf: Gltf,
        args: GeneratorArgs
    ) {
        const tilesetDestination = path.join(destFolder, 'tileset.json');
        await saveJson(tilesetDestination, tileset, args.prettyJson, args.gzip);

        let tileDestination = path.join(destFolder, tileFileName);
        if (!args.useGlb) {
            await saveJson(tileDestination, gltf, args.prettyJson, args.gzip);
        } else {
            const glb = (await gltfToGlb(gltf, args.gltfConversionOptions)).glb;
            await saveBinary(tileDestination, glb, args.gzip);
        }
    }

    export async function createInstancedWithoutBatchTable(
        args: GeneratorArgs
    ) {
        const opts = getDefaultTileOptions();
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithoutBatchTable';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedWithBatchTable(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        let gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const batchTableJson = InstanceTileUtils.generateBatchTable(
            opts.instancesLength,
            opts.modelSize
        );

        createFeatureMetadataExtension(gltf, batchTableJson as any, undefined);

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithBatchTable';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedWithBinaryBatchTable(
        args: GeneratorArgs
    ) {
        const opts = getDefaultTileOptions();
        let gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const binaryBatchTableJson = InstanceTileUtils.generateBatchTableBinary(
            opts.instancesLength,
            opts.modelSize
        );

        createFeatureMetadataExtension(
            gltf,
            binaryBatchTableJson.json as any,
            binaryBatchTableJson.binary
        );

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithBinaryBatchTable';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedOrientation(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        let gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const quaternions = InstanceTileUtils.getQuaternionNormals(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const quaternionsAccessorIndex = positionAccessorIndex + 1;
        addBinaryBuffers(
            gltf,
            positions,
            quaternions
        );

        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                ROTATION: quaternionsAccessorIndex
            }
        });

        const binaryBatchTableJson = InstanceTileUtils.generateBatchTableBinary(
            opts.instancesLength,
            opts.modelSize
        );

        createFeatureMetadataExtension(
            gltf,
            binaryBatchTableJson.json as any,
            binaryBatchTableJson.binary
        );

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedOrientation';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedScaleNonUniform(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const nonUniformScales = InstanceTileUtils.getNonUniformScales(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const nonUniformScalesAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, nonUniformScales);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                SCALE: nonUniformScalesAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedScaleNonUniform';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedScale(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const uniformScale = InstanceTileUtils.getUniformScales(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const uniformScaleAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, uniformScale);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                SCALE: uniformScaleAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedScale';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedRTC(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const center = Matrix4.multiplyByPoint(
            opts.transform,
            new Cartesian3(),
            new Cartesian3()
        );

        const rtcPositions = InstanceTileUtils.getPositionsRTC(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform,
            center
        );

        const rtcPositionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, rtcPositions);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: rtcPositionAccessorIndex
            }
        });

        gltf.nodes = [{
                name: 'RTC_CENTER',
                mesh: gltf.nodes[0].mesh!,
                translation: [center.x, center.y, center.z],
                extensions: gltf.nodes[0].extensions!
            }
        ];

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedRTC';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    /* // TODO: Figure out how we want to handle EAST_NORTH_UP in .gltf world
    export async function createInstancedWithTransform(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        opts.transform = Matrix4.IDENTITY;

        const instancesTransform = wgs84Transform(
            longitude,
            latitude,
            instancesModelSize / 2.0
        );
        const center = Matrix4.multiplyByPoint(opts.transform, new Cartesian3(), new Cartesian3());
        const instancesTileWidth = opts.tileWidth;
        // Just a little extra padding at the top for aiding Cesium tests
        const instancesHeight = instancesModelSize + 10.0; 

        // prettier-ignore
        const instancesBoxLocal = [
            0.0, 0.0, 0.0,                      // center
            instancesTileWidth / 2.0, 0.0, 0.0, // width
            0.0,instancesTileWidth / 2.0, 0.0,  // depth
            0.0, 0.0, instancesHeight / 2.0     // height
        ];

        const tileOptions = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        //if eastnorth is u, then set EAST_NORTH_UP in the feature table to true?

        tileOptions.transform = instancesTransform;
        tileOptions.box = instancesBoxLocal;
        tileOptions.eastNorthUp = false;
    }
    */

    export async function createInstancedRedMaterial(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        opts.instancesUri = 'data/red_box.glb';
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        addKHRMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedRedMaterial';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }
}
