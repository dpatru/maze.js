var WHITE = "rgb(255,255,255)";
var BLACK = "rgb(0,0,0)";
var RED = "rgb(200,0,0)";
var CELL = 5; // cell size

function chooseRandomElementFromSet(s) {
  // set s is a simple object
  var bestVal = -1;
  var bestK;
  for (var k in s) {
    var v = Math.random();
    if ( v > bestVal ) {
      bestVal = v;
      bestK = k;
    }
  }
  return bestK;
}
function randInt(max) { return Math.floor(Math.random()*max); }
function chooseRandomElementFromArray(a) {
    return a[randInt(a.length)];
}
function augmentSet(s1, s2) {
  // sets s1 and s2 are simple objects
  // return augmented set s1
  for (var k in s2) { s1[k] = 1; }
  return s1;
}
function assert(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
       throw new Error(message);
    }
    throw message; // Fallback
  }
}
function swap (arr, i, j) {
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
function shuffle(arr) {
    for(var i = arr.length - 1; i > 0; i--) {
	swap(arr, i, randInt(i+1));
    }
    return arr;
}
function drawLine(ctx, x1, y1, dx, dy, style) {
    // console.log("drawing line");
    var oldstyle = ctx.strokeStyle;
    ctx.strokeStyle = style;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1+dx, y1+dy);
    ctx.stroke();
    ctx.strokeStyle = oldstyle;
}

function Maze(h, w, strategy) {
    h = parseInt(h); w = parseInt(w);
    assert(h > 0 && w > 0, "Bad dimensions.");
    this.h = h;
    this.w = w;
    this.m = new Array(h*w);
    this.erase();
    this.strategy = strategy? strategy: this.dfsGraph;
    // this.creationOrder = [];
    // this.randomize();
}

Maze.prototype.erase = function() {
    for (var i = 0; i < this.h * this.w; i++) {
	this.m[i] = 0;
    }
};

Maze.prototype.openPassagexy = function(x1, y1, x2, y2){
    var w = this.w, h = this.h;
    var p1 = x1+y1*w, p2 = x1+y2*w;
    this.openPassage(p1, p2);
};

Maze.prototype.openPassage = function (p1, p2) {
    var w = this.w;
    var x1 = p1 % w, y1 = Math.floor(p1 / w);
    var x2 = p2 % w, y2 = Math.floor(p2 / w);
    assert(this.isValidCell(p1), p1+"("+x1+","+y1+") is not a valid cell.");
    assert(this.isValidCell(p2), p2+"("+x2+","+y2+") is not a valid cell.");
    assert((x1 == x2 && Math.abs(y1-y2) == 1) ||
	   (y1 == y2 && Math.abs(x1-x2) == 1),
	   "("+x1+","+y1+") is not adjacent to ("+x2+","+y2+")");
    if (x1 == x2) { // vertical
	this.m[	(y1 > y2)? p1: p2] |= 2;
    }
    else { // horizontal
	this.m[	(x1 > x2)? p1: p2] |= 1;
    }
};

Maze.prototype.randomWalk = function(start, steps) {
    // console.log("randomWalk");
    // walk around randomly, returning a list of visited nodes
    if (!start) start = 0;
    if (!steps) steps = this.w * this.h;
    var visited = [start];
    var a = start, b;
    do {
	// console.log("randomWalk: a = "+a+", steps = "+steps);
	b = this.chooseRandomNeighbor(a);
	assert(b >= 0, "Bad random neighbor "+b);
	this.openPassage(a, b);
	visited.push(a);
	a = b;
    } while (steps-- > 0);

    return visited;
};
	
Maze.prototype.randomPath = function(start, visited) {
    // randomly walk, avoiding visited nodes. Return path.
    if (!start) start = 0;
    if (!visited) visited = {};
    var path = [];
    var prev = -1;
    while (!visited[start]) {
	if (prev >= 0) this.openPassage(prev, start);
	visited[start] = true;
	path.push(start);
	prev = start;
	start = this.randomNeighbor(start, visited);
	if (start < 0) return path;
    }
};

Maze.prototype.randomNeighbor = function(x, exclude) {
    var ns = shuffle(this.neighbors(x));
    for (var i = 0; i < ns.length; i++) {
	var n = ns[i];
	if (!exclude || !exclude[n]) return n;
    }
    return -1;
};
	
