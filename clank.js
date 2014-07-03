var _ = require('./lodash.js');
_.str = require('./underscore.string.js');
var fs = require('fs');

function Markov(hashFunc) {
  function Node(state) {
    this.state = state;
    this.edges = [];
    this.total = 0;
  }

  function Edge(head, tail, weight) {
    this.head = head;
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
    return _.map(_.tail(chain), function(index) {
      return nodes[index].state;
    });
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
        node.edges.push(new Edge(i, j, 1));
      }
      node.total += 1;
      return j;
    }, 0);
    //console.log(nodes[0]);
  }

  this.createChain = createChain;
  this.readChain = readChain;
}

// Let's make an order 2 markov chain of letters for a name generator
//var names = ["Sophia", "Emma", "Olivia", "Isabella", "Mia", "Ava", "Lily", "Zoe", "Emily", "Chloe", "Layla", "Madison", "Madelyn", "Abigail", "Aubrey", "Charlotte", "Amelia", "Ella", "Kaylee", "Avery", "Aaliyah", "Hailey", "Hannah", "Addison", "Riley", "Harper", "Aria", "Arianna", "Mackenzie", "Lila", "Evelyn", "Adalyn", "Grace", "Brooklyn", "Ellie", "Anna", "Kaitlyn", "Isabelle", "Sophie", "Scarlett", "Natalie", "Leah", "Sarah", "Nora", "Mila", "Elizabeth", "Lillian", "Kylie", "Audrey", "Lucy", "Maya", "Annabelle", "Makayla", "Gabriella", "Elena", "Victoria", "Claire", "Savannah", "Peyton", "Maria", "Alaina", "Kennedy", "Stella", "Liliana", "Allison", "Samantha", "Keira", "Alyssa", "Reagan", "Molly", "Alexandra", "Violet", "Charlie", "Julia", "Sadie", "Ruby", "Eva", "Alice", "Eliana", "Taylor", "Callie", "Penelope", "Camilla", "Bailey", "Kaelyn", "Alexis", "Kayla", "Katherine", "Sydney", "Lauren", "Jasmine", "London", "Bella", "Adeline", "Caroline", "Vivian", "Juliana", "Gianna", "Skyler", "Jordyn", "Jackson", "Aiden", "Liam", "Lucas", "Noah", "Mason", "Jayden", "Ethan", "Jacob", "Jack", "Caden", "Logan", "Benjamin", "Michael", "Caleb", "Ryan", "Alexander", "Elijah", "James", "William", "Oliver", "Connor", "Matthew", "Daniel", "Luke", "Brayden", "Jayce", "Henry", "Carter", "Dylan", "Gabriel", "Joshua", "Nicholas", "Isaac", "Owen", "Nathan", "Grayson", "Eli", "Landon", "Andrew", "Max", "Samuel", "Gavin", "Wyatt", "Christian", "Hunter", "Cameron", "Evan", "Charlie", "David", "Sebastian", "Joseph", "Dominic", "Anthony", "Colton", "John", "Tyler", "Zachary", "Thomas", "Julian", "Levi", "Adam", "Isaiah", "Alex", "Aaron", "Parker", "Cooper", "Miles", "Chase", "Muhammad", "Christopher", "Blake", "Austin", "Jordan", "Leo", "Jonathan", "Adrian", "Colin", "Hudson", "Ian", "Xavier", "Camden", "Tristan", "Carson", "Jason", "Nolan", "Riley", "Lincoln", "Brody", "Bentley", "Nathaniel", "Josiah", "Declan", "Jake", "Asher", "Jeremiah", "Cole", "Mateo", "Micah", "Elliot"];
//var chains = _.map(names, function(name) {
//  name = _.toArray(name);
//  var lastLetter = _.head(name);
//  return _.map(_.tail(name), function(letter) {
//    var ret = [lastLetter, letter];
//    lastLetter = letter;
//    return ret;
//  });
//});
//_.each(chains, markov.readChain);
//_.times(10, function() {
//  var chain = markov.createChain();
//  var name = _.map(chain, function(state) {
//    return state[0];
//  });
//  name.push(_.last(chain)[1]);
//  name = name.join('');
//  console.log(name);
//});

// Parser
// I want to take a big chunk of text, break it into sentences. Each
// sentence I want to break up by words. Also, I want to remove quotes.
var data = fs.readFileSync('janeAusten.txt', {encoding: 'utf8'});
var re = /[?.!]\s/;
var sentences = data.split(re);
sentences = _.reduce(sentences, function(memo, sentence) {
  sentence = _.str.words(sentence.replace(/"/g, ''));
  if (memo.lastWord && _.contains(["Dr", "Mr", "Mrs", "Ms"], memo.lastWord)) {
    memo.lastSentence[memo.lastSentence.length - 1] += '.';
    memo.lastSentence = memo.lastSentence.concat(sentence);
  } else {
    memo.sentences.push(memo.lastSentence);
    memo.lastSentence = sentence;
  }
  memo.lastWord = _.last(memo.lastSentence);
  return memo;
}, { lastWord: null, lastSentence: [], sentences: [] }).sentences;

// States should be pairs
var chains = _.map(sentences, function(sen) {
  var lastWord = _.head(sen);
  return _.map(_.tail(sen), function(word) {
    var ret = [lastWord, word];
    lastWord = word;
    return ret;
  });
});

var markov = new Markov(function(xs) { return xs.join(''); });
_.each(chains, markov.readChain);
_.times(10, function() {
  var chain = markov.createChain();
  var sentence = _.map(chain, function(state) {
    return state[0];
  });
  sentence.push(_.last(chain)[1]);
  sentence = sentence.join(' ');
  console.log(sentence + '.\n');
});

//var i;
//var len = sentences.length;
//for (i = 0; i < len; i++) {
//  var sen = sentences[i].replace(/"/g, '');
//  console.log(sen);
//  sentences[i] = _.str.words(sen);
//  console.log(sentences[i]);
//}
