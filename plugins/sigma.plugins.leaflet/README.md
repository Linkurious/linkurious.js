sigma.plugins.leaflet
==================

Plugin developed by [Sébastien Heymann](https://github.com/sheymann) for [Linkurious](https://github.com/Linkurious) and published under the licence [GNU GPLv3](LICENSE) unless otherwise noticed by Linkurious.

Contact: seb@linkurio.us

---
## General
This plugin provides geospatial features to Sigma by intergrating [Leaflet](http://leafletjs.com/). Leaflet is the leading open-source JavaScript library for mobile-friendly interactive maps.

See the following [example code](../../examples/plugin-leaflet.html) for full usage.

To use, include all .js files under this folder. Then instanciate a Leaflet map and the sigma plugin as follows:

```js
var latitude = 48.853;
var longitude = 2.349;
var zoom = 7; // integer

var map = L.map('map-container').setView([latitude, longitude], zoom);

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

:warning: Nodes of the graph must have geospatial coordinates (`latitude` and `longitude`).

## Public methods

**enable()** : *sigma.plugins.leaflet*
 * The method will apply mandatory Sigma settings, update node coordinates from their geospatial coordinates, and bind all event listeners.

**disable()** : *sigma.plugins.leaflet*
 * The method will restore the original Sigma settings and node coordinates, and unbind event listeners.

**fitBounds()** : *sigma.plugins.leaflet*
 * The method will fit the view to the nodes. If nodes are currently animated, it will postpone the execution after the end of the animation.

**syncNodes(?*array*|*number*|*string*)** : *sigma.plugins.leaflet*
 * The method will update the cartesian coordinates of the specified node ids from their geospatial coordinates and refresh the Sigma instance. All nodes will be updated if no parameter is specified.
 * Apply this method after the addition of new nodes to the graph.

**syncMap()** : *sigma.plugins.leaflet*
 * The method will increment the zoom level of the map by 1 if the zoom ratio of Sigma has been decreased.
 * It will decrement the zoom level of the map by 1 if the zoom ratio of Sigma has been increased.
 * It will update the Leaflet map center if the zoom ratio of Sigma is the same.

**bindAll()**
 * The method will bind all event listeners.

**unbindAll()**
 * The method will unbind all event listeners.

**kill()**
 * The method will unbind all event listeners, restore Sigma settings and remove all references to Sigma and the Leaflet map.

**utils.geoBoundaries(*array*)** : *leaflet<LatLngBounds>*
 * The method will compute the spatial boundaries of the specified nodes. It will ignore hidden nodes and nodes with missing latitude or longitude coordinates.


## Compatibility

The plugin is compatible with [Leaflet v0.7.7](https://github.com/Leaflet/Leaflet/releases/tag/v0.7.7) (current stable release).

## Limitations

- Sigma autoRescale is disabled.
- Sigma inertia is disabled.
- The mouse wheel will zoom to the center of the view regardless of where the mouse was.
- Mouse wheel and hover events are not forwarded to Leaflet.
