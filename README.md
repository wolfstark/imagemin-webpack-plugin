# Imagemin plugin for Webpack

[![npm](https://img.shields.io/npm/v/pngmin-webpack-plugin.svg)](https://www.npmjs.com/package/pngmin-webpack-plugin)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm](https://img.shields.io/npm/dt/pngmin-webpack-plugin.svg)](https://www.npmjs.com/package/pngmin-webpack-plugin)
[![donate](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://www.coinbase.com/Klathmon)

This is a simple plugin that uses [Pngmin](https://github.com/wolfstark/pngmin-webpack-plugin) to compress PNG in your project.

## Install

`npm install pngmin-webpack-plugin`

Requires node >=4.0.0

## Example Usage

```js
var PngminPlugin = require('pngmin-webpack-plugin').default
// Or if using ES2015:
// import PngminPlugin from 'pngmin-webpack-plugin'

module.exports = {
  plugins: [
    // Make sure that the plugin is after any plugins that add images
    new PngminPlugin({
      pngquant: {
        quality: '95-100'
      }
    })
  ]
}
```

Working with [copy-webpack-plugin](https://github.com/kevlened/copy-webpack-plugin):

```js
module.exports = {
  plugins: [
    // Copy the images folder and optimize all the images
    new CopyWebpackPlugin([{
      from: 'images/'
    }]),
    new PngminPlugin({
      pngquant: {
        quality: '95-100'
      }
    })
  ]
}
```

## Contributing

The code is written in ES6 using [Javascript Standard Style](https://github.com/feross/standard). Feel free to make PRs adding features you want, but please try to follow Standard. Also, codumentation/readme PRs are more then welcome!

## License

[MIT](LICENSE.md) Copyright (c) [Gregory Benner](https://github.com/wolfstark)
