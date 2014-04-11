'use strict';




// GENERATES THE GRAPH
// *******************

var N = 300;
var LAMBA = 10000;

var nodes = [
  { x: 200 + rand(1000), y: rand(1000) - 100, id: 0, degree: 1, incoming: [], outgoing: [] },
  { x: 200 + rand(1000), y: rand(1000) - 100, id: 1, degree: 1, incoming: [], outgoing: [] }
];
var edges = [{ from: 0, to: 1 }];
nodes[0].outgoing.push(edges[0]);
nodes[1].incoming.push(edges[0]);
var degreeSum = 2;

var n, edgeNb, randTargetByDegree, targets;

for (var i = 2; i < N; i++) {
  n = { x: 200 + rand(1000), y: rand(1000) - 100, id: i, incoming: [], outgoing: [] };

  edgeNb = 1 + Math.floor(Math.sqrt(nodes.length) * Math.exp(-LAMBA * Math.random()));

  targets = new Set();
  while (targets.size < edgeNb) {
    randTargetByDegree = rand(degreeSum);
    nodes.some(function (n) {
      randTargetByDegree -= n.degree;
      if (randTargetByDegree < 0) {
        targets.add(n);
        return true;
      }
    });
  }

  n.degree = edgeNb;
  nodes.push(n);

  for (var k in targets) {
    var t = targets[k];
    var edge = { from: n.id, to: t.id };
    edges.push(edge);
    n.outgoing.push(edge);
    t.incoming.push(edge);
    t.degree++;
  }

  degreeSum += 2 * edgeNb;
}

var edges = edges.filter(function (e) {
  return e.from !== e.to;
});





// INITIAL DRAWING
// ***************



document.addEventListener('DOMContentLoaded', function () {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";

  var svg = document.querySelector('svg');


  // initial drawing
  edges.forEach(function (e) {
    var line = document.createElementNS(SVGNS, "line");
    line.classList.add('edge');

    line.setAttribute('x1', nodes[e.from].x);
    line.setAttribute('y1', nodes[e.from].y);
    line.setAttribute('x2', nodes[e.to].x);
    line.setAttribute('y2', nodes[e.to].y);

    e.element = line;
    svg.appendChild(line);
  });

  nodes.forEach(function (n) {
    var circle = document.createElementNS(SVGNS, "circle");
    circle.classList.add('node');

    circle.setAttribute('r', 6);
    circle.setAttribute('cx', n.x);
    circle.setAttribute('cy', n.y);

    n.element = circle;
    svg.appendChild(circle);
  });

  function drawSoon(coords) {
    coords.forEach(function (p) {
      var n = nodes[p.id];
      var circle = n.element;

      n.x = p.x;
      n.y = p.y;

      circle.setAttribute('cx', n.x);
      circle.setAttribute('cy', n.y);
    });

    edges.forEach(function (e) {
      var line = e.element;
      line.setAttribute('x1', nodes[e.from].x);
      line.setAttribute('y1', nodes[e.from].y);
      line.setAttribute('x2', nodes[e.to].x);
      line.setAttribute('y2', nodes[e.to].y);
    });
  }

});








var Greeter = (function () {
  function Greeter(message) {
    this.greeting = message;
  }
  Greeter.prototype.greet = function () {
    return "Hello, " + this.greeting;
  };
  return Greeter;
})();

var greeter = new Greeter("world");

var button = document.createElement('button');
button.textContent = "Say Hello";
button.onclick = function () {
  alert(greeter.greet());
};

document.body.appendChild(button);






;(function() {
  'use strict';
})();
