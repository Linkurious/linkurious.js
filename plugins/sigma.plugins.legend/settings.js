;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma not in scope.');

  // Initialize package:
  sigma.utils.pkg('sigma.settings');

  /**
  * Extended sigma settings.
  */
  var settings = {
    /* {number} Width of the widgets */
    legendWidth: 130,
    /* {string} Name of the font used by the widgets */
    legendFontFamily: 'Arial',
    /* {number}  Size of the text */
    legendFontSize: 10,
    /* {string} Color of the text */
    legendFontColor: 'black',
    /* {string} Name of the font used to display the widgets' title */
    legendTitleFontFamily: 'Arial',
    /* {number}  Size of the font used to display the titles */
    legendTitleFontSize: 15,
    /* {string} Color of the titles */
    legendTitleFontColor: 'black',
    /* {number} The maximum number of characters displayed when displaying a widget's title */
    legendTitleMaxLength: '30',
    /* {string} The text alignment of the widgets' title ('left', 'middle') */
    legendTitleTextAlign: 'left',
    /* {string} Color of the shapes in the legend */
    legendShapeColor: 'grey',
    /* {string} Color of the widgets' background */
    legendBackgroundColor: 'white',
    /* {string} Color of the widgets' border */
    legendBorderColor: 'black',
    /* {number} Radius of the widgets' border */
    legendBorderRadius: 10,
    /* {number}  Size of the widgets' border */
    legendBorderWidth: 1,
    /* {number}  Size of the margin between a widget's borders and its content */
    legendInnerMargin: 10,
    /* {number}  Size of the margin between widgets */
    legendOuterMargin: 5
  };

  // Export the previously designed settings:
  sigma.settings = sigma.utils.extend(sigma.settings || {}, settings);

}).call(this);