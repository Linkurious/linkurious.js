;(function(global) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.renderers');

  // Copy the good renderer:
  sigma.renderers.def = sigma.utils.isWebGLSupported() ?
    sigma.renderers.webgl :
    sigma.renderers.canvas;
})(this);
