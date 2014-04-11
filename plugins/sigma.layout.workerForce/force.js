;(function(global) {
  'use strict';

  var MovingPoint = (function() {
    function MovingPoint(id, x, y) {
      this.id = id;
      this.x = x;
      this.y = y;
      if (!Number.isFinite(x))
        this.x = Math.floor(1000 * Math.random());
      if (!Number.isFinite(y))
        this.y = Math.floor(1000 * Math.random());

      this.speedX = this.speedY = 0;
    }
    return MovingPoint;
  })();

  if (typeof this.performance !== 'object') {
    this.performance = {
      now: Date.now
    };
  }

  var sendNewCoords;

  if (Object(this.document) === this.document) {
    sendNewCoords = function sendNewCoords(coords) {
      var e = new Event('newCoords');
      e.coords = coords;
      requestAnimationFrame(function() {
        return document.dispatchEvent(e);
      });
    };
  } else {
    if (typeof postMessage === 'function') {
      sendNewCoords = function sendNewCoords(coords) {
        postMessage(coords);
      };
    } else {
      throw new Error('No idea of how to reach back the context where the graph is drawn');
    }
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
    if (changes.addNodes) {
      changes.addNodes.forEach(function(p) {
        points.set(p.id, new MovingPoint(p.id, p.x, p.y));
      });
    }
    if (changes.addEdges) {
      changes.addEdges.forEach(function(e) {
        edges.add({ from: points.get(e.from), to: points.get(e.to) });
      });
    }

    (function loop() {
      var newCoords = step();
      sendNewCoords(newCoords);
      setTimeout(loop, 0);
    })();
  }

  var step = function step() {
    var times = [performance.now()];

    points.forEach(function(p) {
      var deltaX = CENTER_X - p.x;
      var deltaY = CENTER_Y - p.y;

      var distanceToCenter = Math.hypot(deltaX, deltaY);

      p.accX = CENTER_FORCE * deltaX;
      p.accY = CENTER_FORCE * deltaY;
    });

    times.push(performance.now());
    var pointsArray = [],
        top = +Infinity,
        right = -Infinity,
        bottom = -Infinity,
        left = +Infinity;

    points.forEach(function(p) {
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

    times.push(performance.now());

    bspTree = new BSPTree(top, right, bottom, left, pointsArray);

    times.push(performance.now());

    points.forEach(function(p) {
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

    times.push(performance.now());

    edges.forEach(function(e) {
      var from = e.from,
          to = e.to,
          deltaX = to.x - from.x,
          deltaY = to.y - from.y,
          distance = Math.hypot(deltaX, deltaY),
          attractX = ATTRACTION * (distance - IDEAL_EDGE_DISTANCE) * deltaX;
          attractY = ATTRACTION * (distance - IDEAL_EDGE_DISTANCE) * deltaY;

      from.accX += attractX;
      from.accY += attractY;
      to.accX -= attractX;
      to.accY -= attractY;
    });

    times.push(performance.now());

    var newCoords = [];

    points.forEach(function(p) {
      p.speedX = p.speedX * FRICTION + G * p.accX;
      p.speedY = p.speedY * FRICTION + G * p.accY;

      p.x += p.speedX;
      p.y += p.speedY;

      newCoords.push({ id: p.id, x: p.x, y: p.y });
    });

    times.push(performance.now());

    times = times.map(function(t, i) {
      return i === times.length - 1 ? undefined : times[i + 1] - t;
    });

    return newCoords;
  };
})(this);
