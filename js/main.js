/**
 * Created by jonathanbobrow on 9/3/15.
 */

// Traveling salesman
/* Score is dependant on 2 factors:
 *
 *  1) How short is the distance you travelled
 *  2) How quickly did you travel that distance
 *  ...
 *  3) How many times did you cross your path (redundant with 1, just a different metric)
 *
 *  vs. AI mode
 *  computer figures out the best route given n cycles
 *  computer then executes its best route w/ 1 seconds per travel... in a different color, at the same time
 */

// icons
var me;
var nodes = [];
var guides = [];
var connections = [];
var selectedNodeID = -1;
var lastSelectedNode;
var lastPreSelectedNode;

// drag specific
var isTravelling = false;
var onlyHomeLeft = false;

var numNodes = 20;
var nodeSize = 8;
var icon_spacing = 40;
var line_length = 28;

var aim_line;
var aim_circle;

var joystick;

var screen_padding = 40;

var solutionPolygon;
var isSolved = false;

// make layers
var background;
var middleground;
var foreground;

var createPath = function() {
  // create an open polygon to be updated as the path traveled
  // start with two vertices at the same home point
  // update path with move the last vertex and add more as needed
}

var updatePath = function(x,y) {
  // console.log("position (" + x + ", " + y + ")");
  // update last vertex in polygon (not closed)
  me.line.vertices[1].x = x - me.icon.translation.x;
  me.line.vertices[1].y = y - me.icon.translation.y;

  // if near unvisited destination, attach and create new vertex
  // find closest unvisited node
  var minDist = 20;
  var nodeId = -1;
  for (var i = 0; i < nodes.length; i++) {
    // only search not yet visited nodes
    if (nodes[i].visited || (!onlyHomeLeft && nodes[i].home)) continue;

    var xDiff = nodes[i].icon.translation.x - x;
    var yDiff = nodes[i].icon.translation.y - y;
    var dist = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
    if(dist < minDist) {
      nodeId = i;
      minDist = dist;
    }
  }

  // if close to node, attach to it
  if(nodeId != -1) {
    // add the node to the connections
    connections.push({
      id: nodeId
    });

    if(onlyHomeLeft) {
      // no longer travelling
      isTravelling = false;
      // complete the path
      makeMeSmall();
      me.line.vertices[1].x = nodes[nodeId].icon.translation.x - me.icon.translation.x;
      me.line.vertices[1].y = nodes[nodeId].icon.translation.y - me.icon.translation.y;
      updateMeToID(nodeId);
      // remove unique color from my position
      me.icon.fill = '#FFFF00';
      me.highlight.fill = '#FF9900';
      // set home to visited
      me.visited = true;
      // show solution
      createSolutionShape();
      // celebrate
      celebrate();
    }
    else {
      makeMeSmall();
      me.line.vertices[1].x = nodes[nodeId].icon.translation.x - me.icon.translation.x;
      me.line.vertices[1].y = nodes[nodeId].icon.translation.y - me.icon.translation.y;
      updateMeToID(nodeId);
      makeMeBig();
    }
  }
}

var snapBackToHome = function() {
  // return line to home
  new TWEEN.Tween(me.line.vertices[1])
      .to({
          x: 0,
          y: 0
      }, 200)
      .easing(TWEEN.Easing.Exponential.Out)
      .start();
};

var celebrate = function() {
  var duration = 500;
  var delay = 100;

  for (var i = 0; i < connections.length; i++) {

    // animate the highlight
    var b = new TWEEN.Tween(nodes[connections[i].id].highlight)
        .to({
            scale: 1
        }, duration)
        .easing(TWEEN.Easing.Sinusoidal.InOut);

    var a = new TWEEN.Tween(nodes[connections[i].id].highlight)
        .to({
            scale: 4
        }, duration)
        .delay(i*delay)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .chain(b)
        .start();

    // animate the iconvar b = new TWEEN.Tween(nodes[connections[i].id].highlight)
    var d = new TWEEN.Tween(nodes[connections[i].id].icon)
        .to({
            scale: 1
        }, duration)
        .easing(TWEEN.Easing.Sinusoidal.InOut);

    var c = new TWEEN.Tween(nodes[connections[i].id].icon)
        .to({
            scale: 1.5
        }, duration)
        .delay(i*delay)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .chain(d)
        .start();
  }
};

