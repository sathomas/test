
/*
 * If we're running in node.js, then we need to manage
 * dependencies explicitly. If we're running in the
 * browser, they'll be in the global namespace.
 */

if (typeof exports !== 'undefined' && this.exports !== exports) {
    // third-party libraries
    var jQuery     = require("jquery");
    var Underscore = require("underscore");
    var Backbone   = require("backbone");
    var moment     = require("moment");
    
    // shortcuts
    var $ = jQuery;
    var _ = Underscore;
}

/*
 * Create a root in the global namespace for all
 * our models, views, etc. We're not going for
 * originality here.
 */

var myApp = myApp  || {};

/*
 * And if we're running in node (i.e. unit testing),
 * we need to explicitly put our app in the global
 * namespace.
 */

if (typeof exports !== 'undefined' && this.exports !== exports) {
    global.myApp = myApp;
}


/*
 * -----------------------------------------------------------
 *   Event Model
 * -----------------------------------------------------------
 */

myApp.Event = Backbone.Model.extend({
    defaults: {
        start:    moment(),  // default start time is now
        end:      moment(),  // default end time is now
        title:    "",        // default title is empty string
        location: ""         // default location is empty string
    }
});

/*
* -----------------------------------------------------------
*   View of Event as a List Item
* -----------------------------------------------------------
*/

// myApp.EventAsListItem = Backbone.View.extend({
//     tagName:  "li",
//     template: _.template(
//         "<span class='event-times'>"
//       +    "<time datetime='<% start.format(\'YYYY-MM-DD HH:mm\') %>'>"
//       +        "<% start.format('h:mm:ss a') %>"
//       +    "</time>"
//       +    " to "
//       +    "<time datetime='<% end.format(\'YYYY-MM-DD HH:mm\') %>'>"
//       +        "<% end.format('h:mm:ss a') %>"
//       +    "</time>"
//       + "</span>"
//       + ": "
//       + "<span class='event-title'>"
//       +     "<%= title %>"
//       + "</span>"
//       + " at "
//       + "<span class='event-location'>"
//       +     "<%= location %>"
//       + "</span>"
//     ),
// });