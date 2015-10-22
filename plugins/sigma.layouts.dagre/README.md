sigma.layouts.dagre
========================

Plugin developed by [Sébastien Heymann](https://github.com/sheymann) for [Linkurious](https://github.com/Linkurious) and published under the [MIT](LICENSE) license.

Contact: seb@linkurio.us

---

This plugin implements a binding to the [dagre layout](https://github.com/cpettitt/dagre), which organises the graph using a DAG (directed acyclic graph) system, written by [Chris Pettitt](https://www.linkedin.com/in/chrismpettitt). It is especially suitable for DAGs and trees. For more information, please refer to its [Dagre's documentation](https://github.com/cpettitt/dagre/wiki).

Because Dagre is a separate library, the developer must manually include [`dagre.js`](https://github.com/cpettitt/dagre/releases) in their app in order to use the layout.

:warning: The time complexity of the algorithm is quadratic and is thus suitable for small graphs with less than 300 edges only.

## Recommended reading

source: https://github.com/cpettitt/dagre/wiki#recommended-reading

This work was produced by taking advantage of many papers and books. If you're interested in how dagre works internally here are some of the most important papers to read.

The general skeleton for Dagre comes from [*Gansner, et al., "A Technique for Drawing Directed Graphs"*](http://www.graphviz.org/Documentation/TSE93.pdf), which gives both an excellent high level overview of the phases involved in layered drawing as well as diving into the details and problems of each of the phases. Besides the basic skeleton, the author specifically used the technique described in the paper to produce an acyclic graph, and the author use the network simplex algorithm for ranking. If there is one paper to start with when learning about layered graph drawing, this is it!

For crossing minimization we used [*Jünger and Mutzel, "2-Layer Straightline Crossing Minimization"*](http://www.researchgate.net/profile/Petra_Mutzel/publication/30508315_2-Layer_Straightline_Crossing_Minimization_Performance_of_Exact_and_Heuristic_Algorithms/links/09e4150eabaf4cc7bd000000.pdf), which provides a comparison of the performance of various heuristics and exact algorithms for crossing minimization.

For counting the number of edge crossings between two layers we use the `O(|E| log |V_small|)` algorithm described in [*Barth, et al., "Simple and Efficient Bilayer Cross Counting"*](http://jgaa.info/accepted/2004/BarthMutzelJuenger2004.8.2.pdf).

For positioning (or coordinate assignment), we derived our algorithm from [*Brandes and Köpf, "Fast and Simple Horizontal Coordinate Assignment"*](http://www.inf.uni-konstanz.de/algo/publications/bk-fshca-01.pdf). The author made some adjustments to get tighter graphs when node and edges sizes vary greatly.

The implementation for clustering derives extensively from Sander, [*"Layout of Compound Directed Graphs."*](http://scidok.sulb.uni-saarland.de/volltexte/2005/359/pdf/tr-A03-96.pdf) It is an excellent paper that details the impact of clustering on all phases of layout and also covers many of the associated problems. Crossing reduction with clustered graphs derives from two papers by Michael Forster, *"Applying Crossing Reduction Strategies to Layered Compound Graphs"* and *"A Fast and Simple Heuristic for Constrained Two-Level Crossing Reduction."*

## Methods

**configure**

Changes the layout's configuration.

```js
var listener = sigma.layouts.dagre.configure(sigInst, config);
```

**start**

Starts the layout. It is possible to pass a configuration if this is the first time you start the layout.

```js
var listener = sigma.layouts.dagre.start(sigInst, config);
```

**isRunning**

Returns whether the layout is running.

```js
sigma.layouts.dagre.isRunning(sigInst);
```

## Configuration

* **nodes**: *array*: the subset of nodes to apply the layout.
* **boundingBox** *object|boolean*: constrain layout bounds. Value: {minX, maxX, minY, maxY} or true (all current positions of the given nodes).

*Algorithm configuration*

* **directed**: *boolean* `true`: if `true`, take edge direction into account.
* **multigraph**: *boolean* `true`: if `true`, allows multiple edges between the same pair of nodes.
* **compound**: *boolean* `true`: if `true`, allows ompound nodes, i.e. nodes which can be the parent of other nodes.
* **rankDir** *string* `TB`: direction for rank nodes. Can be `TB`, `BT`, `LR`, or `RL`, where T = top, B = bottom, L = left, and R = right.

*Easing configuration*

* **easing** *string*: if specified, ease the transition between nodes positions if background is `true`. The duration is specified by the Sigma settings `animationsTime`. See [sigma.utils.easing](../../src/utils/sigma.utils.js#L723) for available values.
* **duration** *number*: duration of the transition for the easing method. Default value is Sigma setting `animationsTime`.

## Events

The plugin dispatches the following events:

- `start`: on layout start.
- `interpolate`: at the beginning of the layout animation if an *easing* function is specified and the layout is ran on background.
- `stop`: on layout stop, will be dispatched after `interpolate`.

Example:

```js
var config = {
  rankdir: 'TB'
};

// Start the algorithm:
var listener = sigma.layouts.dagre.configure(sigInst, config);

// Bind all events:
listener.bind('start stop interpolate', function(event) {
  console.log(event.type);
});

sigma.layouts.dagre.start(sigInst);
```