var getTotalConnectionDistance = function() {
    var fromID = 0;
    var total = 0;

    for (var i = 0; i < connections.length; i++) {
        var fromX = nodes[fromID].icon.translation.x;
        var fromY = nodes[fromID].icon.translation.y;
        var toX = nodes[connections[i].id].icon.translation.x;
        var toY = nodes[connections[i].id].icon.translation.y;

        var xDiff = fromX - toX;
        var yDiff = fromY - toY;

        var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
        total += distance;
        // update the from id
        fromID = connections[i].id;
    }

    return Math.floor(total);
};

// find the shortest possible path
var findTheShortestPossiblePath = function() {
    // var minDist = 10000000;
    // for(var i=0; i<)
};

var isWellSpacedPosition = function(x, y) {

    // proximity to walls
    if (x < screen_padding || x > $(window).width() - screen_padding || y < 2 * screen_padding || y > $(window).height() - 2 * screen_padding)
        return false;

    // determine icon spacing based on number of nodes and screen space
    var screen_width = window.innerWidth ? window.innerWidth : $(window).width(); //$(window).width();
    var screen_height = window.innerHeight ? window.innerHeight : $(window).height(); //$(window).height();
    icon_spacing = Math.sqrt((screen_width - 2*screen_padding) * (screen_height - 4*screen_padding) / numNodes) / 2;
    console.log("icon spacing for " +numNodes+ " nodes on a " + screen_width + " x " + screen_height + " screen is " + icon_spacing);

    // check proximity to other nodes
    for (var i = 0; i < nodes.length; i++) {
        var x_diff = nodes[i].icon.translation.x - x;
        var y_diff = nodes[i].icon.translation.y - y;
        var dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
        if (dist < icon_spacing)
            return false;
    }
    return true;
};

var createNode = function(id, x, y) {

    var highlight = two.makeCircle(x, y, nodeSize);
    highlight.stroke = '#000000';
    highlight.linewidth = 0;
    highlight.opacity = 0.5;
    highlight.fill = '#FF9900';

    var icon = two.makeCircle(x, y, nodeSize);
    icon.stroke = '#000000';
    icon.linewidth = 4;
    icon.fill = '#FFFF00';

    var line = two.makeLine(x, y, x, y);
    line.stroke = '#000000';
    line.linewidth = 4;
    line.opacity = 1;
    background.add(line);

    nodes.push({
        id: id,
        icon: icon,
        line: line,
        highlight: highlight,
        visited: false,
        home: id == 0 ? true : false,
    });
};

var updateMeToID = function(id) {
    me = nodes[id];
    nodes[id].visited = true;
    // fill me w/ red
    nodes[id].icon.fill = '#FF0000';
    nodes[id].highlight.fill = '#00CCFF';
    // fill others w/ yellow
    for (var i = 0; i < nodes.length; i++) {
        if (i != id) {
            nodes[i].icon.fill = '#FFFF00';
            nodes[i].highlight.fill = '#FF9900';
        }
    }
    createGuides();
    selectedNodeID = -1;
};

var createGuides = function() {
    // remove old guides
    for (var i = 0; i < guides.length; i++) {
        background.remove(guides[i].guide);
        background.remove(guides[i].preline);
    }
    guides = [];
    onlyHomeLeft = true;
    for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].visited && !nodes[i].home) {
            onlyHomeLeft = false;
            createGuideToNode(i);
        }
    }
    if (onlyHomeLeft) {
        createGuideToNode(0); // only draw to home node
    }
};

var createGuideToNode = function(id) {
    var guide = two.makeLine(me.icon.translation.x, me.icon.translation.y, nodes[id].icon.translation.x, nodes[id].icon.translation.y);
    guide.stroke = '#00CCFF';
    guide.linewidth = 4;
    guide.opacity = 0;
    background.add(guide);

    var pre_line = two.makeLine(me.icon.translation.x, me.icon.translation.y, me.icon.translation.x, me.icon.translation.y);
    pre_line.stroke = '#00CCFF';
    pre_line.opacity = 0.5;
    pre_line.linewidth = 4;
    background.add(pre_line);

    guides.push({
        id: id,
        guide: guide,
        preline: pre_line,
    });
};

