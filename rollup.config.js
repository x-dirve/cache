const typescript = require("rollup-plugin-typescript2");
const resolve = require("rollup-plugin-node-resolve");
const cjs = require("rollup-plugin-commonjs");
const alias = require("rollup-plugin-alias");
const buble = require("rollup-plugin-buble");
const babel = require("rollup-plugin-babel");
const { join } = require("path");

const cwd = __dirname;

const baseConfig = {
    "input": join(cwd, "src/index.ts")
    ,"output": [
        {
            "file": join(cwd, "dist/index.js")
            ,"format": "cjs"
            ,"sourcemap": true
            ,"exports": "named"
        }
    ]
    ,"plugins": [
        resolve({
            preferBuiltins: false
        })
        ,cjs()
        ,babel({
            "babelrc": false
            ,"presets": [
                ["@babel/preset-env", {
                    modules: false
                }]
            ]
            ,"plugins": [
                [
                    "import"
                    , {
                        "libraryName": "@x-drive/utils"
                        , "libraryDirectory": "dist/libs"
                        , "camel2DashComponentName": false
                    }
                    , "@x-drive/utils"
                ]
            ]
            , "include": "node_modules/@x-drive"

        })
        ,typescript()
        ,buble()
    ]
}
const esmConfig = Object.assign({}, baseConfig, {
    "output": Object.assign({}, baseConfig.output, {
        "sourcemap": true
        ,"format": "es"
        ,"file": join(cwd, "dist/index.esm.js")
    }),
    "plugins": [
        babel({
            "babelrc": false
            ,"presets": [
                ["@babel/preset-env", {
                    "modules": false
                }]
            ]
            ,"plugins": [
                [
                    "import"
                    , {
                        "libraryName": "@x-drive/utils"
                        , "libraryDirectory": "dist/libs"
                        , "camel2DashComponentName": false
                    }
                    , "@x-drive/utils"
                ]
            ]
            , "include": "node_modules/@x-drive"

        })
        ,alias({
            "entries": [
                {
                    "find": "@x-drive/utils",
                    "replacement": join(cwd, "node_modules/@x-drive/utils/dist/index.esm")
                }
            ]
        })
        ,typescript()
    ]
})

function rollup() {
    const target = process.env.TARGET

    if (target === "umd") {
        return baseConfig
    } else if (target === "esm") {
        return esmConfig
    } else {
        return [baseConfig, esmConfig]
    }
}
module.exports = rollup()
