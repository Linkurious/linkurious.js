;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  // Initialize package:
  sigma.utils.pkg('sigma.layouts');

  /**
   * Sigma ForceLink Webworker
   * ==============================
   *
   * Author: Guillaume Plique (Yomguithereal)
   * Algorithm author: Mathieu Jacomy @ Sciences Po Medialab & WebAtlas
   * Extensions author: Sébastien Heymann @ Linkurious
   * Version: 1.0.0
   */

  var _root = this,
      inWebWorker = !('document' in _root);

  /**
   * Worker Function Wrapper
   * ------------------------
   *
   * The worker has to be wrapped into a single stringified function
   * to be passed afterwards as a BLOB object to the supervisor.
   */
  var Worker = function(undefined) {
    'use strict';

    /**
     * Worker settings and properties
     */
    var W = {

      // Properties
      ppn: 10,
      ppe: 3,
      ppr: 9,
      maxForce: 10,
      iterations: 0,
      converged: false,

      // Possible to change through config
      settings: {
        // force atlas 2:
        linLogMode: false,
        outboundAttractionDistribution: false,
        adjustSizes: false,
        edgeWeightInfluence: 0,
        scalingRatio: 1,
        strongGravityMode: false,
        gravity: 1,
        slowDown: 1,
        barnesHutOptimize: false,
        barnesHutTheta: 0.5,
        startingIterations: 1,
        iterationsPerRender: 1,
        // stopping condition:
        maxIterations: 1000,
        avgDistanceThreshold: 0.01,
        autoStop: false,
        // node siblings:
        alignNodeSiblings: false,
        nodeSiblingsScale: 1,
        nodeSiblingsAngleMin: 0,
        minNodeDistance: 0
      }
    };

    var NodeMatrix,
        EdgeMatrix,
        RegionMatrix;

    /**
     * Helpers
     */
    function extend() {
      var i,
          k,
          res = {},
          l = arguments.length;

      for (i = l - 1; i >= 0; i--)
        for (k in arguments[i])
          res[k] = arguments[i][k];
      return res;
    }

    function __emptyObject(obj) {
      var k;

      for (k in obj)
        if (!('hasOwnProperty' in obj) || obj.hasOwnProperty(k))
          delete obj[k];

      return obj;
    }

    /**
     * Return the euclidian distance between two points of a plane
     * with an orthonormal basis.
     *
     * @param  {number} x0  The X coordinate of the first point.
     * @param  {number} y0  The Y coordinate of the first point.
     * @param  {number} x1  The X coordinate of the second point.
     * @param  {number} y1  The Y coordinate of the second point.
     * @return {number}     The euclidian distance.
     */
    function getDistance(x0, y0, x1, y1) {
      return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    }

    /**
     * Scale a value from the range [baseMin, baseMax] to the range
     * [limitMin, limitMax].
     *
     * @param  {number} value    The value to rescale.
     * @param  {number} baseMin  The min value of the range of origin.
     * @param  {number} baseMax  The max value of the range of origin.
     * @param  {number} limitMin The min value of the range of destination.
     * @param  {number} limitMax The max value of the range of destination.
     * @return {number}          The scaled value.
     */
    function scaleRange(value, baseMin, baseMax, limitMin, limitMax) {
      return ((limitMax - limitMin) * (value - baseMin) / (baseMax - baseMin)) + limitMin;
    }

    /**
     * Get the angle of the vector (in radian).
     *
     * @param  {object} v  The 2d vector with x,y coordinates.
     * @return {number}    The angle of the vector  (in radian).
     */
    function getVectorAngle(v) {
      return Math.acos( v.x / Math.sqrt(v.x * v.x + v.y * v.y) );
    }

    /**
     * Get the normal vector of the line segment, i.e. the vector
     * orthogonal to the line.
     * http://stackoverflow.com/a/1243614/
     *
     * @param  {number} aX The x coorinates of the start point.
     * @param  {number} aY The y coorinates of the start point.
     * @param  {number} bX The x coorinates of the end point.
     * @param  {number} bY The y coorinates of the end point.
     * @return {object}    The 2d vector with (xi,yi), (xi_prime,yi_prime) coordinates.
     */
    function getNormalVector(aX, aY, bX, bY) {
      return {
        xi:       -(bY - aY),
        yi:         bX - aX,
        xi_prime:   bY - aY,
        yi_prime: -(bX - aX)
      };
    }

    /**
     * Get the normalized vector.
     *
     * @param  {object} v      The 2d vector with (xi,yi), (xi_prime,yi_prime) coordinates.
     * @param  {number} length The vector length.
     * @return {object}        The normalized vector
     */
    function getNormalizedVector(v, length) {
      return {
        x: (v.xi_prime - v.xi) / length,
        y: (v.yi_prime - v.yi) / length
      };
    }

    /**
     * Get the a point the line segment [A,B] at a specified distance percentage
     * from the start point.
     *
     * @param  {number} aX The x coorinates of the start point.
     * @param  {number} aY The y coorinates of the start point.
     * @param  {number} bX The x coorinates of the end point.
     * @param  {number} bY The y coorinates of the end point.
     * @param  {number} t  The distance percentage from the start point.
     * @return {object}    The (x,y) coordinates of the point.
     */
    function getPointOnLineSegment(aX, aY, bX, bY, t) {
      return {
        x: aX + (bX - aX) * t,
        y: aY + (bY - aY) * t
      };
    }

    /**
     * Matrices properties accessors
     */
    var nodeProperties = {
      x: 0,
      y: 1,
      dx: 2,
      dy: 3,
      old_dx: 4,
      old_dy: 5,
      mass: 6,
      convergence: 7,
      size: 8,
      fixed: 9
    };

    var edgeProperties = {
      source: 0,
      target: 1,
      weight: 2
    };

    var regionProperties = {
      node: 0,
      centerX: 1,
      centerY: 2,
      size: 3,
      nextSibling: 4,
      firstChild: 5,
      mass: 6,
      massCenterX: 7,
      massCenterY: 8
    };

    function np(i, p) {

      // DEBUG: safeguards
      if ((i % W.ppn) !== 0)
        throw new Error('Invalid argument in np: "i" is not correct (' + i + ').');
      if (i !== parseInt(i))
        throw new TypeError('Invalid argument in np: "i" is not an integer.');

      if (p in nodeProperties)
        return i + nodeProperties[p];
      else
        throw new Error('ForceLink.Worker - ' +
              'Inexistant node property given (' + p + ').');
    }

    function ep(i, p) {

      // DEBUG: safeguards
      if ((i % W.ppe) !== 0)
        throw new Error('Invalid argument in ep: "i" is not correct (' + i + ').');
      if (i !== parseInt(i))
        throw new TypeError('Invalid argument in ep: "i" is not an integer.');

      if (p in edgeProperties)
        return i + edgeProperties[p];
      else
        throw new Error('ForceLink.Worker - ' +
              'Inexistant edge property given (' + p + ').');
    }

    function rp(i, p) {

      // DEBUG: safeguards
      if ((i % W.ppr) !== 0)
        throw new Error('Invalid argument in rp: "i" is not correct (' + i + ').');
      if (i !== parseInt(i))
        throw new TypeError('Invalid argument in rp: "i" is not an integer.');

      if (p in regionProperties)
        return i + regionProperties[p];
      else
        throw new Error('ForceLink.Worker - ' +
              'Inexistant region property given (' + p + ').');
    }

    /**
     * Algorithm initialization
     */

    function init(nodes, edges, config) {
      config = config || {};
      var i, l;

      // Matrices
      NodeMatrix = nodes;
      EdgeMatrix = edges;

      // Length
      W.nodesLength = NodeMatrix.length;
      W.edgesLength = EdgeMatrix.length;

      // Merging configuration
      configure(config);
    }

    function configure(o) {
      W.settings = extend(o, W.settings);
    }

    /**
     * Algorithm pass
     */

    // MATH: get distances stuff and power 2 issues
    function pass() {
      var a, i, j, l, r, n, n1, n2, e, w, g, k, m;

      var outboundAttCompensation,
          coefficient,
          xDist,
          yDist,
          oldxDist,
          oldyDist,
          ewc,
          mass,
          distance,
          size,
          factor,
          minNodeDistance = W.settings.minNodeDistance;

      // 1) Initializing layout data
      //-----------------------------

      // Resetting positions & computing max values
      for (n = 0; n < W.nodesLength; n += W.ppn) {
        NodeMatrix[np(n, 'old_dx')] = NodeMatrix[np(n, 'dx')];
        NodeMatrix[np(n, 'old_dy')] = NodeMatrix[np(n, 'dy')];
        NodeMatrix[np(n, 'dx')] = 0;
        NodeMatrix[np(n, 'dy')] = 0;
      }

      // If outbound attraction distribution, compensate
      if (W.settings.outboundAttractionDistribution) {
        outboundAttCompensation = 0;
        for (n = 0; n < W.nodesLength; n += W.ppn) {
          outboundAttCompensation += NodeMatrix[np(n, 'mass')];
        }

        outboundAttCompensation /= W.nodesLength;
      }


      // 1.bis) Barnes-Hut computation
      //------------------------------

      if (W.settings.barnesHutOptimize) {

        var minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity,
            q, q0, q1, q2, q3;

        // Setting up
        // RegionMatrix = new Float32Array(W.nodesLength / W.ppn * 4 * W.ppr);
        RegionMatrix = [];

        // Computing min and max values
        for (n = 0; n < W.nodesLength; n += W.ppn) {
          minX = Math.min(minX, NodeMatrix[np(n, 'x')]);
          maxX = Math.max(maxX, NodeMatrix[np(n, 'x')]);
          minY = Math.min(minY, NodeMatrix[np(n, 'y')]);
          maxY = Math.max(maxY, NodeMatrix[np(n, 'y')]);
        }

        // Build the Barnes Hut root region
        RegionMatrix[rp(0, 'node')] = -1;
        RegionMatrix[rp(0, 'centerX')] = (minX + maxX) / 2;
        RegionMatrix[rp(0, 'centerY')] = (minY + maxY) / 2;
        RegionMatrix[rp(0, 'size')] = Math.max(maxX - minX, maxY - minY);
        RegionMatrix[rp(0, 'nextSibling')] = -1;
        RegionMatrix[rp(0, 'firstChild')] = -1;
        RegionMatrix[rp(0, 'mass')] = 0;
        RegionMatrix[rp(0, 'massCenterX')] = 0;
        RegionMatrix[rp(0, 'massCenterY')] = 0;

        // Add each node in the tree
        l = 1;
        for (n = 0; n < W.nodesLength; n += W.ppn) {

          // Current region, starting with root
          r = 0;

          while (true) {
            // Are there sub-regions?

            // We look at first child index
            if (RegionMatrix[rp(r, 'firstChild')] >= 0) {

              // There are sub-regions

              // We just iterate to find a "leave" of the tree
              // that is an empty region or a region with a single node
              // (see next case)

              // Find the quadrant of n
              if (NodeMatrix[np(n, 'x')] < RegionMatrix[rp(r, 'centerX')]) {

                if (NodeMatrix[np(n, 'y')] < RegionMatrix[rp(r, 'centerY')]) {

                  // Top Left quarter
                  q = RegionMatrix[rp(r, 'firstChild')];
                }
                else {

                  // Bottom Left quarter
                  q = RegionMatrix[rp(r, 'firstChild')] + W.ppr;
                }
              }
              else {
                if (NodeMatrix[np(n, 'y')] < RegionMatrix[rp(r, 'centerY')]) {

                  // Top Right quarter
                  q = RegionMatrix[rp(r, 'firstChild')] + W.ppr * 2;
                }
                else {

                  // Bottom Right quarter
                  q = RegionMatrix[rp(r, 'firstChild')] + W.ppr * 3;
                }
              }

              // Update center of mass and mass (we only do it for non-leave regions)
              RegionMatrix[rp(r, 'massCenterX')] =
                (RegionMatrix[rp(r, 'massCenterX')] * RegionMatrix[rp(r, 'mass')] +
                 NodeMatrix[np(n, 'x')] * NodeMatrix[np(n, 'mass')]) /
                (RegionMatrix[rp(r, 'mass')] + NodeMatrix[np(n, 'mass')]);

              RegionMatrix[rp(r, 'massCenterY')] =
                (RegionMatrix[rp(r, 'massCenterY')] * RegionMatrix[rp(r, 'mass')] +
                 NodeMatrix[np(n, 'y')] * NodeMatrix[np(n, 'mass')]) /
                (RegionMatrix[rp(r, 'mass')] + NodeMatrix[np(n, 'mass')]);

              RegionMatrix[rp(r, 'mass')] += NodeMatrix[np(n, 'mass')];

              // Iterate on the right quadrant
              r = q;
              continue;
            }
            else {

              // There are no sub-regions: we are in a "leave"

              // Is there a node in this leave?
              if (RegionMatrix[rp(r, 'node')] < 0) {

                // There is no node in region:
                // we record node n and go on
                RegionMatrix[rp(r, 'node')] = n;
                break;
              }
              else {

                // There is a node in this region

                // We will need to create sub-regions, stick the two
                // nodes (the old one r[0] and the new one n) in two
                // subregions. If they fall in the same quadrant,
                // we will iterate.

                // Create sub-regions
                RegionMatrix[rp(r, 'firstChild')] = l * W.ppr;
                w = RegionMatrix[rp(r, 'size')] / 2;  // new size (half)

                // NOTE: we use screen coordinates
                // from Top Left to Bottom Right

                // Top Left sub-region
                g = RegionMatrix[rp(r, 'firstChild')];

                RegionMatrix[rp(g, 'node')] = -1;
                RegionMatrix[rp(g, 'centerX')] = RegionMatrix[rp(r, 'centerX')] - w;
                RegionMatrix[rp(g, 'centerY')] = RegionMatrix[rp(r, 'centerY')] - w;
                RegionMatrix[rp(g, 'size')] = w;
                RegionMatrix[rp(g, 'nextSibling')] = g + W.ppr;
                RegionMatrix[rp(g, 'firstChild')] = -1;
                RegionMatrix[rp(g, 'mass')] = 0;
                RegionMatrix[rp(g, 'massCenterX')] = 0;
                RegionMatrix[rp(g, 'massCenterY')] = 0;

                // Bottom Left sub-region
                g += W.ppr;
                RegionMatrix[rp(g, 'node')] = -1;
                RegionMatrix[rp(g, 'centerX')] = RegionMatrix[rp(r, 'centerX')] - w;
                RegionMatrix[rp(g, 'centerY')] = RegionMatrix[rp(r, 'centerY')] + w;
                RegionMatrix[rp(g, 'size')] = w;
                RegionMatrix[rp(g, 'nextSibling')] = g + W.ppr;
                RegionMatrix[rp(g, 'firstChild')] = -1;
                RegionMatrix[rp(g, 'mass')] = 0;
                RegionMatrix[rp(g, 'massCenterX')] = 0;
                RegionMatrix[rp(g, 'massCenterY')] = 0;

                // Top Right sub-region
                g += W.ppr;
                RegionMatrix[rp(g, 'node')] = -1;
                RegionMatrix[rp(g, 'centerX')] = RegionMatrix[rp(r, 'centerX')] + w;
                RegionMatrix[rp(g, 'centerY')] = RegionMatrix[rp(r, 'centerY')] - w;
                RegionMatrix[rp(g, 'size')] = w;
                RegionMatrix[rp(g, 'nextSibling')] = g + W.ppr;
                RegionMatrix[rp(g, 'firstChild')] = -1;
                RegionMatrix[rp(g, 'mass')] = 0;
                RegionMatrix[rp(g, 'massCenterX')] = 0;
                RegionMatrix[rp(g, 'massCenterY')] = 0;

                // Bottom Right sub-region
                g += W.ppr;
                RegionMatrix[rp(g, 'node')] = -1;
                RegionMatrix[rp(g, 'centerX')] = RegionMatrix[rp(r, 'centerX')] + w;
                RegionMatrix[rp(g, 'centerY')] = RegionMatrix[rp(r, 'centerY')] + w;
                RegionMatrix[rp(g, 'size')] = w;
                RegionMatrix[rp(g, 'nextSibling')] = RegionMatrix[rp(r, 'nextSibling')];
                RegionMatrix[rp(g, 'firstChild')] = -1;
                RegionMatrix[rp(g, 'mass')] = 0;
                RegionMatrix[rp(g, 'massCenterX')] = 0;
                RegionMatrix[rp(g, 'massCenterY')] = 0;

                l += 4;

                // Now the goal is to find two different sub-regions
                // for the two nodes: the one previously recorded (r[0])
                // and the one we want to add (n)

                // Find the quadrant of the old node
                if (NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'x')] < RegionMatrix[rp(r, 'centerX')]) {
                  if (NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'y')] < RegionMatrix[rp(r, 'centerY')]) {

                    // Top Left quarter
                    q = RegionMatrix[rp(r, 'firstChild')];
                  }
                  else {

                    // Bottom Left quarter
                    q = RegionMatrix[rp(r, 'firstChild')] + W.ppr;
                  }
                }
                else {
                  if (NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'y')] < RegionMatrix[rp(r, 'centerY')]) {

                    // Top Right quarter
                    q = RegionMatrix[rp(r, 'firstChild')] + W.ppr * 2;
                  }
                  else {

                    // Bottom Right quarter
                    q = RegionMatrix[rp(r, 'firstChild')] + W.ppr * 3;
                  }
                }

                // We remove r[0] from the region r, add its mass to r and record it in q
                RegionMatrix[rp(r, 'mass')] = NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'mass')];
                RegionMatrix[rp(r, 'massCenterX')] = NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'x')];
                RegionMatrix[rp(r, 'massCenterY')] = NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'y')];

                RegionMatrix[rp(q, 'node')] = RegionMatrix[rp(r, 'node')];
                RegionMatrix[rp(r, 'node')] = -1;

                // Find the quadrant of n
                if (NodeMatrix[np(n, 'x')] < RegionMatrix[rp(r, 'centerX')]) {
                  if (NodeMatrix[np(n, 'y')] < RegionMatrix[rp(r, 'centerY')]) {

                    // Top Left quarter
                    q2 = RegionMatrix[rp(r, 'firstChild')];
                  }
                  else {
                    // Bottom Left quarter
                    q2 = RegionMatrix[rp(r, 'firstChild')] + W.ppr;
                  }
                }
                else {
                  if(NodeMatrix[np(n, 'y')] < RegionMatrix[rp(r, 'centerY')]) {

                    // Top Right quarter
                    q2 = RegionMatrix[rp(r, 'firstChild')] + W.ppr * 2;
                  }
                  else {

                    // Bottom Right quarter
                    q2 = RegionMatrix[rp(r, 'firstChild')] + W.ppr * 3;
                  }
                }

                if (q === q2) {

                  // If both nodes are in the same quadrant,
                  // we have to try it again on this quadrant
                  r = q;
                  continue;
                }

                // If both quadrants are different, we record n
                // in its quadrant
                RegionMatrix[rp(q2, 'node')] = n;
                break;
              }
            }
          }
        }
      }


      // 2) Repulsion
      //--------------
      // NOTES: adjustSizes = antiCollision & scalingRatio = coefficient

      if (W.settings.barnesHutOptimize) {
        coefficient = W.settings.scalingRatio;

        // Applying repulsion through regions
        for (n = 0; n < W.nodesLength; n += W.ppn) {

          // Computing leaf quad nodes iteration

          r = 0; // Starting with root region
          while (true) {

            if (RegionMatrix[rp(r, 'firstChild')] >= 0) {

              // The region has sub-regions

              // We run the Barnes Hut test to see if we are at the right distance
              distance = Math.sqrt(
                (NodeMatrix[np(n, 'x')] - RegionMatrix[rp(r, 'massCenterX')]) *
                (NodeMatrix[np(n, 'x')] - RegionMatrix[rp(r, 'massCenterX')]) +
                (NodeMatrix[np(n, 'y')] - RegionMatrix[rp(r, 'massCenterY')]) *
                (NodeMatrix[np(n, 'y')] - RegionMatrix[rp(r, 'massCenterY')])
              );

              if (2 * RegionMatrix[rp(r, 'size')] / distance < W.settings.barnesHutTheta) {

                // We treat the region as a single body, and we repulse

                xDist = NodeMatrix[np(n, 'x')] - RegionMatrix[rp(r, 'massCenterX')];
                yDist = NodeMatrix[np(n, 'y')] - RegionMatrix[rp(r, 'massCenterY')];

                if (W.settings.adjustSizes) {

                  //-- Linear Anti-collision Repulsion
                  if (distance > 0) {
                    factor = coefficient * NodeMatrix[np(n, 'mass')] *
                      RegionMatrix[rp(r, 'mass')] / distance / distance;

                    NodeMatrix[np(n, 'dx')] += xDist * factor;
                    NodeMatrix[np(n, 'dy')] += yDist * factor;
                  }
                  else if (distance < 0) {
                    factor = -coefficient * NodeMatrix[np(n, 'mass')] *
                      RegionMatrix[rp(r, 'mass')] / distance;

                    NodeMatrix[np(n, 'dx')] += xDist * factor;
                    NodeMatrix[np(n, 'dy')] += yDist * factor;
                  }
                }
                else {

                  //-- Linear Repulsion
                  if (distance > 0) {
                    factor = coefficient * NodeMatrix[np(n, 'mass')] *
                      RegionMatrix[rp(r, 'mass')] / distance / distance;

                    NodeMatrix[np(n, 'dx')] += xDist * factor;
                    NodeMatrix[np(n, 'dy')] += yDist * factor;
                  }
                }

                // When this is done, we iterate. We have to look at the next sibling.
                if (RegionMatrix[rp(r, 'nextSibling')] < 0)
                  break;  // No next sibling: we have finished the tree
                r = RegionMatrix[rp(r, 'nextSibling')];
                continue;

              }
              else {

                // The region is too close and we have to look at sub-regions
                r = RegionMatrix[rp(r, 'firstChild')];
                continue;
              }

            }
            else {

              // The region has no sub-region
              // If there is a node r[0] and it is not n, then repulse

              if (RegionMatrix[rp(r, 'node')] >= 0 && RegionMatrix[rp(r, 'node')] !== n) {
                xDist = NodeMatrix[np(n, 'x')] - NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'x')];
                yDist = NodeMatrix[np(n, 'y')] - NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'y')];

                distance = Math.sqrt(xDist * xDist + yDist * yDist);

                if (W.settings.adjustSizes) {

                  //-- Linear Anti-collision Repulsion
                  if (distance > 0) {
                    factor = coefficient * NodeMatrix[np(n, 'mass')] *
                      NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'mass')] / distance / distance;

                    NodeMatrix[np(n, 'dx')] += xDist * factor;
                    NodeMatrix[np(n, 'dy')] += yDist * factor;
                  }
                  else if (distance < 0) {
                    factor = -coefficient * NodeMatrix[np(n, 'mass')] *
                      NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'mass')] / distance;

                    NodeMatrix[np(n, 'dx')] += xDist * factor;
                    NodeMatrix[np(n, 'dy')] += yDist * factor;
                  }
                }
                else {

                  //-- Linear Repulsion
                  if (distance > 0) {
                    factor = coefficient * NodeMatrix[np(n, 'mass')] *
                      NodeMatrix[np(RegionMatrix[rp(r, 'node')], 'mass')] / distance / distance;

                    NodeMatrix[np(n, 'dx')] += xDist * factor;
                    NodeMatrix[np(n, 'dy')] += yDist * factor;
                  }
                }

              }

              // When this is done, we iterate. We have to look at the next sibling.
              if (RegionMatrix[rp(r, 'nextSibling')] < 0)
                break;  // No next sibling: we have finished the tree
              r = RegionMatrix[rp(r, 'nextSibling')];
              continue;
            }
          }
        }
      }
      else {
        coefficient = W.settings.scalingRatio;

        // Square iteration
        for (n1 = 0; n1 < W.nodesLength; n1 += W.ppn) {
          for (n2 = 0; n2 < n1; n2 += W.ppn) {

            // Common to both methods
            xDist = NodeMatrix[np(n1, 'x')] - NodeMatrix[np(n2, 'x')];
            yDist = NodeMatrix[np(n1, 'y')] - NodeMatrix[np(n2, 'y')];

            if (W.settings.adjustSizes) {

              //-- Anticollision Linear Repulsion
              distance = Math.sqrt(xDist * xDist + yDist * yDist) -
                NodeMatrix[np(n1, 'size')] -
                NodeMatrix[np(n2, 'size')];

              if (distance > 0) {
                factor = coefficient *
                  NodeMatrix[np(n1, 'mass')] *
                  NodeMatrix[np(n2, 'mass')] /
                  distance / distance;

                // Updating nodes' dx and dy
                NodeMatrix[np(n1, 'dx')] += xDist * factor;
                NodeMatrix[np(n1, 'dy')] += yDist * factor;

                NodeMatrix[np(n2, 'dx')] += xDist * factor;
                NodeMatrix[np(n2, 'dy')] += yDist * factor;
              }
              else if (distance < 0) {
                factor = 100 * coefficient *
                  NodeMatrix[np(n1, 'mass')] *
                  NodeMatrix[np(n2, 'mass')];

                // Updating nodes' dx and dy
                NodeMatrix[np(n1, 'dx')] += xDist * factor;
                NodeMatrix[np(n1, 'dy')] += yDist * factor;

                NodeMatrix[np(n2, 'dx')] -= xDist * factor;
                NodeMatrix[np(n2, 'dy')] -= yDist * factor;
              }
            }
            else {

              //-- Linear Repulsion
              distance = Math.sqrt(xDist * xDist + yDist * yDist);

              if (distance > 0) {
                factor = coefficient *
                  NodeMatrix[np(n1, 'mass')] *
                  NodeMatrix[np(n2, 'mass')] /
                  distance / distance;

                // Updating nodes' dx and dy
                NodeMatrix[np(n1, 'dx')] += xDist * factor;
                NodeMatrix[np(n1, 'dy')] += yDist * factor;

                NodeMatrix[np(n2, 'dx')] -= xDist * factor;
                NodeMatrix[np(n2, 'dy')] -= yDist * factor;
              }
            }
          }
        }
      }


      // 3) Gravity
      //------------
      g = W.settings.gravity / W.settings.scalingRatio;
      coefficient = W.settings.scalingRatio;
      for (n = 0; n < W.nodesLength; n += W.ppn) {
        factor = 0;

        // Common to both methods
        xDist = NodeMatrix[np(n, 'x')];
        yDist = NodeMatrix[np(n, 'y')];
        distance = Math.sqrt(xDist * xDist + yDist * yDist);

        if (W.settings.strongGravityMode) {

          //-- Strong gravity
          if (distance > 0)
            factor = coefficient * NodeMatrix[np(n, 'mass')] * g;
        }
        else {

          //-- Linear Anti-collision Repulsion n
          if (distance > 0)
            factor = coefficient * NodeMatrix[np(n, 'mass')] * g / distance;
        }

        // Updating node's dx and dy
        NodeMatrix[np(n, 'dx')] -= xDist * factor;
        NodeMatrix[np(n, 'dy')] -= yDist * factor;
      }



      // 4) Attraction
      //---------------
      coefficient = 1 * (W.settings.outboundAttractionDistribution ? outboundAttCompensation : 1);

      // TODO: simplify distance
      // TODO: coefficient is always used as -c --> optimize?
      for (e = 0; e < W.edgesLength; e += W.ppe) {
        n1 = EdgeMatrix[ep(e, 'source')];
        n2 = EdgeMatrix[ep(e, 'target')];
        w = EdgeMatrix[ep(e, 'weight')];

        // Edge weight influence
        ewc = Math.pow(w, W.settings.edgeWeightInfluence);

        // Common measures
        xDist = NodeMatrix[np(n1, 'x')] - NodeMatrix[np(n2, 'x')];
        yDist = NodeMatrix[np(n1, 'y')] - NodeMatrix[np(n2, 'y')];

        // Applying attraction to nodes
        if (W.settings.adjustSizes) {

          distance = Math.sqrt(
            (xDist * xDist + yDist * yDist) -
            NodeMatrix[np(n1, 'size')] -
            NodeMatrix[np(n2, 'size')]
          ) - minNodeDistance;

          if (W.settings.linLogMode) {
            if (W.settings.outboundAttractionDistribution) {

              //-- LinLog Degree Distributed Anti-collision Attraction
              if (distance > 0) {
                factor = -coefficient * ewc * Math.log(1 + distance) /
                distance /
                NodeMatrix[np(n1, 'mass')];
              }
            }
            else {

              //-- LinLog Anti-collision Attraction
              if (distance > 0) {
                factor = -coefficient * ewc * Math.log(1 + distance) / distance;
              }
            }
          }
          else {
            if (W.settings.outboundAttractionDistribution) {

              //-- Linear Degree Distributed Anti-collision Attraction
              if (distance > 0) {
                factor = -coefficient * ewc / NodeMatrix[np(n1, 'mass')];
              }
            }
            else {

              //-- Linear Anti-collision Attraction
              if (distance > 0) {
                factor = -coefficient * ewc;
              }
            }
          }
        }
        else {

          distance = Math.sqrt(xDist * xDist + yDist * yDist) - minNodeDistance;

          if (W.settings.linLogMode) {
            if (W.settings.outboundAttractionDistribution) {

              //-- LinLog Degree Distributed Attraction
              if (distance > 0) {
                factor = -coefficient * ewc * Math.log(1 + distance) /
                  distance /
                  NodeMatrix[np(n1, 'mass')];
              }
            }
            else {

              //-- LinLog Attraction
              if (distance > 0)
                factor = -coefficient * ewc * Math.log(1 + distance) / distance;
            }
          }
          else {
            if (W.settings.outboundAttractionDistribution) {

              //-- Linear Attraction Mass Distributed
              // NOTE: Distance is set to 1 to override next condition
              distance = 1;
              factor = -coefficient * ewc / NodeMatrix[np(n1, 'mass')];
            }
            else {

              //-- Linear Attraction
              // NOTE: Distance is set to 1 to override next condition
              distance = 1;
              factor = -coefficient * ewc;
            }
          }
        }

        // Updating nodes' dx and dy
        // TODO: if condition or factor = 1?
        if (distance > 0) {

          // Updating nodes' dx and dy
          NodeMatrix[np(n1, 'dx')] += xDist * factor;
          NodeMatrix[np(n1, 'dy')] += yDist * factor;

          NodeMatrix[np(n2, 'dx')] -= xDist * factor;
          NodeMatrix[np(n2, 'dy')] -= yDist * factor;
        }
      }


      // 5) Apply Forces
      //-----------------
      var force,
          swinging,
          traction,
          nodespeed,
          alldistance = 0;

      // MATH: sqrt and square distances
      if (W.settings.adjustSizes) {

        for (n = 0; n < W.nodesLength; n += W.ppn) {
          if (!NodeMatrix[np(n, 'fixed')]) {
            force = Math.sqrt(
              NodeMatrix[np(n, 'dx')] * NodeMatrix[np(n, 'dx')] +
              NodeMatrix[np(n, 'dy')] * NodeMatrix[np(n, 'dy')]
            );

            if (force > W.maxForce) {
              NodeMatrix[np(n, 'dx')] =
                NodeMatrix[np(n, 'dx')] * W.maxForce / force;
              NodeMatrix[np(n, 'dy')] =
                NodeMatrix[np(n, 'dy')] * W.maxForce / force;
            }

            swinging = NodeMatrix[np(n, 'mass')] *
              Math.sqrt(
                (NodeMatrix[np(n, 'old_dx')] - NodeMatrix[np(n, 'dx')]) *
                (NodeMatrix[np(n, 'old_dx')] - NodeMatrix[np(n, 'dx')]) +
                (NodeMatrix[np(n, 'old_dy')] - NodeMatrix[np(n, 'dy')]) *
                (NodeMatrix[np(n, 'old_dy')] - NodeMatrix[np(n, 'dy')])
              );

            traction = Math.sqrt(
              (NodeMatrix[np(n, 'old_dx')] + NodeMatrix[np(n, 'dx')]) *
              (NodeMatrix[np(n, 'old_dx')] + NodeMatrix[np(n, 'dx')]) +
              (NodeMatrix[np(n, 'old_dy')] + NodeMatrix[np(n, 'dy')]) *
              (NodeMatrix[np(n, 'old_dy')] + NodeMatrix[np(n, 'dy')])
            ) / 2;

            nodespeed =
              0.1 * Math.log(1 + traction) / (1 + Math.sqrt(swinging));

            oldxDist = NodeMatrix[np(n, 'x')];
            oldyDist = NodeMatrix[np(n, 'y')];

            // Updating node's positon
            NodeMatrix[np(n, 'x')] =
              NodeMatrix[np(n, 'x')] + NodeMatrix[np(n, 'dx')] *
              (nodespeed / W.settings.slowDown);
            NodeMatrix[np(n, 'y')] =
              NodeMatrix[np(n, 'y')] + NodeMatrix[np(n, 'dy')] *
              (nodespeed / W.settings.slowDown);

            xDist = NodeMatrix[np(n, 'x')];
            yDist = NodeMatrix[np(n, 'y')];
            distance = Math.sqrt(
              (xDist - oldxDist) * (xDist - oldxDist) +
              (yDist - oldyDist) * (yDist - oldyDist)
            );
            alldistance += distance;
          }
        }
      }
      else {

        for (n = 0; n < W.nodesLength; n += W.ppn) {
          if (!NodeMatrix[np(n, 'fixed')]) {

            swinging = NodeMatrix[np(n, 'mass')] *
              Math.sqrt(
                (NodeMatrix[np(n, 'old_dx')] - NodeMatrix[np(n, 'dx')]) *
                (NodeMatrix[np(n, 'old_dx')] - NodeMatrix[np(n, 'dx')]) +
                (NodeMatrix[np(n, 'old_dy')] - NodeMatrix[np(n, 'dy')]) *
                (NodeMatrix[np(n, 'old_dy')] - NodeMatrix[np(n, 'dy')])
              );

            traction = Math.sqrt(
              (NodeMatrix[np(n, 'old_dx')] + NodeMatrix[np(n, 'dx')]) *
              (NodeMatrix[np(n, 'old_dx')] + NodeMatrix[np(n, 'dx')]) +
              (NodeMatrix[np(n, 'old_dy')] + NodeMatrix[np(n, 'dy')]) *
              (NodeMatrix[np(n, 'old_dy')] + NodeMatrix[np(n, 'dy')])
            ) / 2;

            nodespeed = NodeMatrix[np(n, 'convergence')] *
              Math.log(1 + traction) / (1 + Math.sqrt(swinging));

            // Updating node convergence
            NodeMatrix[np(n, 'convergence')] =
              Math.min(1, Math.sqrt(
                nodespeed *
                (NodeMatrix[np(n, 'dx')] * NodeMatrix[np(n, 'dx')] +
                 NodeMatrix[np(n, 'dy')] * NodeMatrix[np(n, 'dy')]) /
                (1 + Math.sqrt(swinging))
              ));

            oldxDist = NodeMatrix[np(n, 'x')];
            oldyDist = NodeMatrix[np(n, 'y')];

            // Updating node's positon
            NodeMatrix[np(n, 'x')] =
              NodeMatrix[np(n, 'x')] + NodeMatrix[np(n, 'dx')] *
              (nodespeed / W.settings.slowDown);
            NodeMatrix[np(n, 'y')] =
              NodeMatrix[np(n, 'y')] + NodeMatrix[np(n, 'dy')] *
              (nodespeed / W.settings.slowDown);

            xDist = NodeMatrix[np(n, 'x')];
            yDist = NodeMatrix[np(n, 'y')];
            distance = Math.sqrt(
              (xDist - oldxDist) * (xDist - oldxDist) +
              (yDist - oldyDist) * (yDist - oldyDist)
            );
            alldistance += distance;
          }
        }
      }

      // Counting one more iteration
      W.iterations++;

      // Auto stop.
      // The greater the ratio nb nodes / nb edges,
      // the greater the number of iterations needed to converge.
      if (W.settings.autoStop) {
        W.converged = (
          W.iterations > W.settings.maxIterations ||
          alldistance / W.nodesLength < W.settings.avgDistanceThreshold
        );

        // align nodes that are linked to the same two nodes only:
        if (W.converged && W.settings.alignNodeSiblings) {
          // console.time("alignment");

          var
            neighbors = {}, // index of neighbors
            parallelNodes = {}, // set of parallel nodes indexed by same <source;target>
            setKey, // tmp
            keysN;  // tmp

          // build index of neighbors:
          for (e = 0; e < W.edgesLength; e += W.ppe) {
            n1 = EdgeMatrix[ep(e, 'source')];
            n2 = EdgeMatrix[ep(e, 'target')];

            if (n1 === n2) continue;

            neighbors[n1] = neighbors[n1] || {};
            neighbors[n2] = neighbors[n2] || {};
            neighbors[n1][n2] = true;
            neighbors[n2][n1] = true;
          }

          // group triplets by same <source, target> (resp. target, source):
          Object.keys(neighbors).forEach(function(n) {
            n = ~~n;  // string to int
            keysN = Object.keys(neighbors[n]);
            if (keysN.length == 2) {
              setKey = keysN[0] + ';' + keysN[1];
              if (setKey in parallelNodes) {
                parallelNodes[setKey].push(n);
              }
              else {
                setKey = keysN[1] + ';' + keysN[0];
                if (!parallelNodes[setKey]) {
                  parallelNodes[setKey] = [ ~~keysN[1], ~~keysN[0] ];
                }
                parallelNodes[setKey].push(n);
              }
            }
          });

          var
            setNodes,
            setSource,
            setTarget,
            degSource,
            degTarget,
            sX,
            sY,
            tX,
            tY,
            t,
            distSourceTarget,
            intersectionPoint,
            normalVector,
            nNormaleVector,
            angle,
            angleMin = W.settings.nodeSiblingsAngleMin;

          Object.keys(parallelNodes).forEach(function(key) {
            setSource = parallelNodes[key].shift();
            setTarget = parallelNodes[key].shift();
            setNodes = parallelNodes[key].filter(function(setNode) {
              return !NodeMatrix[np(setNode, 'fixed')];
            });

            if (setNodes.length == 1) return;

            sX = NodeMatrix[np(setSource, 'x')];
            sY = NodeMatrix[np(setSource, 'y')];
            tX = NodeMatrix[np(setTarget, 'x')];
            tY = NodeMatrix[np(setTarget, 'y')];

            // the extremity of lowest degree attracts the nodes
            // up to 1/4 of the distance:
            degSource = Object.keys(neighbors[setSource]).length;
            degTarget = Object.keys(neighbors[setTarget]).length;
            t = scaleRange(degSource / (degSource + degTarget), 0, 1, 1/4, 3/4);
            intersectionPoint = getPointOnLineSegment(sX, sY, tX, tY, t);

            // vector normal to the segment [source, target]:
            normalVector = getNormalVector(sX, sY, tX, tY);

            distSourceTarget = getDistance(sX, sY, tX, tY);

            // normalized normal vector:
            nNormaleVector = getNormalizedVector(normalVector, distSourceTarget);

            angle = getVectorAngle(nNormaleVector);

            // avoid horizontal vector because node labels overlap:
            if (2 * angleMin > Math.PI)
              throw new Error('ForceLink.Worker - Invalid parameter: angleMin must be smaller than 2 PI.');

            if (angleMin > 0) {
              // TODO layout parameter
              if (angle < angleMin ||
                (angle > Math.PI - angleMin) && angle <= Math.PI) {

                // New vector of angle PI - angleMin
                nNormaleVector = {
                  x: Math.cos(Math.PI - angleMin) * 2,
                  y: Math.sin(Math.PI - angleMin) * 2
                };
              }
              else if ((angle > 2 * Math.PI - angleMin) ||
                angle >= Math.PI && (angle < Math.PI + angleMin)) {

                // New vector of angle angleMin
                nNormaleVector = {
                  x: Math.cos(angleMin) * 2,
                  y: Math.sin(angleMin) * 2
                };
              }
            }

            // evenly distribute nodes along the perpendicular line to
            // [source, target] at the computed intersection point:
            var
              start = 0,
              sign = 1,
              steps = 1;

            if (setNodes.length % 2 == 1) {
              steps = 0;
              start = 1;
            }

            for(var i = 0; i < setNodes.length; i++) {
              NodeMatrix[np(setNodes[i], 'x')] =
                intersectionPoint.x + (sign * nNormaleVector.x * steps) *
                ((start || i >= 2) ? W.settings.nodeSiblingsScale : W.settings.nodeSiblingsScale * 2/3);

              NodeMatrix[np(setNodes[i], 'y')] =
                intersectionPoint.y + (sign * nNormaleVector.y * steps) *
                ((start || i >= 2) ? W.settings.nodeSiblingsScale : W.settings.nodeSiblingsScale * 2/3);

              sign = -sign;
              steps += (i + start) % 2;
            }
          });

          // console.timeEnd("alignment");
        }
      }
    }

    /**
     * Message reception & sending
     */

    // Sending data back to the supervisor
    var sendNewCoords;

    if (typeof window !== 'undefined' && window.document) {

      // From same document as sigma
      sendNewCoords = function() {
        if (!W.autoStop || W.converged) {
          var e;

          if (document.createEvent) {
            e = document.createEvent('Event');
            e.initEvent('newCoords', true, false);
          }
          else {
            e = document.createEventObject();
            e.eventType = 'newCoords';
          }

          e.eventName = 'newCoords';
          e.data = {
            nodes: NodeMatrix.buffer,
            converged: W.converged
          };
          requestAnimationFrame(function() {
            document.dispatchEvent(e);
          });
        }
      };
    }
    else {

      // From a WebWorker
      sendNewCoords = function() {
        if (!W.autoStop || W.converged) {
          self.postMessage(
            {
              nodes: NodeMatrix.buffer,
              converged: W.converged
            },
            [NodeMatrix.buffer]
          );
        }
      };
    }

    // Algorithm run
    function run(n) {
      for (var i = 0; i < n; i++)
        pass();
      sendNewCoords();
    }

    // On supervisor message
    var listener = function(e) {
      switch (e.data.action) {
        case 'start':
          init(
            new Float32Array(e.data.nodes),
            new Float32Array(e.data.edges),
            e.data.config
          );

          // First iteration(s)
          run(W.settings.startingIterations);
          break;

        case 'loop':
          NodeMatrix = new Float32Array(e.data.nodes);
          run(W.settings.iterationsPerRender);
          break;

        case 'config':

          // Merging new settings
          configure(e.data.config);
          break;

        case 'kill':

          // Deleting context for garbage collection
          __emptyObject(W);
          NodeMatrix = null;
          EdgeMatrix = null;
          RegionMatrix = null;
          self.removeEventListener('message', listener);
          break;

        default:
      }
    };

    // Adding event listener
    self.addEventListener('message', listener);
  };


  /**
   * Exporting
   * ----------
   *
   * Crush the worker function and make it accessible by sigma's instances so
   * the supervisor can call it.
   */
  function crush(fnString) {
    var pattern,
        i,
        l;

    var np = [
      'x',
      'y',
      'dx',
      'dy',
      'old_dx',
      'old_dy',
      'mass',
      'convergence',
      'size',
      'fixed'
    ];

    var ep = [
      'source',
      'target',
      'weight'
    ];

    var rp = [
      'node',
      'centerX',
      'centerY',
      'size',
      'nextSibling',
      'firstChild',
      'mass',
      'massCenterX',
      'massCenterY'
    ];

    // rp
    // NOTE: Must go first
    for (i = 0, l = rp.length; i < l; i++) {
      pattern = new RegExp('rp\\(([^,]*), \'' + rp[i] + '\'\\)', 'g');
      fnString = fnString.replace(
        pattern,
        (i === 0) ? '$1' : '$1 + ' + i
      );
    }

    // np
    for (i = 0, l = np.length; i < l; i++) {
      pattern = new RegExp('np\\(([^,]*), \'' + np[i] + '\'\\)', 'g');
      fnString = fnString.replace(
        pattern,
        (i === 0) ? '$1' : '$1 + ' + i
      );
    }

    // ep
    for (i = 0, l = ep.length; i < l; i++) {
      pattern = new RegExp('ep\\(([^,]*), \'' + ep[i] + '\'\\)', 'g');
      fnString = fnString.replace(
        pattern,
        (i === 0) ? '$1' : '$1 + ' + i
      );
    }

    return fnString;
  }

  // Exporting
  function getWorkerFn() {
    var fnString = crush ? crush(Worker.toString()) : Worker.toString();
    return ';(' + fnString + ').call(this);';
  }

  if (inWebWorker) {
    // We are in a webworker, so we launch the Worker function
    eval(getWorkerFn());
  }
  else {
    // We are requesting the worker from sigma, we retrieve it therefore
    if (typeof sigma === 'undefined')
      throw new Error('sigma is not declared');

    sigma.layouts.getForceLinkWorker = getWorkerFn;
  }
}).call(this);
