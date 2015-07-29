;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.canvas.extremities');

  /**
   * The default renderer for hovered edge extremities. It renders the edge
   * extremities as hovered.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  sigma.canvas.extremities.def =
    function(edge, source, target, context, settings) {
    // Source Node:
    var def = (
      sigma.canvas.hovers[source.type] ||
      sigma.canvas.hovers.def
    );
    def = def.render || def;
    def(source, context, settings);

    // Target Node:
    def = (
      sigma.canvas.hovers[target.type] ||
      sigma.canvas.hovers.def
    );
    def = def.render || def;
    def(target, context, settings);
  };
}).call(this);
