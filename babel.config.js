module.exports = {
    presets: [
        [
            "@babel/env"
            , {
                "targets": {
                    "node": "current"
                }
            }
        ]
        ,"@babel/typescript"
    ],
    plugins: [
        "@babel/plugin-proposal-class-properties"
        , [
            "import"
            , {
                "libraryName": "@x-drive/utils"
                , "libraryDirectory": "dist/libs"
                , "camel2DashComponentName": false
            }
            , "@x-drive/utils"
        ]
    ]
}
