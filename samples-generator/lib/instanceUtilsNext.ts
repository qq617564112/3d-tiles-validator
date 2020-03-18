import { FLOAT32_SIZE_BYTES } from './typeSize';
import { InstancesTileResult } from './createInstancesTile';
import { Attribute } from './attribute';
import { GltfType } from './gltfType';
const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;
const Cartesian2 = Cesium.Cartesian2;
const Cartesian3 = Cesium.Cartesian3;

export namespace InstanceTileUtils {
    export interface FeatureTableJson {
        INSTANCES_LENGTH?: number;
        RTC_CENTER?: [number, number, number];
        QUANTIZED_VOLUME_SCALE?: [number, number, number];
        QUANTIZED_VOLUME_OFFSET?: [number, number, number];
        EAST_NORTH_UP?: boolean;
        property?: {
            [name: string]: { byteOffset: number; componentType: number };
        };
    }

    export function generateBatchTable(instancesLength: number, modelSize: number) {
        return {
            Height : new Array(instancesLength).fill(modelSize)
        };
    }

    export function generateBatchTableBinary(instancesLength: number) {
        const idBuffer = Buffer.alloc(instancesLength * FLOAT32_SIZE_BYTES);
        for (let i = 0; i < instancesLength; ++i) {
            idBuffer.writeUInt32LE(i, i * FLOAT32_SIZE_BYTES);
        }

        const batchTableJson = {
            id: {
                byteOffset: 0,
                componentType: 'UNSIGNED_INT',
                type: 'SCALAR'
            }
        };

        return {
            json: batchTableJson,
            binary: idBuffer
        };
    }

    export function genFeatureTableJson(
        featureTableBinary: Buffer,
        attributes: Attribute[]
    ): FeatureTableJson {
        const out: FeatureTableJson = {};

        for (let i = 0; i < attributes.length; ++i) {
            let attribute = attributes[i];
            out[attribute.propertyName] = {
                byteOffset: attribute.byteOffset,
                componentType: attribute.componentType // Only defined for batchIds
            };
            attribute.buffer.copy(featureTableBinary, attribute.byteOffset);
            return {} as any;
        }
    }

    export function getPositions(
        instancesLength: number,
        tileWidth: number,
        modelSize: number,
        transform: number[]
    ): Attribute {
        const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);

        const min = new Array(3).fill(+Infinity);
        const max = new Array(3).fill(-Infinity);

        for (let i = 0; i < instancesLength; ++i) {
            const position = getPosition(
                i,
                instancesLength,
                tileWidth,
                modelSize,
                transform
            );

            buffer.writeFloatLE(position.x, i * 3 * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(position.y, (i * 3 + 1) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(position.z, (i * 3 + 2) * FLOAT32_SIZE_BYTES);

            min[0] = Math.min(min[0], position.x);
            min[1] = Math.min(min[1], position.y);
            min[2] = Math.min(min[2], position.z);
            max[0] = Math.max(max[0], position.x);
            max[1] = Math.max(max[1], position.y);
            max[2] = Math.max(max[2], position.z);
        }

        return {
            buffer: buffer,
            propertyName: 'POSITION',
            byteAlignment: FLOAT32_SIZE_BYTES,
            componentType: 5126, // Float,
            count: instancesLength,
            min: min,
            max: max,
            type: GltfType.VEC3
        };
    }

    export function getPosition(
        i,
        instancesLength,
        tileWidth,
        modelSize,
        transform
    ) {
        const width = Math.round(Math.sqrt(instancesLength));
        let x = i % width;
        let y = Math.floor(i / width);
        let z = 0.0;

        x = x / (width - 1) - 0.5;
        y = y / (width - 1) - 0.5;

        x *= tileWidth - modelSize * 2.0;
        y *= tileWidth - modelSize * 2.0;

        let position = new Cartesian3(x, y, z);
        Matrix4.multiplyByPoint(transform, position, position);

        return position;
    }


}
