;(function () {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.layout.workerForce');

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
  }
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
  sigma.layout.workerForce.BSPTree = BSPTree;
})();
