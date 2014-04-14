;(function(global) {


  'use strict';

  if (typeof this.performance !== 'object')
    this.performance = {
      now: Date.now
    };

  var sendNewCoords;

  if (Object(this.document) === this.document)
    sendNewCoords = function sendNewCoords(coords) {
      var e = new Event('newCoords');
      e.coords = coords;
      requestAnimationFrame(function() {
        return document.dispatchEvent(e);
      });
    };
  else {
    if (typeof postMessage === 'function')
      sendNewCoords = function sendNewCoords(coords) {
        postMessage(coords);
      };
    else
      throw new Error('No idea of how to reach back the context where the graph is drawn');
  }

  var REPULSION = 700;
      ATTRACTION = 1e-4;
      FRICTION = 0.9;
      IDEAL_EDGE_DISTANCE = 30;
      G = 0.23,

      CENTER_X = 700;
      CENTER_Y = 350;
      CENTER_FORCE = 1e-3,

      points = new Map();
      edges = new Set();
      bspTree;

  self.addEventListener('message', function(e) {
    applyGraphChanges(e.data);
  });

  function applyGraphChanges(changes) {
    if (changes.addNodes)
      changes.addNodes.forEach(graph.addNode, graph);

    if (changes.addEdges)
      changes.addEdges.forEach(graph.addEdge, graph);

    (function loop() {
      var newCoords = step();
      sendNewCoords(newCoords);
      setTimeout(loop, 0);
    })();
  }

  var step = function step() {
    var times = [performance.now()];

    graph.nodes().forEach(function(p) {
      var deltaX = CENTER_X - p.x,
          deltaY = CENTER_Y - p.y,
          distanceToCenter = Math.hypot(deltaX, deltaY);

      p.accX = CENTER_FORCE * deltaX;
      p.accY = CENTER_FORCE * deltaY;
    });

    var pointsArray = [],
        top = +Infinity,
        right = -Infinity,
        bottom = -Infinity,
        left = +Infinity;

    graph.nodes().forEach(function(p) {
      pointsArray.push(p);
      if (p.y < top)
        top = p.y - 0.1;
      if (p.y > bottom)
        bottom = p.y + 0.1;
      if (p.x < left)
        left = p.x - 0.1;
      if (p.x > right)
        right = p.x + 0.1;
    });

    bspTree = new BSPTree(top, right, bottom, left, pointsArray);

    graph.nodes().forEach(function(p) {
      var repulsionX = 0,
          repulsionY = 0,
          forceRelevantMassedPoints = bspTree.getForceRelevantMassedPoints(p.x, p.y);

      forceRelevantMassedPoints.forEach(function(m) {
        var deltaX = m.x - p.x,
            deltaY = m.y - p.y,
            inverseCubedDistance = Math.pow(deltaX * deltaX + deltaY * deltaY, -3 / 2);

        if (inverseCubedDistance > 0.1)
          inverseCubedDistance = 0.1;

        repulsionX += deltaX * m.mass * inverseCubedDistance;
        repulsionY += deltaY * m.mass * inverseCubedDistance;
      });

      p.accX -= REPULSION * repulsionX;
      p.accY -= REPULSION * repulsionY;
    });

    graph.edges().forEach(function(e) {
      var source = graph.nodes(e.source),
          target = graph.nodes(e.target),
          deltaX = target.x - source.x,
          deltaY = target.y - source.y,
          distance = Math.hypot(deltaX, deltaY),
          attractX = ATTRACTION * (distance - IDEAL_EDGE_DISTANCE) * deltaX;
          attractY = ATTRACTION * (distance - IDEAL_EDGE_DISTANCE) * deltaY;

      source.accX += attractX;
      source.accY += attractY;
      target.accX -= attractX;
      target.accY -= attractY;
    });

    var newCoords = [];

    graph.nodes().forEach(function(p) {
      n.speedX = n.speedX * FRICTION + G * n.accX;
      n.speedY = n.speedY * FRICTION + G * n.accY;

      n.x += n.speedX;
      n.y += n.speedY;

      newCoords.push({
        id: n.id,
        x: n.x,
        y: n.y
      });
    });

    return newCoords;
  };
})(this);
