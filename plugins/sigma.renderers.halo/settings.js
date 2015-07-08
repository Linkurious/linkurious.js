;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma not in scope.');

  // Initialize package:
  sigma.utils.pkg('sigma.settings');

  /**
  * Extended sigma settings.
  */
  var settings = {
    // {string}
    nodeHaloColor: '#fff',
    // {boolean}
    nodeHaloStroke: false,
    // {string}
    nodeHaloStrokeColor: '#000',
    // {number}
    nodeHaloStrokeWidth: 0.5,
    // {number}
    nodeHaloSize: 50,
    // {boolean}
    nodeHaloClustering: false,
    // {number}
    nodeHaloClusteringMaxRadius: 1000,
    // {string}
    edgeHaloColor: '#fff',
    // {number}
    edgeHaloSize: 10,
    // {boolean}
    drawHalo: true,
  };

  // Export the previously designed settings:
  sigma.settings = sigma.utils.extend(sigma.settings || {}, settings);

}).call(this);