Maze.prototype.isValidCell = function(x) {
  return x >= 0 && x < this.w * this.h;
};

Maze.prototype.neighbors = function(x) {
    assert(this.isValidCell(x),
           x+" is out of range (maze size is "+this.w+" by "+this.h+")");
    assert(this.w * this.h > 1, "No neighbors.");
    var ns = [];
    var w = this.w, h = this.h;
    var col = x % w;
    if (col > 0)   ns.push(x-1);
    if (col < w-1) ns.push(x+1);
    var row = Math.floor(x / w);
    if (row > 0)   ns.push(x-w);
    if (row < h-1) ns.push(x+w);
    return ns;
};
Maze.prototype.chooseRandomNeighbor = function(x) {
  var w=this.w, h=this.h, cells = this.w * this.h;
  assert(this.isValidCell(x),
         x+" is out of range (maze size is "+w+" by "+h+")");
  assert(cells > 1, "No neighbors.");
  // single col or row
  if ( this.w === 1 || this.h === 1 ) {
    return x === 0? 1:
      x === cells - 1? x-1:
      Math.random() < 0.5? x-1: x+1;
  }
  var r = Math.random();
  // handle corners, sides, then middle cells
  var n = x === 0? (r < 0.5? 1: w):
    x === w - 1? (r < 0.5? x - 1: x + w):
    x === w * (h - 1)? (r < 0.5? x - w: x+1):
    x === cells - 1? (r < 0.5? x - w: x-1):
    x < w? (r < 0.33? x-1: r < 0.66? x+1: x+w):
    x + w > cells? (r < 0.33? x-1: r < 0.66? x+1: x-w):
    x % w === 0? (r < 0.33? x-w: r < 0.66? x+1: x+w):
    x % w === w-1? (r < 0.33? x-w: r < 0.66? x-1: x+w):
    r < 0.25? x-w:
    r < 0.50? x+1:
    r < 0.75? x+w:
    x-1;
  // console.log("returning neighbor "+n+" for cell "+x);
  assert(this.isValidCell(n), n+" is an invalid neighbor");
  return n;
};

Maze.prototype.dfs = function(callback) {
    var seen = {};
    var starts = [0];
    var count = 0;
    while(starts.length > 0) {
	var x = starts.pop();
	// console.log("dfs: count = "+count+", cell = "+x);
	if (seen[x]) continue;
	seen[x] = true;
	// console.log("dfs: count = "+count+", unseen cell = "+x);
	if (callback) callback(x, count++);
	Array.prototype.push.apply(starts, this.neighborsInPath(x));
	// console.log("dfs: stack = "+starts);
    }
};

Maze.prototype.dfsPath = function(start, seen) {
    if (!start) start = 0;
    if (!seen) seen = {};
    var stack=[[-1, start]];
    while (stack.length > 0) {
	var x = stack.pop();
	if (seen[x[1]]) continue;
	seen[x[1]] = true;
	if (x[0] >= 0) this.openPassage(x[0], x[1]);
	Array.prototype.push.apply(
	    stack,
	    shuffle(this.neighbors(x[1]).map(function(x1){ return [x[1], x1]; })));
	// console.log("dfs: stack = "+stack);
	// console.log("dfs: x = "+x);

    }
};
	
Maze.prototype.dfsGraph = function(start, seen, minCycle) {
    if (!start) start = 0;
    if (!seen) seen = {};
    if (!minCycle) minCycle = 50;
    var cycles = 0;
    var stack=[[-1, start, 1]]; // previous cell, current cell, current count.
    while (stack.length > 0) {
	var x = stack.pop();
	if (seen[x[1]]) {
	    var dist = Math.abs(seen[x[1]] - x[2]);
	    if (dist >= minCycle && randInt(minCycle) == 1) {
		cycles++;
		console.log("creating loop "+cycles+" at "+x[0]+" and "+x[1]+", counts are "+seen[x[1]]+" and "+x[2]+", dist = "+dist);
		this.openPassage(x[1],x[0]);
	    }
	    continue;
	}
	seen[x[1]] = x[2];
	if (x[0] >= 0) this.openPassage(x[0], x[1]);
	Array.prototype.push.apply(
	    stack,
	    shuffle(this.neighbors(x[1]).map(function(x1){ return [x[1], x1, x[2]+1]; })));
	// console.log("dfs: stack = "+stack);
	// console.log("dfs: x = "+x);

    }
};
	

