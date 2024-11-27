const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    webpack: (config) => {
        config.output = {
            ...config.output,
            path: path.resolve(__dirname, 'electron/build'), // 输出目录
            publicPath: '.', // 根路径
        };

        // 确保 public 文件夹中的资源被复制
        config.plugins.push(
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'public'), // 源文件夹
                        to: path.resolve(__dirname, 'electron/build'), // 目标文件夹
                        globOptions: {
                            ignore: ['**/index.html'], // 不复制 index.html（Webpack 已处理）
                        },
                    },
                ],
            })
        );

        return config;
    },
};