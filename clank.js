// Use UMD, so it should work with Node, AMD, or browser globals. See
// https://github.com/umdjs/umd, the returnExports.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['lodash'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('lodash'));
    } else {
        root.returnExports = factory(root._);
    }
}(this, function (_) {
  function Clank(order, hashFunc) {
    hashFunc = hashFunc | function(x) { return x.toString(); };
    var orderFunc = _.identity;
    var unorderFunc = _.identity;
    if (order != null && order > 1) {
      orderFunc = function(order1Chain) {
        if (order1Chain.length < order) {
          var firstN = order1Chain.slice(0, order);
        } else {
          return [];
        }
        return _.reduce(order1Chain.slice(order), function(memo, elt) {
          var next = _.tail(memo.lastN);
          next.push(elt);
          memo.orderNChain.push(next);
          memo.lastN = next;
        }, { lastN: firstN, orderNChain: [firstN]}).orderNChain;
      };
      unorderFunc = function(orderNChain) {
        return _.map(orderNChain, function(elt) {
          return _.first(elt);
        }).concat(_.tail(_.last(orderNChain)));
      };
    }

    function Node(state) {
      this.state = state;
      this.edges = [];
      this.total = 0;
    }

    function Edge(tail, weight) {
      this.tail = tail;
      this.weight = weight;
    }

    var start = {};
    var nodes = [new Node(start)];

    function createChain() {
      function getRand(max) {
        return Math.ceil(Math.random() * max);
      }

      var chain = [];
      if (nodes.length <= 1) {
        return chain;
      }
      var next = 0;
      var rand;
      var edge;
      while (next != -1) {
        chain.push(next);
        rand = getRand(nodes[next].total);
        edge = _.reduce(nodes[next].edges, function(memo, edge) {
          if (memo.found !== null) {
            return memo;
          }
          memo.count += edge.weight;
          if (memo.count >= rand) {
            memo.found = edge;
          }
          return memo;
        }, { found: null, count: 0 }).found;
        if (edge) {
          next = edge.tail;
        } else {
          next = -1;
        }
      }
      return unorderFunc(_.map(_.tail(chain), function(index) {
        return nodes[index].state;
      }));
    }

    function HashTable() {
      var table = {};
      var prefix = "_prefix";

      this.get = function(ob) {
        var hash = prefix + hashFunc(ob);
        return _.has(table, hash) ? table[hash] : null;
      };

      this.add = function(ob, key) {
        var hash = prefix + hashFunc(ob);
        if (!_.has(table, hash)) {
          table[hash] = key;
          return true;
        }
        return false;
      };
    }

    var hashes = new HashTable();

    function readChain(chain) {
      chain = orderFunc(chain);
      console.log(chain);
      chain = _.map(chain, function(state) {
        var index = hashes.get(state);
        var node;
        if (index === null) {
          index = nodes.push(new Node(state)) - 1;
          hashes.add(state, index);
        }
        return index;
      });
      chain.push(-1);
      _.reduce(chain, function(i, j) {
        var node = nodes[i];
        var k;
        var len = node.edges.length;
        var found = false;
        for (k = 0; k < len; k++) {
          if (node.edges[k].tail == j) {
            node.edges[k].weight += 1;
            found = true;
            break;
          }
        }
        if (!found) {
          node.edges.push(new Edge(j, 1));
        }
        node.total += 1;
        return j;
      }, 0);
      //console.log(nodes[0]);
    }

    this.createChain = createChain;
    this.readChain = readChain;
  }
  return Clank;
}));


