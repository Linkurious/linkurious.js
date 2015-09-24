sigma.exporters.json
=====================

Plugin developed by [Sébastien Heymann](https://github.com/sheymann) for [Linkurious](https://github.com/Linkurious) and published under the [MIT](LICENSE) license.

Contact: seb@linkurio.us

---

The aim of this plugin is to enable users to retrieve a JSON file of the graph that can be directly loaded again using [sigma.parsers.json](../sigma.parsers.json).

See the following [example code](../../examples/plugin-exporters-json.html) for full usage.

To use, include all .js files under this folder. Then call the exporter method as follows:

````javascript
// Retreive the JSON string
var jsonString = s.toJSON();

// Download the JSON file
s.toJSON({
  download: true,
  pretty: true,
  filename: 'myGraph.json'
});
````

#### Options

 * **download**
   * Whether you want the graph image to be downloaded by the browser.
   * type: *boolean*
   * default value: `false`
 * **pretty**
   * Whether you want a pretty output for easy read.
   * type: *boolean*
   * default value: `false`
 * **filename**
   * The full filename for the file to download.
   * type: *string*

#### Notes

The exported nodes and edges contain all attributes but those starting with *cam*, *read_cam*, and *renderer*.
