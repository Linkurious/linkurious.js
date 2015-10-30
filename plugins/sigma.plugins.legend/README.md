# sigma.plugins.legend

Plugin developed by [Sylvain Milan](https://github.com/Ytawo) for [Linkurious](https://github.com/Linkurious) and published under the license [GNU GPLv3](LICENSE) unless otherwise noticed by Linkurious.

Contact: sylvain@linkurio.us

## General

This plugin automatically generates a legend for a graph based on the mapping between data properties and visual variables set in [plugins.design](../sigma.plugins.design). The legend can be displayed on screen of downloaded as SVG or PNG file.

Notice that the legend will not be displayed if there is not enough space, unless the widget position is manually set with the `setPosition` method.

See the following [example code](../../examples/plugin-legend.html) for full usage.

![design](https://github.com/Linkurious/linkurious.js/wiki/media/legend.png)


## Example

```js
/* Initialize the legend and display all the widgets that have a mapping */
var legend = sigma.plugins.legend(sigmaInstance);

legend.getWidget('node', 'size').setUnit('$'); // Add '($)' to the widget representing the node size
legend.setPlacement('left'); // Position the legend on the left (default: bottom)
legend.addTextWidget('This is an example legend'); // Add a widget that will display some text
legend.exportSvg('myLegend.svg'); // Prompt the user a modal to download the legend in SVG format
 
/* Some code that change the mappings */

legend.draw(); // Redraw the widgets based on the new mappings 

```

## Usage

```js
/**
  Returns the legend plugin associated with a specified sigma instance. If it does not exist, initialize it.
  The legend is positioned at the bottom (can be changed later on).
  @param {Object}   sigmaInstance
*/
var legend = sigma.plugins.legend(sigmaInstance);

/**
  Kills the legend plugin associated with a sigma instance.
*/
sigma.plugins.killLegend(sigmaInstance);

```

### Plugin API

```js
/**
 * Add a widget to the legend.  Draw the legend.
 * Note: if a widget is not used (no corresponding design mapping), it won't be displayed.
 * @param elementType       'node' or 'edge'
 * @param visualVar         'size', 'color', 'icon'
 * @param ?unit             Optional. The unit to be displayed alongside the widget's title
 * @returns {LegendWidget}  The added widget.
 */
legend.addWidget(elementType, visualVar, ?unit);
  
/**
 * Add a widget that only contains text.  Draw the legend.
 * @param text              The text to be displayed inside the widget.
 * @returns {LegendWidget}  The added widget
 */
legend.addTextWidget(text);
 
/**
 * Remove a widget.
 * @param {LegendWidget} widget The widget to remove
 */
legend.removeWidget(widget);

/**
 * Remove a widget.
 * @param elementType  'node' or 'edge'
 * @param visualVar    'color', 'icon', 'size', 'type'
 */
legend.removeWidget(elementType, visualVar);

/**
 * Remove all widgets from the legend.
 */
legend.removeAllWidgets();

/**
 * @param elementType {string} 'node' or 'edge'
 * @param visualVar   {string} 'color', 'icon', 'size', 'type'
 * @returns {LegendWidget}
 */
legend.getWidget(elementType, visualVar);

/**
 * Build the widgets, compute the layout and draw the legend.
 * Must be called whenever the graph's design changes.
 */
legend.draw();

/**
 * Change the position of the legend and redraw it. When the legend is initialized, it is positioned at the bottom.
 * @param newPlacement 'top', 'bottom', 'left' or 'right'
 */
legend.setPlacement(newPlacement);

/**
 * Set the visibility of the legend.
 * @param visible
 */
legend.setVisibility(visible);

/**
 * Download the legend (PNG format).
 * @param [fileName] {string} Optional. Default: 'legend.png'
 */
legend.exportPng(fileName);

/**
 * Download the legend (SVG format).
 * @param [fileName] {string} Optional. Default: 'legend.svg'
 */
legend.exportSvg(fileName);

### Widget API

var widget = legend.getWidget('node', 'size');

/**
 * Change the position of a widget and pin it. An pinned widget is not taken into account when
 * it is positioned through automatic layout.
 * @param x
 * @param y
 */
widget.setPosition(x, y);

/**
 * Unpin the widget. An pinned widget is not taken into account when it is positioned through
 * automatic layout.
 */
widget.unpin();

/**
 * Set the text of a widget. The widget must be a text widget.
 * @param text The text to be displayed by the widget.
 */
widget.setText(text);

/**
 * Set the unit of a widget. The widget must represent a size.
 * @param unit The unit to be displayed alongside the widget's title.
 */
widget.setUnit(unit);

```

### Settings

* **legendWidth** *number* `200`: Width of the widgets
* **legendFontFamily** *string* `Arial`: Name of the font used by the widgets
* **legendFontSize** *number* `15`: Size of the text
* **legendFontColor** *string* `'black'`: Color of the text
* **legendTitleFontFamily** *string* `'Arial'`: Font family used for widgets' title
* **legendTitleFontSize** *number* `25`: Font size used for widgets' title
* **legendTitleFontColor** *string* `'black'`: Font color used for widgets' title
* **legendTitleMaxLength** *number* `'30'`: Characters in titles after that limit will not be displayed
* **legendShapeColor** *string* `'black'`: Color used to display shapes (circles, square, etc)
* **legendBackgroundColor** *string* `'white'`: Color of the widgets' background
* **legendBorderColor** *string* `'black'`: Color of the widgets' border
* **legendBorderWidth** *number* `2`: Width of the widgets' border
* **legendBorderRadius** *number* `10`: Radius of the widgets' border
* **legendInnerMargin** *number* `15`: Size of the widgets' inner margin
* **legendOuterMargin** *number* `5`: Size of the widgets' outer margin