Maze.prototype.neighborsInPath = function(x) {
    var w = this.w, h = this.h, m = this.m;
    var i = x % w, j = Math.floor(x / w);
    var ns = [];
    if (i > 0   && m[x] & 1)   ns.push(x-1);
    if (i < w-1 && m[x+1] & 1) ns.push(i+1+j*w);
    if (j > 0   && m[x] & 2)   ns.push(x-w);
    if (j < h-1 && m[x+w] & 2) ns.push(x+w);
    // console.log("neighborsInPath: maze = "+this+", x = "+x+", neighbors = "+ns);
    return ns;
};
	
Maze.prototype.draw = function (ctx) {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0,0, this.w*CELL, this.h*CELL);
    ctx.strokeStyle = BLACK;
    ctx.strokeRect(0,0, this.w*CELL, this.h*CELL);
    var delay = parseFloat(document.getElementById("delay").value);
    var maze = this;
    var threadDelay = 50;
    this.dfs(function(x, i){
	setTimeout(function(){
	    // console.log("executing "+i+": "+x);
	    maze.drawSquare(ctx, x, delay*.9);
	}, (Math.floor(i/threadDelay) + i%threadDelay)*1000*delay);
    });
};

Maze.prototype.drawSquare = function(ctx, x, delay) {
    // console.log(this);
    var w = this.w, h = this.h;
    var i = x % this.w;
    var j = Math.floor(x / w);
    // var x = i + maze.w * j;
    var mx = this.m[x];
    // console.log("drawing "+x);
    ctx.fillStyle = RED;
    ctx.fillRect( i*CELL, j*CELL, CELL, CELL);
    var maze = this;
    setTimeout(function() {
	// console.log("drew "+x);
	ctx.fillStyle = WHITE;
	ctx.fillRect( i*CELL, j*CELL, CELL, CELL);

	// console.log("drawing left side of "+mx+"="+(mx & 1?WHITE:BLACK) );
	drawLine(ctx, i*CELL, j*CELL, 0, CELL,
		 (mx & 1)? WHITE: BLACK);

	// console.log("drawing top side of "+mx+"="+(mx & 2?WHITE:BLACK) );
	drawLine(ctx, i*CELL, j*CELL, CELL, 0,
		 (mx & 2)? WHITE: BLACK);

	if (i < w-1) {
	    // console.log("drawing right side of "+mx+" ("+maze.m[x+1]+") ="+(maze.m[x+1] & 1?WHITE:BLACK) );
	    drawLine(ctx, (i+1)*CELL, j*CELL, 0, CELL,
		     (maze.m[x+1] & 1)? WHITE: BLACK);
	}
	if (j < h-1) {
	    // console.log("drawing bottom side of "+x+" ("+maze.m[x+w]+") ="+(maze.m[x+w] & 1?WHITE:BLACK) );
	    drawLine(ctx, i*CELL, (j+1)*CELL, CELL, 0,
		     (maze.m[x+w] & 2)? WHITE: BLACK);
	}

	// ctx.textBaseline="top";
	// ctx.strokeText(mx, i*CELL, j*CELL);
	
    }, Math.round(delay*1000)  );
};


Maze.prototype.redraw = function (ctx) {
    this.clear();
    this.strategy();
    this.draw(ctx);
};

var m;

function makeMaze() {
    var h = document.getElementById("height").value; 
    var w = document.getElementById("width").value; 
    // console.log("height "+h, "width "+w);
    m= new Maze(h,w);
    m.strategy();
    m.draw(c);
}
var canvas = document.getElementById('c');
var c = canvas.getContext('2d');
c.scale(2,2);
function go() {
  //c.fillStyle = RED;
  //c.fillRect (10, 10, 55, 50);
  //c.fillStyle = "rgba(0, 0, 200, 0.5)";
  //c.fillRect (30, 30, 55, 50); 
  makeMaze();
}


function redraw() { m.redraw(c); }
function draw() { m.draw(c); }
go();
