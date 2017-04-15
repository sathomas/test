
/*
 * If we're running in node.js, then we need to manage
 * dependencies explicitly. If we're running in the
 * browser, they'll be in the global namespace.
 */
 
if (typeof exports !== 'undefined' && this.exports !== exports) {
    var chai = require("chai");
    var sinon = require("sinon");
    chai.use(require("sinon-chai"));

    // third-party libraries used in the test code
    var jQuery = require("jquery");
    var moment = require("moment");
    var Underscore = require("underscore");
    var $ = jQuery;
    var _ = Underscore;
}

var should = chai.should();

describe("Application", function() {
    it("creates a global variable for the name space", function () {
      should.exist(thisApps);
    })
})

describe("Event Model", function(){
    describe("Initialization", function() {
        beforeEach(function() {
            this.event = new thisApps.Event();
        })
        it("should default the title to an empty string",function() {
            this.event.get("title").should.equal("");
        })
        it("should default the location to an empty string",function() {
            this.event.get("location").should.equal("");
        })
        it("should default the start time to now",function() {
            (this.event.get("start").isSame(moment(),"minute")).should.be.true;
        })
        it("should default the end time to now",function() {
            (this.event.get("end").isSame(moment(),"minute")).should.be.true;
        })
        it("should default the position to first (e.g. left-most)",function() {
            this.event.get("left").should.equal(0);
        })
        it("should default the overlap to none",function() {
            this.event.get("width").should.equal(100);
        })
    })
    describe("Parsing", function() {
        beforeEach(function() {
            this.event = new thisApps.Event();
        })
        it("should convert minutes since 9:00am to a moment object", function() {
            var m = this.event.makeMoment(30);
            m.year().should.equal(moment().year());
            m.month().should.equal(moment().month());
            m.date().should.equal(moment().date());
            m.hour().should.equal(9);
            m.minutes().should.equal(30);
            m.seconds().should.equal(0);
            m.milliseconds().should.equal(0);
        })
        it("should convert Unix seconds to a moment object", function() {
            var m = this.event.makeMoment(moment([2013,1,2,3,4,5,6]).unix());
            m.year().should.equal(2013);
            m.month().should.equal(1);
            m.date().should.equal(2);
            m.hour().should.equal(3);
            m.minutes().should.equal(4);
            m.seconds().should.equal(5);
            m.milliseconds().should.equal(0);
        })
        it("should convert Unix milliseconds to a moment object", function() {
            var m = this.event.makeMoment(moment([2013,1,2,3,4,5,6]).valueOf());
            m.year().should.equal(2013);
            m.month().should.equal(1);
            m.date().should.equal(2);
            m.hour().should.equal(3);
            m.minutes().should.equal(4);
            m.seconds().should.equal(5);
            m.milliseconds().should.equal(6);
        })
    })
})

describe("Event List Item View", function() {
    beforeEach(function() {
        this.event = new thisApps.Event({
            title:    "Title",
            location: "Location",
            start:    moment("12-25-2012 10:00", "MM-DD-YYYY HH:mm"),
            end:      moment("12-25-2012 11:00", "MM-DD-YYYY HH:mm"),
            width:    33,
            left:     66
        });
        this.item = new thisApps.EventAsListItem({model: this.event});
    })
    it("render() should return the view object", function() {
        this.item.render().should.equal(this.item);
    })
    describe("Template", function() {
        beforeEach(function(){
            this.item.render();
        })
        it("should render as a list item", function() {
            this.item.el.nodeName.should.equal("LI");
        })
        describe("Event Times", function() {
            it("should include times for the event", function() {
                this.item.$el.find("span.event-times").length.should.equal(1);
            })
            describe("Start Time", function() {
                it("should include the start time", function() {
                    this.item.$el.find("span.event-times time.start-time").length.should.equal(1);
                })
                it("should have the correct start time", function() {
                    this.item.$el.find("time.start-time").text().should.equal("10:00 am");
                })
                it("should the ISO-formatted start time as a datetime attribute", function() {
                    this.item.$el.find("time.start-time").attr("datetime").should.equal("2012-12-25 10:00");
                })
            })
            describe("End Time", function() {
                it("should include the end time", function() {
                    this.item.$el.find("span.event-times time.end-time").length.should.equal(1);
                })
                it("should have the correct end time", function() {
                    this.item.$el.find("time.end-time").text().should.equal("11:00 am");
                })
                it("should the ISO-formatted end time as a datetime attribute", function() {
                    this.item.$el.find("time.end-time").attr("datetime").should.equal("2012-12-25 11:00");
                })
            })
        })
        describe("Event Title", function() {
            it("should include the event title", function() {
                this.item.$el.find("span.event-title").length.should.equal(1);
            })
            it("should have the correct title", function() {
                this.item.$el.find("span.event-title").text().should.equal("Title");
            })
        })
        describe("Event Location", function() {
            it("should include the event location", function() {
                this.item.$el.find("span.event-location").length.should.equal(1);
            })
            it("should have the correct title", function() {
                this.item.$el.find("span.event-location").text().should.equal("Location");
            })
        })
        describe("Data Attributes", function() {
            it("should include the event position", function() {
                this.item.$el.attr("data-width").should.equal("33%");
            })
            it("should include the event overlap", function() {
                this.item.$el.attr("data-left").should.equal("66%");
            })
        })
    })
    it("should update automatically on model changes", function() {
        this.item.render();
        this.event.set("title","New Title");
        this.item.$el.find("span.event-title").text().should.equal("New Title");
    })
})

