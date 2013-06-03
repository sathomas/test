
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
        location: "",        // default location is empty string
        position: 0,         // default position is first (e.g. left-most)
        overlap:  0          // default is no overlaps
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
    url: "api/events.json",
    
    // Calculate the layout positions for the events.
    findLayout: function() {
        // each day is independent
        _.each(this.groupBy(function(event){
            return event.get("start").format("YYYY-MM-DD");
        }), function(eventList) {

            /*
             * Because groupBy() returns an array rather than a real
             * Backbone collection, eventList is an array of Backbone
             * models. We only need the attributes of those models
             * for this analysis.
             */
            
            var events = _(eventList).pluck("attributes");

            /*
             * Finding overlapping events and identifying the appropriate
             * position for each event is non-trivial enough to justify a
             * a decent amount of commentary. To help with the explanations,
             * we'll use the following example. For brevity, we'll abbreviate
             * the properties:
             *
             *       i = id
             *       s = start
             *       e = end
             *
             * Here's the input we'll use for example:
             *     events = [
             *         {i: 1, s:  30, e: 150},
             *         {i: 2, s: 540, e: 600},
             *         {i: 3, s: 560, e: 620},
             *         {i: 4, s: 600, e: 670}
             *     ];
             */
            
            /*
             * In the first stage we're going to create a new array of all
             * times defined in the events list, where a time is either a
             * starting time or an ending time. In doing that, we'll add
             * two new properties to each event:
             *
             *       t = time (either start time or end time)
             *       y = type (either "start" or "end")
             *
             * We'll create two separate arrays (start_times and end_times),
             * concatenate them, and sort the resulting combination. First
             * up is start_times.
             *
             *     start_times = [
             *         {i: 1, s:  30, e: 150, t:  30, y: "start"},
             *         {i: 2, s: 540, e: 600, t: 540, y: "start"},
             *         {i: 3, s: 560, e: 620, t: 560, y: "start"},
             *         {i: 4, s: 600, e: 670, t: 610, y: "start"}
             *     ];
             */
            var start_times = _(events.slice(0)).map(function(el) {
                return _({}).extend(el,{time: el.start, type: "start"});
            });
        
            /*
             *     end_times = [
             *         {i: 1, s:  30, e: 150, t: 150, y: "end"},
             *         {i: 2, s: 540, e: 600, t: 600, y: "end"},
             *         {i: 3, s: 560, e: 620, t: 620, y: "end"},
             *         {i: 4, s: 600, e: 670, t: 670, y: "end"}
             *     ];
             */
            var end_times = _(events.slice(0)).map(function(el) {
                return _({}).extend(el,{time: el.end, type: "end"});
            });
            
            /*
             *     all_times = [
             *         {i: 1, s:  30, e: 150, t:  30, y: "start"},
             *         {i: 2, s: 540, e: 600, t: 540, y: "start"},
             *         {i: 3, s: 560, e: 620, t: 560, y: "start"},
             *         {i: 4, s: 600, e: 670, t: 600, y: "start"},
             *         {i: 1, s:  30, e: 150, t: 150, y: "end"},
             *         {i: 2, s: 540, e: 600, t: 600, y: "end"},
             *         {i: 3, s: 560, e: 620, t: 620, y: "end"},
             *         {i: 4, s: 600, e: 670, t: 670, y: "end"}
             *     ];
             */
            var all_times = start_times.concat(end_times);
            
            /*
             * Now that we've got the combined array of times, we're
             * going to sort based on the time property. The only
             * tricky part is handling ties. If one event ends at
             * the exact same time as another event starts, we
             * don't want to consider them as overlapping. To
             * honor that convention, we'll favor end times over
             * start times in the case of ties. Here's the result
             * we're looking for:
             *
             *     all_times = [
             *         {i: 1, s:  30, e: 150, t:  30, y: "start"},
             *         {i: 1, s:  30, e: 150, t: 150, y: "end"},
             *         {i: 2, s: 540, e: 600, t: 540, y: "start"},
             *         {i: 3, s: 560, e: 620, t: 560, y: "start"},
             *         {i: 2, s: 540, e: 600, t: 600, y: "end"},
             *         {i: 4, s: 600, e: 670, t: 600, y: "start"},
             *         {i: 3, s: 560, e: 620, t: 620, y: "end"},
             *         {i: 4, s: 600, e: 670, t: 670, y: "end"}
             *     ];
             */
            all_times.sort(function(a,b){
                if (a.time.valueOf() === b.time.valueOf()) {
                    return a.type === "end" ? -1 : 1;
                }
                return a.time - b.time;
            });
        
            /*
             * The next stage is where we actually find the overlapping
             * events. We're going to iterate through our sorted list
             * of times while maintaining a stack. For each time, we look
             * at its type. When we encounter a start time, we'll add
             * the event to the stack, and when we encounter an end time,
             * we'll extract the appropriate event from the stack. (That's
             * not a simple pop since the event we're removing isn't
             * necessarily on the top of the stack.)
             *
             * Here's how the stack will look at each step in the iteration;
             * the event id is what we're showing below in the stacks and we're
             * showing the stack before processing the next element and then
             * after processing it.
             *
             *    []     {i: 1, s:  30, e: 150, t:  30, y: "start"}   [1]
             *    [1]    {i: 1, s:  30, e: 150, t: 150, y: "end"  }   []
             *    []     {i: 2, s: 540, e: 600, t: 540, y: "start"}   [2]
             *    [2]    {i: 3, s: 560, e: 620, t: 560, y: "start"}   [2 3]
             *    [2 3]  {i: 2, s: 540, e: 600, t: 600, y: "end"  }   [3]
             *    [3]    {i: 4, s: 600, e: 670, t: 600, y: "start"}   [3 4]
             *    [3 4]  {i: 3, s: 560, e: 620, t: 620, y: "end"  }   [4]
             *    [4]    {i: 4, s: 600, e: 670, t: 670, y: "end"  }   []
             *
             * As we create the stack, we'll add properties to the event
             * objects. (Since each event occurs twice, both as a start
             * time and an end time, we're only going to add these
             * properties to the object corresponding to the start time.)
             * The two new properties are overlap and position:
             *
             *     o = overlap  (number of overlapping events)
             *     p = position (left-to-right position of the event)
             *
             * The overlap property for an event is the maximum size that
             * the stack reaches while the event is on the stack (less
             * one to account for zero-indexing). Whenever we add a new
             * item to the stack, we update this property on all items
             * on the stack. Here's the value of that property after
             * we've processed the whole array. (As noted above, only
             * start times have the property.)
             *
             *   all_times = [
             *       {i: 1, s:  30, e: 150, t:  30, y: "start", o: 0},
             *       {i: 1, s:  30, e: 150, t: 150, y: "end"  },
             *       {i: 2, s: 540, e: 600, t: 540, y: "start", o: 1},
             *       {i: 3, s: 560, e: 620, t: 560, y: "start", o: 1},
             *       {i: 2, s: 540, e: 600, t: 600, y: "end"  },
             *       {i: 4, s: 600, e: 670, t: 600, y: "start", o: 1},
             *       {i: 3, s: 560, e: 620, t: 620, y: "end"  },
             *       {i: 4, s: 600, e: 670, t: 670, y: "end"  }
             *   ];
             *
             * The position property is the left-most position that is
             * not currently occupied by any item on the stack when the
             * event is first added to the stack. Here are the values
             * for that property after the iteration.
             *
             *   all_times = [
             *       {i: 1, s:  30, e: 150, t:  30, y: "start", o: 0, p: 0},
             *       {i: 1, s:  30, e: 150, t: 150, y: "end"  },
             *       {i: 2, s: 540, e: 600, t: 540, y: "start", o: 1, p: 0},
             *       {i: 3, s: 560, e: 620, t: 560, y: "start", o: 1, p: 1},
             *       {i: 2, s: 540, e: 600, t: 600, y: "end"  },
             *       {i: 4, s: 600, e: 670, t: 600, y: "start", o: 1, p: 0},
             *       {i: 3, s: 560, e: 620, t: 620, y: "end"  },
             *       {i: 4, s: 600, e: 670, t: 670, y: "end"  }
             *   ];
             *
             */
            
            _(all_times).reduce(function(stack, el) {
                if (el.type === "start") {
                    // add item to stack
                    stack.push(el);
                    // find position for new item
                    el.position = _.difference(
                        _.range(stack.length),
                        _(stack).pluck("position")
                    )[0] || 0;
                    // update overlap property on entire stack
                    _(stack).each(function(stk) {
                        stk.overlap = stack.length-1;
                    }, this);
                } else {
                    stack = _(stack).reject(function(stk) {
                        return stk.id === el.id;
                    }, this);
                }
                return stack;
            }, []);
            
            /*
             * And that's it! The only thing left to do is a bit of cleanup.
             * Specifically, we'll extract the starting time events from
             * the whole array. (They're the ones with the extra properties.)
             * Then we'll update the original models with the new property
             * values.
             */
            _(all_times).chain().
                filter(function(el) {
                    return el.type === "start";
                }).
                each(function(el) {
                    this.get(el.id).set({
                        position: el.position,
                        overlap: el.overlap
                    });
                }, this);

        }, this);
        
        return this;
    }
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
