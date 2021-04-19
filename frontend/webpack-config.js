module.exports = {
    devtool: 'source-map',
    entry: "./app.tsx",
    mode: "development",
    output: {
        filename: "./app-bundle.js"
    },
    resolve: {
        extensions: ['.Webpack.js', '.web.js', '.ts', '.js', '.jsx', '.tsx', '.css']
    },
    module: {
        rules: [
            {
                test: /\.tsx$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'ts-loader'
                }
            }, {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ]
    }
}
