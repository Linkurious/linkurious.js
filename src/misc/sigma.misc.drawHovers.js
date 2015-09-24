;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.misc');

  /**
   * This method listens to "hovers" events from a renderer and renders
   * the nodes differently on the top layer.
   * The goal is to make any node label readable with the mouse, and to
   * highlight hovered nodes and edges.
   *
   * It has to be called in the scope of the related renderer.
   */
  sigma.misc.drawHovers = function(prefix) {
    var self = this,
        current = {nodes: [], edges: []};

    this.bind('hovers', function(event) {
      current = event.data.current;
      draw();
    });

    this.bind('render', function(event) {
      draw();
    });

    function draw() {
      var c = self.contexts.hover.canvas,
          embedSettings = self.settings.embedObjects({
            prefix: prefix
          }),
          end = embedSettings('singleHover') ? 1 : undefined,
          renderParams = {
            elements: current.nodes,
            renderers: sigma.canvas.hovers,
            type: 'nodes',
            ctx: self.contexts.hover,
            end: end,
            graph: self.graph,
            settings: embedSettings,
          };

      self.contexts.hover.clearRect(0, 0, c.width, c.height);

      // Node render
      if (current.nodes.length > 0 && embedSettings('enableHovering')) {
        sigma.renderers.canvas.applyRenderers(renderParams);
      }

      // Edge render
      if (current.edges.length > 0 && embedSettings('enableEdgeHovering')) {
        renderParams.renderers = sigma.canvas.edgehovers;
        renderParams.elements = current.edges;
        renderParams.type = 'edges';
        sigma.renderers.canvas.applyRenderers(renderParams);

        if (embedSettings('edgeHoverExtremities')) {
          renderParams.renderers = sigma.canvas.extremities;
          sigma.renderers.canvas.applyRenderers(renderParams);
        } else { //draw nodes over edges
          renderParams.ctx = self.contexts.nodes;
          renderParams.type = 'nodes';
          renderParams.renderers = sigma.canvas.nodes;
          renderParams.elements = current.nodes;
          sigma.renderers.canvas.applyRenderers(renderParams);
        }
      }
    }
  };
}).call(this);
