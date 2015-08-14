sigma.plugins.select
==================

Plugin developed by [Sébastien Heymann](sheymann) for [Linkurious](https://github.com/Linkurious) and published under the licence [GNU GPLv3](LICENSE) unless otherwise noticed by Linkurious.

Contact: seb@linkurio.us

---
## General
This plugin enables the activation and deactivation of nodes and edges by clicking on them. The clicked nodes or edges which are already active are deactivated. Multiple nodes or edges may be deactivated by holding the Ctrl or Meta key while clicking on them. Both nodes and edges cannot be active at the same time.

See the following [example code](../../examples/plugin-select.html) for full usage.

To use, include all .js files under this folder. Then initialize it as follows:

````javascript
var activeState = sigma.plugins.activeState(sigmaInstance);
var select = sigma.plugins.select(sigmaInstance, activeState, sigmaInstance.renderers[0]);
````

If a node is active before any mouse event you should call `init` as follows:

````javascript
// ... load the graph and set current active nodes here.

select.init(); // take the current active nodes into account
````

Optionnaly bind keyboard events as follows:

````javascript
var kbd = sigma.plugins.keyboard(sigmaInstance, sigmaInstance.renderers[0]);
select.bindKeyboard(kbd);
````

Optionnaly bind lasso events as follows:

````javascript
var lasso = sigma.plugins.lasso(sigmaInstance, sigmaInstance.renderers[0]);
select.bindLasso(lasso);
````

The plugin will be killed when Sigma is killed. Kill the plugin instance manually as follows:

````javascript
sigma.plugins.killSelect(sigmaInstance);
````

## Dependencies

- `sigma.plugins.activeState`
- `sigma.helpers.graph` (required if bound to `sigma.plugins.keyboard` events)

## Compatibility

The plugin is compatible with `sigma.plugins.dragNodes`.

The plugin is compatible with `sigma.plugins.keyboard`: if an instance is bound to the plugin, it provides the following keyboard shortcuts:
- <kbd>spacebar</kbd> + <kbd>a</kbd>: select all nodes
- <kbd>spacebar</kbd> + <kbd>u</kbd>: deselect all nodes or edges
- <kbd>spacebar</kbd> + <kbd>Del</kbd>: drop selected nodes or edges
- <kbd>spacebar</kbd> + <kbd>e</kbd>: select neighbors of selected nodes
- <kbd>spacebar</kbd> + <kbd>i</kbd>: select isolated nodes (i.e. of degree 0)
- <kbd>spacebar</kbd> + <kbd>l</kbd>: select leaf nodes (i.e. nodes with 1 adjacent node)

The plugin is compatible with `sigma.plugins.lasso`.
