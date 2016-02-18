sigma.plugins.leaflet
==================

Plugin developed by [Sébastien Heymann](https://github.com/sheymann) for [Linkurious](https://github.com/Linkurious) and published under the licence [GNU GPLv3](LICENSE) unless otherwise noticed by Linkurious.

Contact: seb@linkurio.us

---
## General
This plugin provides geospatial features to Sigma by intergrating [Leaflet](http://leafletjs.com/). Leaflet is the leading open-source JavaScript library for mobile-friendly interactive maps.

See the following [example code](../../examples/plugin-leaflet.html) for full usage, and a demo of the US airlines dataset [here](../../examples/plugin-leaflet-airlines.html).

To use, include all .js files under this folder. Then instanciate a Leaflet map and the sigma plugin as follows:

```js
var latitude = 48.853;
var longitude = 2.349;
var zoom = 7; // integer

var map = L.map('map-container', {
  // avoid unexpected center moves:
  scrollWheelZoom: 'center',
  doubleClickZoom: 'center',
  bounceAtZoomLimits: false,
  keyboard: false
}).setView([latitude, longitude], zoom);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var leafletPlugin = sigma.plugins.leaflet(sigmaInstance, map);
leafletPlugin.enable();
```

Kill the plugin instance as follows:

````javascript
sigma.plugins.killLeafletPlugin(sigmaInstance);
````

The DOM container of the graph must be a following sibling of the container of the map:

```html
<div id="map-container"></div>
<div id="graph-container"></div>
```

The containers must exactly overlap on the page. We recommend use the same CSS rules such as:

```css
#map-container,
#graph-container {
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  position: absolute;
}
```

:warning: Nodes of the graph must have geographical coordinates `lat` (latitude) and `lng` (longitude).

## Public methods

**isApplicable()** : *boolean*
 * The method will return `true` if at least one node has geographical coordinates.

**isEnabled()** : *boolean*
 * The method will return `true` if the plugin is enabled.

**enable()** : *sigma.plugins.leaflet*
 * The method will apply mandatory Sigma settings, update node coordinates from their geospatial coordinates, and bind all event listeners.

**disable()** : *sigma.plugins.leaflet*
 * The method will restore the original Sigma settings and node coordinates, and unbind event listeners.

**fitBounds(?*object*)** : *sigma.plugins.leaflet*
 * The method will fit the view to the graph or to the given nodes or edges. If sigma is currently animated, it will postpone the execution after the end of the animation. Examples:

````javascript
leafletPlugin.fitBounds();
leafletPlugin.fitBounds({ nodeIds: 'n0' });
leafletPlugin.fitBounds({ nodeIds: ['n0', 'n1'] });
leafletPlugin.fitBounds({ edgeIds: ['e0', 'e1'] });
````

**zoomIn()** : *sigma.plugins.leaflet*
 * The method will zoom in the map.

**zoomOut()** : *sigma.plugins.leaflet*
 * The method will zoom out the map.

**syncNodes(?*array*|*number*|*string*)** : *sigma.plugins.leaflet*
 * The method will update the cartesian coordinates of the given node ids from their geospatial coordinates and refresh the Sigma instance. All nodes will be updated if no parameter is given.
 * Apply this method after the addition of new nodes to the graph.

**syncMap()** : *sigma.plugins.leaflet*
 * The method will increment the zoom level of the map by 1 if the zoom ratio of Sigma has been decreased.
 * It will decrement the zoom level of the map by 1 if the zoom ratio of Sigma has been increased.
 * It will update the Leaflet map center if the zoom ratio of Sigma is the same.

**bindDragListener()** : *sigma.plugins.leaflet*
 * The method will bind the given instance of the dragNodes listener. The geographical coordinates of the dragged nodes will be updated to their new location to preserve their position during zoom.

**unbindDragListener()** : *sigma.plugins.leaflet*
 * The method will unbind the instance of the dragNodes listener.

**resetDraggedNodesLatLng()** : *sigma.plugins.leaflet*
 * The method will reset the geographical coordinates of the nodes that have been dragged. You must call `.syncNodes()` to apply the changes on the map.

**bindAll()** : *sigma.plugins.leaflet*
 * The method will bind all internal event listeners.

**unbindAll()** : *sigma.plugins.leaflet*
 * The method will unbind all internal event listeners.

**kill()**
 * The method will unbind all event listeners, restore Sigma settings and remove all references to Sigma and the Leaflet map.

**utils.sigmaPointToLatLng(*node*|*leaflet<Point>*)** : *leaflet<LatLng>*
 * The method will return the geographical coordinates of a given Sigma point x,y.

**utils.latLngToSigmaPoint(*node*|*leaflet<LatLng>*)** : *leaflet<LatLng>*
 * The method will return the cartesian coordinates of a Leaflet map layer point.

**utils.geoBoundaries(*array*)** : *leaflet<LatLngBounds>*
 * The method will compute the spatial boundaries of the given nodes. It will ignore hidden nodes and nodes with missing `lat` (latitude) or `lng` (longitude) coordinates.


## Graph API Extension

This plugin extends the [Graph API](https://github.com/jacomyal/sigma.js/wiki/Graph-API) with a new public method:

**hasLatLngCoordinates(*string|number*)** : *boolean*
 * This methods returns true if the given node has geo coordinates. If no node is given, returns true if one node has geo coordinates in the graph.


## Events

This plugin provides the following events fired by the instance of the plugin:
* `enabled`: Fired when the plugin is enabled and node coordinates are synchronized with the map.
* `disabled`: Fired when the plugin is disabled and original node coordinates are restored.

Exemple of event binding:

````javascript
leafletPlugin.bind('enabled', function(event) {
  console.log(event);
});
````

## Compatibility

The plugin is compatible with [Leaflet v0.7.7](https://github.com/Leaflet/Leaflet/releases/tag/v0.7.7) (current stable release).

* Sigma nodes are compatible with [Leaflet Point](http://leafletjs.com/reference.html#point) objects because they contain `x` and `y` coordinates.
* Sigma nodes are compatible with [Leaflet LatLng](http://leafletjs.com/reference.html#latlng) objects when they contain `lat` and `lng` coordinates.

The plugin is compatible with:
- `sigma.plugins.dragNodes`: nodes can be dragged and their initial positions reset.
- `sigma.plugins.animate`: node positions are animated.
- `sigma.plugins.filter`:`.syncNodes()` will apply a custom filter on nodes called "geo-coordinates", `.disable()` will undo the filter.

## Limitations

- Sigma autoRescale is disabled.
- Sigma inertia is disabled.
- The mouse wheel will zoom to the center of the view regardless of where the mouse was.
- Mouse wheel, contextmenu and hover events are not forwarded to Leaflet.

:warning: If you add or remove `lat`/`lng` properties of nodes in the graph directly, you must call `.syncNodes()` otherwise `sigma.graph.hasLatLngCoordinates()` won't provide accurate results.
