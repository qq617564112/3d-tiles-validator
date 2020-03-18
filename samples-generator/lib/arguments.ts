export interface SamplesGeneratorArguments {
    use3dTilesNext: boolean;
    useGlb: boolean;
    gltfConversionOptions: {[resourceDirectory: string]: string}
    prettyJson: boolean,
    gzip: boolean,
    geometricError: number,
    versionNumber: string
}