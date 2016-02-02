;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.settings');

  /**
  * Extended sigma settings for sigma.plugins.activeState.
  */
  var settings = {
    /**
     * NODE BORDERS SETTINGS:
     * **********************
     */
    // {string} Indicates how to choose the nodes border color.
    //          Available values: "node", "default"
    nodeBorderColor: 'node,',
    // defaultNodeBorderColor is set in sigma.settings.
    // {string} Indicates how to choose the nodes outer border color.
    //          Available values: "node", "default"
    nodeOuterBorderColor: '',
    // {number} The size of the outer border of nodes.
    nodeOuterBorderSize: 0,
    // {string} The default node outer border's color.
    defaultNodeOuterBorderColor: '#000',

    /**
     * HOVERED NODE BORDERS SETTINGS:
     * **********************
     */
    // {number} The size of the border of hovered nodes.
    nodeHoverBorderSize: 0,
    // {string} Indicates how to choose the hovered nodes border color.
    //          Available values: "node", "default"
    nodeHoverBorderColor: 'node,',
    // {number} The default hovered node border's color.
    defaultNodeHoverBorderColor: '#000',

    /**
     * ACTIVE NODE BORDERS SETTINGS:
     * **********************
     */
    // {number} The size of the border of active nodes.
    nodeActiveBorderSize: 0,
    // {string} Indicates how to choose the active nodes border color.
    //          Available values: "node", "default"
    nodeActiveBorderColor: 'node,',
    // {number} The default active node border's color.
    defaultNodeActiveBorderColor: '#000',
    // {string} Indicates how to choose the active nodes outer border color.
    //          Available values: "node", "default"
    nodeActiveOuterBorderColor: '',
    // {number} The size of the outer border of active nodes.
    nodeActiveOuterBorderSize: 0,
    // {string} The default active node outer border's color.
    defaultNodeActiveOuterBorderColor: '#000',

    /**
     * ACTIVE STATE SETTINGS:
     * **********************
     */
    // {string}
    defaultLabelActiveColor: '#000',
    // {string} The active node's label font. If not specified, will heritate
    //          the "font" value.
    activeFont: '',
    // {string} Example: 'bold'
    activeFontStyle: '',
    // {string} Indicates how to choose the labels color of active nodes.
    //          Available values: "node", "default"
    labelActiveColor: 'default',
    // {string} Indicates how to choose the active nodes color.
    //          Available values: "node", "default"
    nodeActiveColor: 'node',
    // {string}
    defaultNodeActiveColor: 'rgb(236, 81, 72)',
    // {string} Indicates how to choose the active nodes color.
    //          Available values: "edge", "default"
    edgeActiveColor: 'edge',
    // {string}
    defaultEdgeActiveColor: 'rgb(236, 81, 72)',

    /**
     * NODE LEVEL SETTINGS:
     * **********************
     */
    // {number} The (Material Design) shadow level of active nodes.
    //          Available values: 0 (no shadow), 1 (low), 2, 3, 4, 5 (high)
    nodeActiveLevel: 0,
    // {number} The (Material Design) shadow level of hovered nodes.
    //          Available values: 0 (no shadow), 1 (low), 2, 3, 4, 5 (high)
    nodeHoverLevel: 0,
    // {number} The (Material Design) shadow level of active edges.
    //          Available values: 0 (no shadow), 1 (low), 2, 3, 4, 5 (high)
    edgeActiveLevel: 0,
    // {number} The (Material Design) shadow level of hovered edges.
    //          Available values: 0 (no shadow), 1 (low), 2, 3, 4, 5 (high)
    edgeHoverLevel: 0,


    /**
     * NODE ICONS AND IMAGES SETTINGS:
     * *******************************
     */
    // {number} The minimum size a node must have to see its icon displayed.
    iconThreshold: 8,
    // {number} The minimum size a node must have to see its image displayed.
    imageThreshold: 8,
    // {string} Controls the security policy of the image loading, from the
    // browser's side.
    imgCrossOrigin: 'anonymous'
  };

  // Export the previously designed settings:
  sigma.settings = sigma.utils.extend(sigma.settings || {}, settings);

}).call(this);
