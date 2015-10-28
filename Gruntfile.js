var fs = require('fs');

module.exports = function(grunt) {
  var coreJsFiles = [
    // Core:
    'src/sigma.core.js',

    // Utils:
    'src/conrad.js',
    'src/utils/sigma.utils.js',
    'src/utils/sigma.polyfills.js',

    // Main classes:
    'src/sigma.settings.js',
    'src/classes/sigma.classes.dispatcher.js',
    'src/classes/sigma.classes.configurable.js',
    'src/classes/sigma.classes.graph.js',
    'src/classes/sigma.classes.camera.js',
    'src/classes/sigma.classes.quad.js',

    // Captors:
    'src/captors/sigma.captors.mouse.js',
    'src/captors/sigma.captors.touch.js',

    // Renderers:
    'src/renderers/sigma.renderers.canvas.js',
    'src/renderers/sigma.renderers.webgl.js',
    'src/renderers/sigma.renderers.svg.js',
    'src/renderers/sigma.renderers.def.js',

    // Sub functions per engine:
    'src/renderers/webgl/sigma.webgl.nodes.def.js',
    'src/renderers/webgl/sigma.webgl.nodes.fast.js',
    'src/renderers/webgl/sigma.webgl.edges.def.js',
    'src/renderers/webgl/sigma.webgl.edges.fast.js',
    'src/renderers/webgl/sigma.webgl.edges.arrow.js',
    'src/renderers/canvas/sigma.canvas.labels.def.js',
    'src/renderers/canvas/sigma.canvas.hovers.def.js',
    'src/renderers/canvas/sigma.canvas.nodes.def.js',
    'src/renderers/canvas/sigma.canvas.edges.def.js',
    'src/renderers/canvas/sigma.canvas.edges.curve.js',
    'src/renderers/canvas/sigma.canvas.edges.arrow.js',
    'src/renderers/canvas/sigma.canvas.edges.curvedArrow.js',
    'src/renderers/canvas/sigma.canvas.edgehovers.def.js',
    'src/renderers/canvas/sigma.canvas.edgehovers.curve.js',
    'src/renderers/canvas/sigma.canvas.edgehovers.arrow.js',
    'src/renderers/canvas/sigma.canvas.edgehovers.curvedArrow.js',
    'src/renderers/canvas/sigma.canvas.extremities.def.js',
    'src/renderers/svg/sigma.svg.utils.js',
    'src/renderers/svg/sigma.svg.nodes.def.js',
    'src/renderers/svg/sigma.svg.edges.def.js',
    'src/renderers/svg/sigma.svg.edges.curve.js',
    'src/renderers/svg/sigma.svg.labels.def.js',
    'src/renderers/svg/sigma.svg.hovers.def.js',

    // Middlewares:
    'src/middlewares/sigma.middlewares.rescale.js',
    'src/middlewares/sigma.middlewares.copy.js',

    // Miscellaneous:
    'src/misc/sigma.misc.animation.js',
    'src/misc/sigma.misc.bindEvents.js',
    'src/misc/sigma.misc.bindDOMEvents.js',
    'src/misc/sigma.misc.drawHovers.js'
  ];

  var npmJsFiles = coreJsFiles.slice(0);
  npmJsFiles.splice(2, 0, 'src/sigma.export.js');

  var plugins = [
    'helpers.graph',
    'exporters.gexf',
    'exporters.graphml',
    'exporters.json',
    'exporters.spreadsheet',
    'exporters.svg',
    'exporters.xlsx',
    'exporters.image',
    'layouts.dagre',
    'layouts.forceAtlas2',
    'layouts.forceLink',
    'layouts.fruchtermanReingold',
    'parsers.cypher',
    'parsers.gexf',
    'parsers.json',
    'pathfinding.astar',
    'plugins.activeState',
    'plugins.animate',
    'plugins.colorbrewer',
    'plugins.design',
    'plugins.legend',
    'plugins.dragNodes',
    'plugins.edgeSiblings',
    'plugins.filter',
    'plugins.fullScreen',
    'plugins.generators',
    'plugins.keyboard',
    'plugins.lasso',
    'plugins.locate',
    'plugins.neighborhoods',
    'plugins.poweredBy',
    'plugins.select',
    'plugins.tooltips',
    'plugins.relativeSize',
    'renderers.customEdgeShapes',
    'renderers.edgeLabels',
    'renderers.glyphs',
    'renderers.halo',
    'renderers.linkurious',
    'statistics.HITS',
    'statistics.louvain'
  ];

  var pluginFiles = [], subGrunts = {};

  plugins.forEach(function(p) {
    var dir = './plugins/sigma.' + p + '/';
    if (fs.existsSync(dir + 'Gruntfile.js')) {
      subGrunts[p] = {
        gruntfile: dir + 'Gruntfile.js'
      };
      pluginFiles.push(dir + 'worker.js');
      pluginFiles.push(dir + 'supervisor.js');
    } else {
      pluginFiles.push(dir + '**/*.js');
    }
  });

  // Project configuration:
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['build/'],
    grunt: subGrunts,
    closureLint: {
      app: {
        closureLinterPath: '/usr/local/bin',
        command: 'gjslint',
        src: coreJsFiles,
        options: {
          stdout: true,
          strict: true,
          opt: '--disable 6,13'
        }
      }
    },
    jshint: {
      all: coreJsFiles,
      options: {
        '-W055': true,
        '-W040': true,
        '-W064': true
      }
    },
    qunit: {
      all: {
        options: {
          urls: [
            './test/unit.html'
          ]
        }
      }
    },
    uglify: {
      prod: {
        files: {
          'build/sigma.min.js': coreJsFiles
        },
        options: {
          sourceMap: true,
          banner: '/* linkurious.js - <%= pkg.description %> - Version: <%= pkg.version %> - Author: Linkurious SAS - License: GPLv3 */\n'
        }
      },
      prod_plugins: {
        files: {
          'build/plugins.min.js': pluginFiles
        },
        options: {
          sourceMap: true,
          banner: '/* linkurious.js - <%= pkg.description %> - Version: <%= pkg.version %> - Author: Linkurious SAS - License: GPLv3 */\n'
        }
      },
      plugins: {
        files: pluginFiles.reduce(function(res, path) {
          var dest = 'build/' + path.replace(/\/\*\*\/\*\.js$/, '.min.js');
          res[dest] = path;
          return res;
        }, {}),
        options: {
          sourceMap: true
        }
      },
    },
    concat: {
      options: {
        separator: '\n'
      },
      dist: {
        src: coreJsFiles,
        dest: 'build/sigma.js'
      },
      plugins: {
        src: pluginFiles,
        dest: 'build/plugins.js'
      },
      require: {
        src: npmJsFiles,
        dest: 'build/sigma.require.js'
      }
    },
    sed: {
      version: {
        recursive: true,
        path: 'examples/',
        pattern: /<!-- START SIGMA IMPORTS -->[\s\S]*<!-- END SIGMA IMPORTS -->/g,
        replacement: ['<!-- START SIGMA IMPORTS -->'].concat(coreJsFiles.map(function(path) {
          return '<script src="../' + path + '"></script>';
        }).concat('<!-- END SIGMA IMPORTS -->')).join('\n')
      }
    },
    zip: {
      release: {
        dest: 'build/<%= pkg.name %>-v<%= pkg.version %>.zip',
        src: [
          'README.md',
          'CHANGELOG.md',
          'build/sigma.min.js',
          'build/plugins/*.min.js'
        ],
        router: function(filepath) {
          return filepath.replace(/build\//, '');
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  // By default, will check lint, hint, test and minify:
  grunt.registerTask('default', ['closureLint', 'jshint', 'qunit', 'sed', 'clean', 'uglify', 'concat', 'grunt']);
  grunt.registerTask('release', ['closureLint', 'jshint', 'qunit', 'sed', 'clean', 'uglify', 'concat', 'grunt', 'zip']);
  grunt.registerTask('build', ['clean', 'uglify', 'concat', 'grunt']);
  grunt.registerTask('test', ['qunit']);

  // For travis-ci.org, only launch tests:
  grunt.registerTask('travis', ['qunit']);
};
