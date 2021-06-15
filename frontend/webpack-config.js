module.exports = {
    devtool: 'source-map',
    entry: "./src/app.tsx",
    mode: "development",
    output: {
        filename: "./app-bundle.js"
    },
    resolve: {
        extensions: ['.Webpack.js', '.web.js', '.ts','.d.ts', '.js', '.jsx', '.tsx', '.css', '.scss']
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'ts-loader'
                }
            }, {
                test: /\.s[ac]ss$/i,
                use: [
                  "style-loader","css-loader","sass-loader"],
              },
        ]
    }
}
