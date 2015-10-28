# sigma.plugins.legend

Author: Sylvain Milan
Date: 15/10/2015
For: Linkurious

## General

This plugin allows you to automatically generate and display a legend for a graph. It is based on
the design plugin.

Note: the legend will not be displayed if there is not enough space (except for the widget manually set
by the user).

See the following [example code](../../examples/plugin-legend.html) for full usage.

## Usage

```js
/**
  Returns the legend plugin associated with a specified sigma instance. If it does not exist, intialize it.
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
 * Add a widget to the legend. Redraw the legend.
 * Note: if a widget is not used (no corresponding design mapping), it won't be displayed.
 * @param elementType 'node' or 'edge'
 * @param visualVar   'size', 'color', 'icon'
 * @param ?unit       Optional. The unit to be displayed alongside the widget's title
 * @returns {*}       The added widget.
 */
legend.addWidget(elementType, visualVar, ?unit);
  
/**
 * Add a widget that only contains text. Redraw the legend.
 * @param text              The text to be displayed inside the widget.
 * @returns {LegendWidget}  The added widget
 */
legend.addTextWidget(text);
 
/**
 * Remove a widget.
 * @param arg1  The widget to remove, or the type of element ('node' or 'edge')
 * @param arg2  If the first argument was the type of element, it represents the visual variable
 *              of the widget to remove
 */
legend.removeWidget(arg1, arg2);

/**
 * @param elementType {string} 'node' or 'edge'
 * @param visualVar   {string} 'color', 'icon', 'size', 'type'
 * @returns {LegendWidget}
 */
legend.getWidget(elementType, visualVar);

/**
 * Build the widgets and redraw the legend.
 * Must be called whenever the graph's design changes
 */
legend.redraw();

/**
 * Change the position of the legend and redraw it.
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