var makeMeBig = function() {
    new TWEEN.Tween(me.icon)
        .to({
            scale: 1.5
        }, 500)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
    new TWEEN.Tween(me.highlight)
        .to({
            scale: 4
        }, 750)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
};

var makeMeSmall = function() {
    new TWEEN.Tween(me.icon)
        .to({
            scale: 1
        }, 500)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
    new TWEEN.Tween(me.highlight)
        .to({
            scale: 1
        }, 750)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
};

var makeNodeBig = function(id) {
    new TWEEN.Tween(nodes[id].icon)
        .to({
            scale: 1.2
        }, 500)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
    new TWEEN.Tween(nodes[id].highlight)
        .to({
            scale: 5
        }, 750)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
};

var makeNodeSmall = function(id) {
    new TWEEN.Tween(nodes[id].icon)
        .to({
            scale: 1
        }, 500)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
    new TWEEN.Tween(nodes[id].highlight)
        .to({
            scale: 1
        }, 750)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
};

var showGuideLines = function() {
    for (var i = 0; i < guides.length; i++) {
        new TWEEN.Tween(guides[i].guide)
            .to({
                opacity: 0.1
            }, 250)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
    }
};

var hideGuideLines = function() {
    for (var i = 0; i < guides.length; i++) {
        new TWEEN.Tween(guides[i].guide)
            .to({
                opacity: 0
            }, 250)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
    }
};

// fill the solution with a polygon
var createSolutionShape = function() {
    // createPolygon
    var points = [];
    // add first point
    for (var i = 0; i < connections.length; i++) {
        var pos = nodes[connections[i].id].icon.translation;
        var anchor = new Two.Anchor(pos.x, pos.y);
        // add points of polygon
        points.push(anchor);
    }
    // close polygon
    solutionPolygon = two.makePolygon(points, true);
    solutionPolygon.stroke = '#000000';
    solutionPolygon.linewidth = 4;
    solutionPolygon.opacity = 0.5;
    solutionPolygon.fill = '#0099FF';
    background.add(solutionPolygon);
};


/*
 *  THE MAIN FUNCTIONS
 *
 */

var initNodes = function() {

    // make layers
    background = two.makeGroup();
    middleground = two.makeGroup();
    foreground = two.makeGroup();

    createNodes();
    updateMeToID(0); // start as the first player created
    nodes[0].visited = false;
};


// make travel points
var createNodes = function() {
    // remove nodes if any are present
    for (var i = 0; i < nodes.length; i++) {
        two.remove(nodes[i].icon);
        two.remove(nodes[i].highlight);
        background.remove(nodes[i].line);
    }
    nodes = [];
    connections = [];

    while (nodes.length < numNodes) {
        var x_pos = Math.random() * $(window).width();
        var y_pos = Math.random() * $(window).height();
        if (isWellSpacedPosition(x_pos, y_pos))
            createNode(nodes.length, x_pos, y_pos);
    }
    // make first node home
    nodes[0].home = true;
};


// prevent scroll on touch
document.ontouchmove = function(event) {
    event.preventDefault();
}

var startTouchPoint = {
    x: 0,
    y: 0
};

// Do this stuff on load (thanks jquery!)
$(function() {

    var width = window.innerWidth ? window.innerWidth : $(window).width(); //$(window).width();
    var height = window.innerHeight ? window.innerHeight : $(window).height(); //$(window).height();
    console.log("window of size: (" + width + ", " + height + ")");
    document.getElementById('screen_width').innerHTML = width;
    document.getElementById('screen_height').innerHTML = height;

    two = new Two({
        fullscreen: true
    });

    two.appendTo(document.getElementById("two"));

    // Update the renderer in order to generate corresponding DOM Elements.
    two.update();

    initNodes();

    _.defer(function() {

        two.bind('resize', function() {

            })
            .bind('update', function(frameCount) {

                // update loop here
                TWEEN.update();

            })
            .play();

    });

});

