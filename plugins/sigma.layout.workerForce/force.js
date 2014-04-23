;(function(global) {
  'use strict';

  var worker = function() {
    /**
     * Check whether we're in a worker or not:
     */
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




    /**
     * Node class helper:
     */
    var MovingPoint = function(id, x, y) {
      this.id = id;
      this.x = x;
      this.y = y;
      if (!Number.isFinite(x))
        this.x = Math.floor(1000 * Math.random());
      if (!Number.isFinite(y))
        this.y = Math.floor(1000 * Math.random());

      this.speedX = this.speedY = 0;
    };




    /**
     * Planar indexation:
     */
    var BSPTree = function(top, right, bottom, left, points) {
      this.top = top;
      this.right = right;
      this.bottom = bottom;
      this.left = left;
      this.children = [];

      if (points.length === 0)
        throw new Error('Don\'t build a BSPTree with 0 points !');

      if (points.length === 1) {
        var p = points[0];
        this.barycenter = {
          x: p.x,
          y: p.y,
          mass: 1,
          point: p
        };
        delete this.children;
        return this;
      }

      this.recursiveSplit(points);
      this.computeBarycenter();
    };

    BSPTree.prototype.recursiveSplit = function (points) {
      var bottom = this.bottom,
          top = this.top,
          right = this.right,
          left = this.left,

          abs = Math.abs,
          max = Math.max,
          min = Math.min,
          sqrt = Math.sqrt,

          verticalHalfDiff = (bottom - top) / 2,
          horizontalHalfDiff = (right - left) / 2,

          child1,
          child2;

      if (verticalHalfDiff > horizontalHalfDiff) {
        child1 = {
          top: top,
          right: right,
          bottom: bottom - verticalHalfDiff,
          left: left,
          points: []
        };
        child2 = {
          top: top + verticalHalfDiff,
          right: right,
          bottom: bottom,
          left: left,
          points: []
        };
      } else {
        child1 = {
          top: top,
          right: right - horizontalHalfDiff,
          bottom: bottom,
          left: left,
          points: []
        };
        child2 = {
          top: top,
          right: right,
          bottom: bottom,
          left: left + horizontalHalfDiff,
          points: []
        };
      }

      child1.contains = child2.contains = this.contains;

      points.forEach(function (p) {
        if (child1.contains(p.x, p.y))
          child1.points.push(p);
        else
          child2.points.push(p);
      });

      if (child1.points.length >= 1) {
        this.children.push(new BSPTree(child1.top, child1.right, child1.bottom, child1.left, child1.points));
      }
      if (child2.points.length >= 1) {
        this.children.push(new BSPTree(child2.top, child2.right, child2.bottom, child2.left, child2.points));
      }
    };

    BSPTree.prototype.contains = function (x, y) {
      return y > this.top && y <= this.bottom && x > this.left && x <= this.right;
    };

    BSPTree.prototype.computeBarycenter = function () {
      if (this.children.length === 1) {
        this.barycenter = {
          x: this.children[0].barycenter.x,
          y: this.children[0].barycenter.y,
          mass: this.children[0].barycenter.mass
        };
        return;
      }

      var child1Barycenter = this.children[0].barycenter,
          child2Barycenter = this.children[1].barycenter,
          totalMass = child1Barycenter.mass + child2Barycenter.mass;

      this.barycenter = {
        x: (child1Barycenter.mass * child1Barycenter.x + child2Barycenter.mass * child2Barycenter.x) / totalMass,
        y: (child1Barycenter.mass * child1Barycenter.y + child2Barycenter.mass * child2Barycenter.y) / totalMass,
        mass: totalMass
      };
    };

    BSPTree.prototype.distanceFromPoint = function (x, y) {
      var bottom = this.bottom,
          top = this.top,
          right = this.right,
          left = this.left,

          abs = Math.abs,
          min = Math.min,
          sqrt = Math.sqrt;

      function square(x) {
        return x * x;
      }

      if (this.contains(x, y))
        return 0;

      var toTop = y - top;
      var toBottom = y - bottom;
      var toLeft = x - left;
      var toRight = x - right;

      if (toTop > 0 && toBottom <= 0) {
        return min(abs(toRight), abs(toLeft));
      }

      if (toLeft > 0 && toRight <= 0) {
        return min(abs(toTop), abs(toBottom));
      }

      var sqrToTop = square(toTop),
          sqrToBottom = square(toBottom),
          sqrToLeft = square(toLeft),
          sqrToRight = square(toRight);

      return sqrt(min(sqrToTop + sqrToLeft, sqrToTop + sqrToRight, sqrToBottom + sqrToLeft, sqrToBottom + sqrToRight));
    };

    BSPTree.prototype.getForceRelevantMassedPoints = function (x, y) {
      var ret = [];

      function _getForceRelevantMassedPoints(bspTree) {
        var barycenter = bspTree.barycenter,
            bottom = bspTree.bottom,
            top = bspTree.top,
            right = bspTree.right,
            left = bspTree.left;

        if (!bspTree.children) {
          if (barycenter.x !== x || barycenter.y !== y)
            ret.push(barycenter);

          return;
        }

        var distSquare = (barycenter.x - x) * (barycenter.x - x) + (barycenter.y - y) * (barycenter.y - y);
        var diagSquare = (bottom - top) * (bottom - top) + (right - left) * (right - left);

        if (distSquare > BSPTree.THETA_SQUARE * diagSquare)
          ret.push(barycenter);
        else {
          bspTree.children.forEach(_getForceRelevantMassedPoints);
        }
      }

      _getForceRelevantMassedPoints(this);

      return ret;
    };

    BSPTree.THETA_SQUARE = 4;




    /**
     * Actual force directed layout algorithm:
     */
    var REPULSION = 700,
        ATTRACTION = 1e-4,
        FRICTION = 0.9,
        IDEAL_EDGE_DISTANCE = 30,
        G = 0.23,

        CENTER_X = 700,
        CENTER_Y = 350,
        CENTER_FORCE = 1e-3,

        points = new Map(),
        edges = new Set(),
        bspTree;

    self.addEventListener('message', function(e) {
      applyGraphChanges(e.data);
    });

    function applyGraphChanges(changes) {
      if (changes.addNodes)
        changes.addNodes.forEach(function (p) {
          points.set(p.id, new MovingPoint(p.id, p.x, p.y));
        });

      if (changes.addEdges)
        changes.addEdges.forEach(function (e) {
          edges.add({ source: points.get(e.source), target: points.get(e.target) });
        });

      (function loop() {
        var newCoords = step();
        sendNewCoords(newCoords);
        setTimeout(loop, 0);
      })();
    }

    var step = function step() {
      var newCoords = [];

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

      edges.forEach(function(e) {
        var source = e.source,
            target = e.target,
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

      points.forEach(function(p) {
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
  };




  /**
   * Interfacing the worker:
   */
  sigma.prototype.startWorkerForce = function(options) {
    // TODO
  };

  sigma.prototype.stopWorkerForce = function() {
    // TODO
  };
})(this);
