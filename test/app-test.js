/*
 * Sorry about the following, but we need to know if
 * we're running under node.js or in the browser. That
 * turns out to be really hard to determine reliably,
 * but the following code should work in all but the
 * really really extreme cases.
 */

if (typeof exports !== 'undefined' && this.exports !== exports) {

  /*
   * Here's why the node.js environment needs special
   * treatment:
   *
   *   -  We need to identify dependencies so node.js
   *      can load the necessary libraries. (In the
   *      browser, these will be handled by explicit
   *      includes, either of individual script files
   *      or of concatenated, possibly minified versions.)
   *
   *   -  Node.js doesn't have a DOM into which we
   *      can insert our views to test interactions.
   *      We can simulate a DOM with jsdom.
   *
   */

  global.jQuery = require("jquery");
  global.$ = jQuery;
  global.chai = require("chai");
  global.sinon = require("sinon");
  chai.use(require("sinon-chai"));

  global.jsdom = require("jsdom").jsdom;
  var doc = jsdom("<html><body></body></html>");
  global.window = doc.createWindow();

}

var should = chai.should();

global.myApp = {};

describe("Application", function() {
  it("creates a global variable for the name space", function () {
    should.exist(myApp);
  })
})