var obj = document.getElementById('two');

obj.addEventListener('onmousedown', function(event) {
    console.log("began press: (" + event.offsetX + ", " + event.offsetY + ")");
}, false);

obj.addEventListener('touchstart', function(event) {
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
        var touch = event.targetTouches[0];
        // location of touch
        // console.log("began touch: (" + touch.pageX + ", " + touch.pageY + ")");

        var xDiff = Math.abs(me.icon.translation.x - touch.pageX);
        var yDiff = Math.abs(me.icon.translation.y - touch.pageY);
        var distFromTraveler = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
        // console.log("distFromTraveler = " + distFromTraveler);
        if(distFromTraveler < 30) {
          // if close enough to active node, grab the line to drag to destinations
          makeMeBig();
          // set dragging to true
          isTravelling = true;
          // create line to drag
          updatePath(touch.pageX, touch.pageY);
        }
        else {
          // if not close enough to active node, show guide lines and suggest drag from head of trail
          showGuideLines();
          // set dragging to false
          isTravelling = false;
        }
    }
}, false);

obj.addEventListener('touchmove', function(event) {
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
        var touch = event.targetTouches[0];
        // location of touch
        // console.log("moved touch: (" + touch.pageX + ", " + touch.pageY + ")");

        // if started travelling
        if(isTravelling) {
          updatePath(touch.pageX, touch.pageY);
          // if close enough to unvisited node, attach to node and update the travelers position
          // do not connect to the origin node, only connect to the origin node upon touch end
          // if close enough to last visited node for >1 second,
          // indicate removal and remove point from path travelled
        }
        else{
          // reinforce the need to start from the head of the trail
          // or hint at possible paths... ghostly flashes of possible connections for 200ms each...
          // flickerGuides();
        }
    }
}, false);

obj.addEventListener('touchend', function(event) {
    if (event.changedTouches.length == 1) {
        var touch = event.changedTouches[0];
        // location of touch
        // console.log("ended touch: (" + touch.pageX + ", " + touch.pageY + ")");

        // if close enough to final node, attach to final node and update the travelers position
        // celebrate completion

        // otherwise
        // spring back to last attached node
        if(isTravelling) {
          snapBackToHome();
          // if I am big, make me small
          makeMeSmall();
        }

        // if showing guide lines, they should hide
        hideGuideLines();

        // calculate distance traveled
        var dist = getTotalConnectionDistance();
        document.getElementById('distance').innerHTML = dist;
        document.getElementById('sum-distance').innerHTML = dist;
    }
}, false);

// more cities button
document.getElementById("moreNodes").addEventListener("click", function() {
    console.log("add one more node");
    numNodes++;
    if(numNodes > 50) numNodes = 50;
    document.getElementById('numCities').innerHTML = numNodes;
});

// less cities button
document.getElementById("lessNodes").addEventListener("click", function() {
  console.log("add one more node");
  numNodes--;
  if(numNodes < 10) numNodes = 10;
  document.getElementById('numCities').innerHTML = numNodes;
});

// migrate button
document.getElementById("newButton").addEventListener("click", function() {
    console.log("migrate button pressed");
    createNodes();
    updateMeToID(0); // start as the first player created
    nodes[0].visited = false;

    document.getElementById('distance').innerHTML = 0;
    // remove solution
    if (solutionPolygon) {
        background.remove(solutionPolygon);
    }
    isSolved = false;
});

// reset button
document.getElementById("resetButton").addEventListener("click", function() {
    console.log("reset button pressed");
    // make all nodes not visited
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].visited = false;
        // return connections
        nodes[i].line.vertices[1].x = 0;
        nodes[i].line.vertices[1].y = 0;
    }
    // remove solution
    if (solutionPolygon) {
        background.remove(solutionPolygon);
    }
    isSolved = false;
    connections = [];
    updateMeToID(0); // start as the first player created
    nodes[0].visited = false;

    document.getElementById('distance').innerHTML = 0;
});
