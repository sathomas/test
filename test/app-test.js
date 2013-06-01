
/*
 * If we're running in node.js, then we need to manage
 * dependencies explicitly. If we're running in the
 * browser, they'll be in the global namespace.
 */
 
if (typeof exports !== 'undefined' && this.exports !== exports) {
    var chai = require("chai");
    var sinon = require("sinon");
    chai.use(require("sinon-chai"));
    // simulated DOM
    // var jsdom  = require("jsdom").jsdom;
    // var doc = jsdom("<html><body></body></html>");
    // global.window = doc.createWindow();
    // third-party libraries used in the test code
    var moment = require("moment");
}

var should = chai.should();

describe("Application", function() {
    it("creates a global variable for the name space", function () {
      should.exist(myApp);
    })
})

describe("Event Model", function(){
    describe("Initialization", function() {
        beforeEach(function() {
            this.event = new myApp.Event();
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
    })
})
//
// describe("Event List Item View", function() {
//     beforeEach(function(){
//         this.event = new myApp.Event({
//             title:    "Title",
//             location: "Location",
//             start:    moment("12-25-2012 10:00", "MM-DD-YYYY HH:mm"),
//             end:      moment("12-25-2012 11:00", "MM-DD-YYYY HH:mm")
//         });
//         this.item = new myApp.EventAsListItem({model: this.event});
//         this.save_stub = sinon.stub(this.event, "save");
//     })
//     afterEach(function() {
//         this.save_stub.restore();
//     })
//     it("render() should return the view object", function() {
//         this.item.render().should.equal(this.item);
//     });
//     it("should render as a list item", function() {
//         this.item.render().el.nodeName.should.equal("LI");
//     })
// })

