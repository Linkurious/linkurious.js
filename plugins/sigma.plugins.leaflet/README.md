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
```

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

### Compatibility

The plugin is compatible with [Leaflet v0.7.7](https://github.com/Leaflet/Leaflet/releases/tag/v0.7.7) (current stable release).

### Limitations

- Sigma autoRescale is disabled.
- Sigma inertia is disabled.
- The mouse wheel will zoom to the center of the view regardless of where the mouse was.
- Mouse wheel events are not forwarded to Leaflet.
