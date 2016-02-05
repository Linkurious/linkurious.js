sigma.plugins.fullScreen
=====================

Plugin developed by [Martin de la Taille](https://github.com/martindelataille) and [Sébastien Heymann](https://github.com/sheymann) for [Linkurious](https://github.com/Linkurious) and published under the [MIT](LICENSE) license.

---

This plugin provides a method to activate the fullscreen mode with a button.

See the following [example code](../../examples/plugin-fullscreen.html) for full usage.

To use, include all .js files under this folder. Then initialize it as follows with the id of a button element:

````javascript
sigma.plugins.fullScreen({
  container: 'container', // optional, default is sigma container
  btnId : 'graph-btn'
});
````

The user may leave the fullscreen mode manually. Calling the method with no argument will leave the fullscreen mode as well :

````javascript
sigma.plugins.fullScreen();
````

Kill the plugin instance as follows:

````javascript
sigma.plugins.killFullScreen();
````
