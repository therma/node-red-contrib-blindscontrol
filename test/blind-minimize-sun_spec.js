var helper = require("node-red-node-test-helper");
var blindNode = require("../blind-minimize-sun.js");

describe('blind-minimize-sun Node', () => {

  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    var flow = [{ id: "n1", type: "blind-minimize-sun", name: "test name", topic: "test", orientation: 45, top: 1.2, bottom: 0, depth: 0.5 }];
    helper.load(blindNode, flow, () => {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'test name');
      done();
    });
  });

  it('should compute blind position (20) when sun focused on blind', done => {
    var flow = [
      { id: "n1", type: "blind-minimize-sun", name: "test name", topic: "test", orientation: 45, noffset : 90, poffset : 90, top: 1.2, bottom: 0, depth: 0.5, increment: 5, maxPosition: 100, minPosition: 0, wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(blindNode, flow, () => {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", msg => {
        // msg.should.have.property('topic', 'blind');
        msg.payload.should.have.property('blindPosition', 20);
        // msg.payload.should.have.property('channel', 'kitchen');
        done();
      });
      n1.receive({ payload: {"azimuth": "10","elevation": "20"}, topic: "sun" });
    });
  });

  it('should compute blind position (100) when sun not focused on blind', done => {
    var flow = [
      { id: "n1", type: "blind-minimize-sun", name: "test name", topic: "test", orientation: 45, noffset : 90, poffset : 90, top: 1.2, bottom: 0, depth: 0.5, increment: 5, maxPosition: 100, minPosition: 0, wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(blindNode, flow, () => {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", msg => {
        // msg.should.have.property('topic', 'blind');
        msg.payload.should.have.property('blindPosition', 100);
        // msg.payload.should.have.property('channel', 'kitchen');
        done();
      });
      n1.receive({ payload: {"azimuth": "200","elevation": "20"}, topic: "sun" });
    });
  });
});
