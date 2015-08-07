;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.misc');

  /**
   * This helper will bind any DOM renderer (for instance svg)
   * to its captors, to properly dispatch the good events to the sigma instance
   * to manage clicking, hovering etc...
   *
   * It has to be called in the scope of the related renderer.
   */
  sigma.misc.bindDOMEvents = function(container) {
    var self = this,
        graph = this.graph,
        hovered = {nodes: [], edges: []};

    // DOMElement abstraction
    function Element(domElement) {

      // Helpers
      this.attr = function(attrName) {
        return domElement.getAttributeNS(null, attrName);
      };

      // Properties
      this.tag = domElement.tagName;
      this.class = this.attr('class');
      this.id = this.attr('id');

      // Methods
      this.isNode = function() {
        return !!~this.class.indexOf(self.settings('classPrefix') + '-node');
      };

      this.isEdge = function() {
        return !!~this.class.indexOf(self.settings('classPrefix') + '-edge');
      };

      this.isHover = function() {
        return !!~this.class.indexOf(self.settings('classPrefix') + '-hover');
      };
    }

    // Click
    function click(e) {
      if (!self.settings('eventsEnabled'))
        return;

      // Generic event
      self.dispatchEvent('click', sigma.utils.mouseCoords(e));

      // Are we on a node?
      var element = new Element(e.target);

      if (element.isNode())
        self.dispatchEvent('clickNode', {
          node: graph.nodes(element.attr('data-node-id'))
        });
      else
        self.dispatchEvent('clickStage');

      e.preventDefault();
      e.stopPropagation();
    }

    // Double click
    function doubleClick(e) {
      if (!self.settings('eventsEnabled'))
        return;

      // Generic event
      self.dispatchEvent('doubleClick', sigma.utils.mouseCoords(e));

      // Are we on a node?
      var element = new Element(e.target);

      if (element.isNode())
        self.dispatchEvent('doubleClickNode', {
          node: graph.nodes(element.attr('data-node-id'))
        });
      else
        self.dispatchEvent('doubleClickStage');

      e.preventDefault();
      e.stopPropagation();
    }

    // On over
    function onOver(e) {
      var target = e.toElement || e.target;

      if (!self.settings('eventsEnabled') || !target)
        return;

      var el_svg = new Element(target),
        event = {
          leave: {nodes: [], edges: []},
          enter: {nodes: [], edges: []},
          captor: sigma.utils.mouseCoords(e),
        },
        el;

      if (el_svg.isNode()) {
        el = graph.nodes(el_svg.attr('data-node-id'));
        event.enter.nodes = [el];
        hovered.nodes.push(el);
      } else if (el_svg.isEdge()) {
        el = graph.edges(el_svg.attr('data-edge-id'));
        event.enter.edges = [el];
        hovered.edges.push(el);
      }

      event.current = hovered;
      self.dispatchEvent('hovers', event);
    }

    // On out
    function onOut(e) {
      var target = e.fromElement || e.originalTarget;

      if (!self.settings('eventsEnabled'))
        return;

      var el_svg = new Element(target),
        event = {
          leave: {nodes: [], edges: []},
          enter: {nodes: [], edges: []},
          captor: sigma.utils.mouseCoords(e),
        },
        el;

      if (el_svg.isNode()) {
        el = graph.nodes(el_svg.attr('data-node-id'));
        event.leave.nodes = [el];
        hovered.nodes.push(el);
      } else if (el_svg.isEdge()) {
        el = graph.edges(el_svg.attr('data-edge-id'));
        event.leave.edges = [el];
        hovered.edges.push(el);
      } else {
        return;
      }

      event.current = hovered;
      self.dispatchEvent('hovers', event);
    }

    // Registering Events:

    // Click
    container.addEventListener('click', click, false);
    sigma.utils.doubleClick(container, 'click', doubleClick);

    // Touch counterparts
    container.addEventListener('touchstart', click, false);
    sigma.utils.doubleClick(container, 'touchstart', doubleClick);

    // Mouseover
    container.addEventListener('mouseover', onOver, true);

    // Mouseout
    container.addEventListener('mouseout', onOut, true);
  };
}).call(this);
