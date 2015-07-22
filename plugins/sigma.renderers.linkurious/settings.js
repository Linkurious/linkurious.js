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
     * NODE BORDERS SETTINGS:
     * **********************
     */
    // {string} Indicates how to choose the nodes border color.
    //          Available values: "node", "default"
    nodeBorderColor: 'node,',
    // defaultNodeBorderColor is already available in sigma.settings.
    // {string} Indicates how to choose the nodes outer border color.
    //          Available values: "node", "default"
    nodeOuterBorderColor: '',
    // {number} The size of the outer border of hovered and active nodes.
    outerBorderSize: 0,
    // {string} The default hovered and active node outer border's color.
    defaultNodeOuterBorderColor: '#000',

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
    imgCrossOrigin: 'anonymous',

    /**
     * EDGE LABELS
     * *******************
     */
    // {string}
    defaultEdgeLabelColor: '#000',
    // {string}
    defaultEdgeLabelActiveColor: '#000',
    // {string}
    defaultEdgeLabelSize: 10,
    // {string} Indicates how to choose the edge labels size. Available values:
    //          "fixed", "proportional"
    edgeLabelSize: 'fixed',
    // {string} Label position relative to its edge. Available values:
    //          "auto", "horizontal"
    edgeLabelAlignment: 'auto',
    // {string} The opposite power ratio between the font size of the label and
    // the edge size:
    // Math.pow(size, -1 / edgeLabelSizePowRatio) * size * defaultEdgeLabelSize
    edgeLabelSizePowRatio: 1,
    // {number} The minimum size an edge must have to see its label displayed.
    edgeLabelThreshold: 1,
    // {string}
    defaultEdgeHoverLabelBGColor: '#fff',
    // {string} Indicates how to choose the hovered edge labels color.
    //          Available values: "edge", "default"
    edgeLabelHoverBGColor: 'default',
    // {string} Indicates how to choose the hovered edges shadow color.
    //          Available values: "edge", "default"
    edgeLabelHoverShadow: 'default',
    // {string}
    edgeLabelHoverShadowColor: '#000'
  };

  // Export the previously designed settings:
  sigma.settings = sigma.utils.extend(sigma.settings || {}, settings);
  sigma.settings.drawEdgeLabels = true;

}).call(this);
