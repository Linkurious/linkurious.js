;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.svg.edges.labels');

  /**
   * The label renderer for curved arrow edges. It renders the label as a simple text.
   */
  sigma.svg.edges.labels.curvedArrow = sigma.svg.edges.labels.curve;

}).call(this);
