sigma.plugins.generators
=====================

Plugin developed by [Sébastien Heymann](https://github.com/sheymann) for [Linkurious](https://github.com/Linkurious) and published under the [MIT](LICENSE) license. Most algorithms are ported from https://github.com/gka/randomgraph.js, which come from the [Gephi implementations](https://github.com/cbartosiak/gephi-plugins/tree/complex-generators/ComplexGeneratorPlugin/src/org/gephi/io/complexgenerator/plugin).

Contact: seb@linkurio.us

---

This plugin provides functions to generate random graphs.

See the following [example code](../../examples/plugin-generators.html) and [unit test](../../test/unit.plugins.generators.js) for full usage.

To use, include all .js files under this folder, then call one of the graph generator.

## Path

Generates a path.

### Parameters

 * **nbNodes**
   * The number of nodes.
   * type: *number*

### Example

````javascript
var graph = sigma.plugins.generators.path(100);
sigmaInstance.graph.read(graph);
````

## Grid

Generates a grid.

### Parameters

 * **nbRows**
   * The number of rows.
   * type: *number*
 * **nbColumns**
   * The number of columns.
   * type: *number*

### Example

````javascript
var graph = sigma.plugins.generators.grid(10, 10);
sigmaInstance.graph.read(graph);
````

## Random graph

Generates a random graph.

### Parameters

 * **nbNodes**
   * The number of nodes.
   * type: *number*
 * **nbEdges**
   * The number of edges.
   * type: *number*

### Example

````javascript
var graph = sigma.plugins.generators.random({
  nbNodes: 100,
  nbEdges: 50
});
sigmaInstance.graph.read(graph);
````

## Balanced tree

Generates a perfectly balanced r-tree of specified height (edges are undirected).

### Parameters

 * **nbChildren**
   * The number of children each node has.
   * type: *number*
 * **height**
   * The height of the tree.
   * type: *number*

### Example

````javascript
var graph = sigma.plugins.generators.balancedTree({
  nbChildren: 2,
  height: 3
});
sigmaInstance.graph.read(graph);
````

## Erdős–Rényi

Generates an undirected not necessarily connected graph from the Erdős–Rényi model. Call it with options (n,p) or (n,m).

### Parameters

 * **nbNodes**
   * The number of nodes.
   * type: *number*
 * **nbEdges**
   * The number of edges.
   * type: *number*
 * **p**
   * The probability [0..1] of a edge between any two nodes.
   * type: *number*

### (n, p) Example

````javascript
var graph = sigma.plugins.generators.erdosRenyi({
  nbNodes: 100,
  p: 0.5
});
sigmaInstance.graph.read(graph);
````

### (n, M) Example

````javascript
var graph = sigma.plugins.generators.erdosRenyi({
  nbNodes: 100,
  nbEdges: 500
});
sigmaInstance.graph.read(graph);
````

### References
- [Erdős, Rényi. On the evolution of random graphs. 1960](http://www.math-inst.hu/~p_erdos/1960-10.pdf)
- [Batagelj, Brandes. Efficient Generation of Large Random Networks. 2004](http://algo.uni-konstanz.de/publications/bb-eglrn-05.pdf)

## Barabási–Albert

Generates an undirected connected graph from the Barabási–Albert model.

### Parameters

 * **nbNodes**
   * The number of nodes.
   * type: *number*
 * **m0**
   * m0 > 0 && m0 <  N
   * type: *number*
 * **m**
   * M  > 0 && M  <= m0
   * type: *number*

### Example

````javascript
var graph = sigma.plugins.generators.barabasiAlbert({
  nbNodes: 100,
  m0: 1,
  m: 1,
});
sigmaInstance.graph.read(graph);
````

### References
- [Barabasi, Albert. Emergence of Scaling in Random Networks. 1999](http://www.barabasilab.com/pubs/CCNR-ALB_Publications/199910-15_Science-Emergence/199910-15_Science-Emergence.pdf)
- [Albert, Barabasi. Topology of evolving networks: local events and universality. 2000](http://www.facweb.iitkgp.ernet.in/~niloy/COURSE/Spring2006/CNT/Resource/ba-model-2.pdf)

## Watts-Strogatz

Generates an undirected "small world" graph from the Watts-Strogatz model. Call it with options alpha or beta to run the corresponding model.

### Parameters

 * **nbNodes**
   * The number of nodes.
   * type: *number*
 * **k**
   * The mean degree of nodes (even integer). Originally nodes are connected on average with k other nodes.
   * type: *number*
 * **alpha**
   * The rewiring probability [0..1] of the Alpha model.
   * type: *number*
 * **beta**
   * The rewiring probability [0..1] of the Beta model.
   * type: *number*

### Alpha model Example

````javascript
var graph = sigma.plugins.generators.wattsStrogatz({
  nbNodes: 100,
  k: 20,
  alpha: 0.5,
});
sigmaInstance.graph.read(graph);
````

### Beta model Example

````javascript
var graph = sigma.plugins.generators.wattsStrogatz({
  nbNodes: 100,
  k: 20,
  beta: 0.5,
});
sigmaInstance.graph.read(graph);
````

### References
- [Wikipedia](http://en.wikipedia.org/wiki/Watts_and_Strogatz_model)
- [Watts. Networks, Dynamics, and the Small-World Phenomenon. 1999](http://www.cc.gatech.edu/~mihail/D.8802readings/watts-swp.pdf)
