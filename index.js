import {cpus} from 'os';
import map from 'lodash.map';
import imagemin from 'imagemin';
import {makeRe} from 'minimatch';
import createThrottle from 'async-throttle';
import imageminPngquant from 'imagemin-pngquant';
import RawSource from 'webpack-sources/lib/RawSource';

export default class ImageminPlugin {
  constructor(options = {}) {
    // I love ES2015!
    const {
      test = /.*/,
      maxConcurrency = cpus().length,
      pngquant = null,
    } = options;

    this.options = {
      testRegexes: compileTestOption(test),
      maxConcurrency,
      imageminOptions: {
        plugins: [],
      },
    };

    // As long as the options aren't `null` then include the plugin. Let the destructuring above
    // control whether the plugin is included by default or not.
    for (let [plugin, pluginOptions] of [[imageminPngquant, pngquant]]) {
      if (pluginOptions !== null) {
        this.options.imageminOptions.plugins.push(plugin(pluginOptions));
      }
    }
  }

  apply(compiler) {
    // Pull out options needed here
    const {testRegexes} = this.options;

    // Access the assets once they have been assembled
    compiler.plugin('emit', async (compilation, callback) => {
      const throttle = createThrottle(this.options.maxConcurrency);

      try {
        await Promise.all([
          optimizeWebpackImages(
            throttle,
            compilation,
            testRegexes,
            this.options.imageminOptions
          ),
        ]);
        // At this point everything is done, so call the callback without anything in it
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }
}

/**
 * Optimize images from webpack and put them back in the asset array when done
 * @param  {Function} throttle       The setup throttle library
 * @param  {Object} compilation      The compilation from webpack-sources
 * @param  {RegExp} testRegexes       The regex to match if a specific image should be optimized
 * @param  {Object} imageminOptions  Options to pass to imageminOptions
 * @return {Promise}                 Resolves when all images are done being optimized
 */
async function optimizeWebpackImages(
  throttle,
  compilation,
  testRegexes,
  imageminOptions
) {
  return Promise.all(
    map(compilation.assets, (asset, filename) =>
      throttle(async () => {
        const assetSource = asset.source();
        // Skip the image if it's not a match for the regex
        if (testFile(filename, testRegexes)) {
          // Optimize the asset's source
          const optimizedImageBuffer = await optimizeImage(
            assetSource,
            imageminOptions
          );
          // Then write the optimized version back to the asset object as a "raw source"
          compilation.assets[filename] = new RawSource(optimizedImageBuffer);
        }
      })
    )
  );
}

/**
 * Optimizes a single image, returning the orignal if the "optimized" version is larger
 * @param  {Object}  imageData
 * @param  {Object}  imageminOptions
 * @return {Promise(asset)}
 */
async function optimizeImage(imageData, imageminOptions) {
  // Ensure that the contents i have are in the form of a buffer
  const imageBuffer = Buffer.isBuffer(imageData)
    ? imageData
    : Buffer.from(imageData, 'utf8');
  // And get the original size for comparison later to make sure it actually got smaller
  const originalSize = imageBuffer.length;

  // Await for imagemin to do the compression
  const optimizedImageBuffer = await imagemin.buffer(
    imageBuffer,
    imageminOptions
  );

  // If the optimization actually produced a smaller file, then return the optimized version
  if (optimizedImageBuffer.length < originalSize) {
    return optimizedImageBuffer;
  } else {
    // otherwize return the orignal
    return imageBuffer;
  }
}

/**
 * Tests a filename to see if it matches any of the given test globs/regexes
 * @param  {String} filename
 * @param  {Array} regexes
 * @return {Boolean}
 */
function testFile(filename, regexes) {
  for (let regex of regexes) {
    if (regex.test(filename)) {
      return true;
    }
  }
  return false;
}

/**
 * Compiles a regex, glob, or an array of globs to a single regex for testing later
 * @param  {RegExp|String|String[]} rawTestValue
 * @return {RegExp}
 */
function compileTestOption(rawTestValue) {
  const tests = Array.isArray(rawTestValue) ? rawTestValue : [rawTestValue];

  return tests.map((test) => {
    if (test instanceof RegExp) {
      // If it's a regex, just return it
      return test;
    } else if (typeof test === 'string') {
      // If it's a string, let minimatch convert it to a regex
      return makeRe(test);
    } else {
      throw new Error(
        'test parameter must be a regex, glob string, or an array of regexes or glob strings'
      );
    }
  });
}
