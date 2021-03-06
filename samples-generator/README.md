# 3D Tiles Samples Generator

The tilesets generated here are included in [3d-tiles-samples](https://github.com/CesiumGS/3d-tiles-samples) and [Cesium](https://github.com/CesiumGS/cesium).

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:

```
npm install

npm run build

cd dist/

node bin/3d-tiles-samples-generator.js
```

This commands generates a set of tilesets and saves them in a folder called `output`. The `Batched`, `Composite`, `Instanced`, `PointCloud`, and `Tilesets` folders may be copied directly to CesiumJS's `Specs/Data/Cesium3DTiles/` folder for testing with CesiumJS. The tilesets in the `Samples` folder may be copied to the `tilesets` folder in `3d-tiles-samples`.

Run the tests:
```
npm run test
```
To run ESLint on the entire codebase, run:
```
npm run eslint
```
To run ESLint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run eslint-watch
```

## Auto Recompilation
You can use
```
npm run watch
```

to automatically recompile your changes while editing.

## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/CesiumGS/cesium/blob/master/CONTRIBUTING.md) and [Coding Guide](https://github.com/CesiumGS/cesium/blob/master/Documentation/Contributors/CodingGuide/README.md) used for [CesiumJS](https://cesium.com/cesiumjs/).

---

<p align="center">
<a href="https://cesium.com/"><img src="doc/cesium.png" onerror="this.src='cesium.png'"/></a>
</p>
