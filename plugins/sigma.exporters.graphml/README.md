sigma.exporters.graphml
=====================

Plugin developed by Sylvain Milan for [Linkurious](https://github.com/Linkurious) and published under the [MIT](LICENSE) license.

Contact: sylvain@linkurio.us

---

The aim of this plugin is to enable users to retrieve a [GraphML file](http://graphml.graphdrawing.org/) of the graph. GraphML is an XML dialect to encode graph data. This file format is notably supported by [Gephi](http://gephi.org), [yEd](http://www.yworks.com/en/products/yfiles/yed/), [NetworkX](http://networkx.github.io/), and [NodeXL](http://nodexl.codeplex.com/).

See the following [example code](../../examples/plugin-exporters-graphml.html) for full usage.

To use, include all .js files under this folder. Then call the exporter method as follows:

````javascript
// Retreive the GraphML string
var graphmlString = s.toGraphML();

// Download the GraphML file
s.toGraphML({download: true});
````

### Advanced usage

````javascript
s.toGraphML({
  download: true,
  filename: 'myGraph.graphml',
  nodeAttributes: 'data',
  edgeAttributes: 'data.properties',
  renderer: s.renderers[0],
  undirectedEdges: true
});
````

#### Options

 * **download**
   * Whether you want the graph image to be downloaded by the browser.
   * type: *boolean*
   * default value: `false`
 * **filename**
   * The full filename for the file to download.
   * type: *string*
 * **nodeAttributes**
   * The accessor to the dictionnary of node attributes dictionnary (e.g. "attributes" or "data.properties"). If provided, write the attributes in the GraphML.
   * type: *string*
 * **edgeAttributes**
   * The accessor to the dictionnary of edge attributes (e.g. "attributes" or "data.properties"). If provided, write the attributes in the GraphML.
   * type: *string*
 * **renderer**
   * The Sigma renderer. If provided, write the visualization attributes (position, size, color) of nodes and edges in the GraphML.
   * type: *sigma.renderers*
 * **undirectedEdges**
   * Specifies if the edge are undirected or not.
   * type: *boolean*
   * default value: `false`

### Limitations

* Array, objects and functions are converted to string.
* X and Y values are read from the renderer and thus do not rely on `node.x` and `node.y`.
* The Y axis is reversed for compatiblity with Gephi.
* Z axis is ignored.
* Colors should be of type hexadecimal, RGB or RGBA.
