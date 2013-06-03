
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
    Backbone.$ = jQuery;
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
    },
    makeMoment: function(num) {
        // Internally, we use the moment.js library to manage
        // event times. This function converts an input number
        // to a moment() object. It handles the unusual format
        // returned by the server (minutes since 9:00am) as
        // well as distinquishing between the more standard
        // formats of seconds or milliseconds since the Unix
        // epoch.
        if (num < (60*(24-9))) {
            var now = moment();
            return moment([ now.year(), now.month(), now.date(), 9]).add("minutes",num);
        } else if (num < moment([1970,1,1]).valueOf()) {
            return moment.unix(num);
        } else {
            return moment(num);
        }
    },
    parse: function(response) {
        // We override the parse() function so we can handle
        // the unusual data format from the server. In particular,
        // it provides start and end times in minutes since
        // 9:00am of the current day. We'll check to make sure
        // the server hasn't changed to the more standard
        // format of unix seconds.
        response.start = this.makeMoment(response.start);
        response.end = this.makeMoment(response.end);
        return response;
    }
});

/*
 * -----------------------------------------------------------
 *   View of Event as a List Item
 * -----------------------------------------------------------
 */

myApp.EventAsListItem = Backbone.View.extend({
    tagName:  "li",
    className: "event",
    template: _.template(
        "<span class='event-times'>" +
           "<time class='start-time' datetime='<% print(start.format(\'YYYY-MM-DD HH:mm\')) %>'>" +
               "<% print(start.format('h:mm a')) %>" +
           "</time>" +
           " to " +
           "<time class='end-time' datetime='<% print(end.format(\'YYYY-MM-DD HH:mm\')) %>'>" +
               "<% print(end.format('h:mm a')) %>" +
           "</time>" +
        "</span>" +
        ": " +
        "<span class='event-title'>" +
            "<%= title %>" +
        "</span>" +
        " at " +
        "<span class='event-location'>" +
            "<%= location %>" +
        "</span>"
    ),
    render: function () {
        this.$el.html(this.template(this.model.attributes));
        return this;
    }
});

/*
 * -----------------------------------------------------------
 *   Events Collection
 * -----------------------------------------------------------
 */

myApp.Events = Backbone.Collection.extend({
    model: myApp.Event,
    
    // In most browsers, the following URL will fetch a simple
    // JSON-formatted file from the server. If you're simply
    // loading HTML from the local file system (rather than a
    // local web server, Chrome will consider the access to
    // be a violation of Cross Origin Resource Sharing and
    // refuse to load the file. You can get around this by
    // running a local web server instead of loading directly
    // from the file system.
    url: "api/events.json"
});

/*
 * -----------------------------------------------------------
 *   View of Events as an Unordered List
 * -----------------------------------------------------------
 */

myApp.EventsAsList = Backbone.View.extend({
    tagName: "ul",
    className: "events",
    initialize: function() {
        this.collection.on("add", this.addOne, this);
    },
    render: function() {
        this.addAll();
        return this;
    },
    addAll: function() {
        this.collection.each(this.addOne, this);
    },
    addOne: function(event) {
        var item = new myApp.EventAsListItem({model: event});
        item.render();
        this.$el.append(item.render().el);
    }
});

/*
 * -----------------------------------------------------------
 *   Main view for the application
 * -----------------------------------------------------------
 */

myApp.MainView = Backbone.View.extend({
    start: function() {
        this.events = new myApp.Events();
        this.events.fetch();
        return this;
    },
    render: function() {
        this.list = new myApp.EventsAsList({collection: this.events});
        this.$el.html(this.list.render().el);
        return this;
    }
});


$(function() {
    myApp.main = new myApp.MainView({el: $("#myApp")});
    myApp.main.start().render();
});