describe("Events Collection", function() {
    it("should accept direct initialization of models", function() {
        this.events = new thisApps.Events([
            {id: 1, start: moment("12-25-2012 09:30", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 11:30", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 2, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 3, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 4, start: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
        ]);
        this.events.length.should.equal(4);
    })
    describe("Layout Calculation", function() {
        it("should identify overlapping event times", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 09:30", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 11:30", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 2, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 3, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 4, start: moment("12-25-2012 19:10", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            _(this.events.models).chain().pluck("attributes").pluck("width").value().should.eql([100,50,50,50])
        })
        it("should not overlap back-to-back events", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 2, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 3, start: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            _(this.events.models).chain().pluck("attributes").pluck("width").value().should.eql([50,50,50])
        })
        it("should not overlap different days", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 2, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 3, start: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 4, start: moment("12-26-2012 10:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            _(this.events.models).chain().pluck("attributes").pluck("width").value().should.eql([50,50,50,100])
        })
        it("should calculate positions", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 2, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            _(this.events.models).chain().pluck("attributes").pluck("left").value().should.eql([0,50])
        })
        it("should position earliest starting events first", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 2, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            _(this.events.models).chain().pluck("attributes").pluck("left").value().should.eql([50,0])
        })
        it("should fill in position gaps", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 2, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
                {id: 3, start: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            _(this.events.models).chain().pluck("attributes").pluck("left").value().should.eql([0,50,0])
        })
        it("should calculate event height", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 12:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            this.events.at(0).get("height").should.equal(50);
        })
        it("should calculate event vertical position", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 12:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            this.events.at(0).get("top").should.equal(25);
        })
        it("should calculate height for early events", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 8:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 15:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            this.events.at(0).get("height").should.equal(50);
        })
        it("should calculate vertical position for early events", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 8:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 15:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            this.events.at(0).get("top").should.equal(0);
        })
        it("should calculate height for late events", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 15:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 22:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            this.events.at(0).get("height").should.equal(50);
        })
        it("should calculate vertical position for late events", function() {
            this.events = new thisApps.Events([
                {id: 1, start: moment("12-25-2012 15:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 22:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
            ]);
            this.events.layout("9:00","21:00");
            this.events.at(0).get("top").should.equal(50);
        })
    })
})

describe("Events List View", function() {
    beforeEach(function(){
        this.events = new thisApps.Events([
            {id: 1, start: moment("12-25-2012 09:30", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 11:30", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 2, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 3, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 4, start: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
        ]);
        this.list = new thisApps.EventsAsList({collection: this.events, date: "2012-12-25"});
    })
    it("render() should return the view object", function() {
        this.list.render().should.equal(this.list);
    });
    it("should render as an unordered list", function() {
        this.list.render().el.nodeName.should.equal("UL");
    })
    it("should include list items for all models in collection", function() {
        this.list.render().$el.find("li").should.have.length(4);
    })
    it("should dynamically add list items as events are added to the collection", function() {
        this.list.render();
        this.events.add({
            id:       5,
            start:    moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"),
            end:      moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"),
            title:    "Sample Title",
            location: "Sample Location"
        });
        this.list.$el.find("li").should.have.length(5);
    })
    it("should filter models based on date", function() {
        this.events = new thisApps.Events([
            {id: 1, start: moment("12-25-2012 09:30", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 11:30", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 2, start: moment("12-25-2012 18:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:00", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 3, start: moment("12-25-2012 18:20", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 19:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"},
            {id: 4, start: moment("12-26-2012 19:00", "MM-DD-YYYY HH:mm"), end: moment("12-25-2012 20:20", "MM-DD-YYYY HH:mm"), title: "Sample Title", location: "Sample Location"}
        ]);
        this.list = new thisApps.EventsAsList({collection: this.events, date: "2012-12-25"});
        this.list.render().$el.find("li").should.have.length(3);
    })
})


