var webpack = require('webpack');
var path = require('path');
var slugify = require('transliteration').slugify;
var md = require('markdown-it')();
var striptags = require('./strip-tags');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var version = require('../package.json').version;
var getPoastcssPlugin = require('./utils/postcss_pipe');

function convert(str) {
  str = str.replace(/(&#x)(\w{4});/gi, function($0) {
    return String.fromCharCode(parseInt(encodeURIComponent($0).replace(/(%26%23x)(\w{4})(%3B)/g, '$2'), 16));
  });
  return str;
}

function wrap(render) {
  return function() {
    return render.apply(this, arguments)
      .replace('<code class="', '<code class="hljs ')
      .replace('<code>', '<code class="hljs">');
  };
};

module.exports = {
  entry: {
    'zanui-docs': './docs/index.js',
    'zanui-examples': './docs/examples.js'
  },
  output: {
    path: './docs/build/',
    publicPath: 'docs/build/',
    filename: '[name].js'
  },
  resolve: {
    modules: [
      path.join(__dirname, '../node_modules'),
      'node_modules'
    ],
    extensions: ['.js', '.vue', '.pcss'],
    alias: {
      'vue$': 'vue/dist/vue.runtime.common.js',
      'zanui': path.join(__dirname, '..'),
      'src': path.join(__dirname, '../src'),
      'packages': path.join(__dirname, '../packages'),
      'lib': path.join(__dirname, '../lib'),
      'components': path.join(__dirname, '../docs/components')
    }
  },
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules|vue-router\/|vue-loader\/|vue-hot-reload-api\//,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader!postcss-loader'
      },
      {
        test: /\.md/,
        loader: 'vue-markdown-loader'
      },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        loader: 'url-loader'
      }
    ]
  },
  devtool: 'source-map'
};

if (process.env.NODE_ENV === 'production') {
  delete module.exports.devtool;
  module.exports.plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      },
      sourceMap: false
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      options: {
        postcss: getPoastcssPlugin,
        babel: {
          presets: ['es2015'],
          plugins: ['transform-runtime', 'transform-vue-jsx']
        },
        eslint: {
          formatter: require('eslint-friendly-formatter')
        },
        vue: {
          autoprefixer: false,
          postcss: getPoastcssPlugin
        },
        vueMarkdown: {
          use: [
            [require('markdown-it-anchor'), {
              level: 2,
              slugify: slugify,
              permalink: true,
              permalinkBefore: true
            }],
            [require('markdown-it-container'), 'demo', {
              validate: function(params) {
                return params.trim().match(/^demo\s*(.*)$/);
              },

              render: function(tokens, idx) {
                var m = tokens[idx].info.trim().match(/^demo\s*(.*)$/);
                if (tokens[idx].nesting === 1) {
                  var description = (m && m.length > 1) ? m[1] : '';
                  var content = tokens[idx + 1].content;
                  var html = convert(striptags.strip(content, ['script', 'style']));

                  return `<demo-block class="demo-box">
                            <div class="examples" slot="examples">${html}</div>
                            <div class="highlight" slot="highlight">`;
                }
                return '</div></demo-block>\n';
              }
            }]
          ],
          preprocess: function(MarkdownIt, source) {
            MarkdownIt.renderer.rules.table_open = function() {
              return '<table class="table">';
            };
            MarkdownIt.renderer.rules.fence = wrap(MarkdownIt.renderer.rules.fence);
            return source;
          }
        }
      }
    })
  ];
} else {
  module.exports.plugins = [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      options: {
        postcss: getPoastcssPlugin,
        babel: {
          presets: ['es2015'],
          plugins: ['transform-runtime', 'transform-vue-jsx']
        },
        eslint: {
          formatter: require('eslint-friendly-formatter')
        },
        vue: {
          autoprefixer: false,
          postcss: getPoastcssPlugin
        },
        vueMarkdown: {
          use: [
            [require('markdown-it-anchor'), {
              level: 2,
              slugify: slugify,
              permalink: true,
              permalinkBefore: true
            }],
            [require('markdown-it-container'), 'demo', {
              validate: function(params) {
                return params.trim().match(/^demo\s*(.*)$/);
              },

              render: function(tokens, idx) {
                var m = tokens[idx].info.trim().match(/^demo\s*(.*)$/);
                if (tokens[idx].nesting === 1) {
                  var description = (m && m.length > 1) ? m[1] : '';
                  var content = tokens[idx + 1].content;
                  var html = convert(striptags.strip(content, ['script', 'style']));

                  return `<demo-block class="demo-box">
                            <div class="examples" slot="examples">${html}</div>
                            <div class="highlight" slot="highlight">`;
                }
                return '</div></demo-block>\n';
              }
            }]
          ],
          preprocess: function(MarkdownIt, source) {
            MarkdownIt.renderer.rules.table_open = function() {
              return '<table class="table">';
            };
            MarkdownIt.renderer.rules.fence = wrap(MarkdownIt.renderer.rules.fence);
            return source;
          }
        }
      }
    })
  ];
};
