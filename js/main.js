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


var createJoystick = function(id, x, y) {

    var origin = two.makeCircle(x, y, 40);
    origin.stroke = '#000000';
    origin.linewidth = 0;
    origin.opacity = 0.0;
    origin.fill = '#000000';
    background.add(origin);

    var thumb = two.makeCircle(x, y, 30);
    thumb.stroke = '#000000';
    thumb.linewidth = 0;
    thumb.opacity = 0.0;
    thumb.fill = '#000000';
    background.add(thumb);

    joystick = {
        origin: origin,
        thumb: thumb,
        visible: false
    };
};

var showJoystick = function() {
    new TWEEN.Tween(joystick.origin)
        .to({
            scale: 1,
            opacity: 0.2
        }, 250)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();

    new TWEEN.Tween(joystick.thumb)
        .to({
            scale: 1,
            opacity: 0.2
        }, 250)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
};

var hideJoystick = function() {
    new TWEEN.Tween(joystick.origin)
        .to({
            scale: 0,
            opacity: 0.0
        }, 250)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();

    new TWEEN.Tween(joystick.thumb)
        .to({
            scale: 0,
            opacity: 0.0
        }, 250)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();

};

var updateJoystick = function(startX, startY, x, y) {
    joystick.origin.translation.x = startX;
    joystick.origin.translation.y = startY;
    // translate only a fraction of the distance from the center
    var xDiff = x - startX < 0 ? -Math.sqrt(startX - x) : Math.sqrt(x - startX);
    var yDiff = y - startY < 0 ? -Math.sqrt(startY - y) : Math.sqrt(y - startY);
    joystick.thumb.translation.x = startX + xDiff; //startX + Math.sqrt(x - startX); //startX + (20 * Math.cos(angle*Math.Pi/180.0));
    joystick.thumb.translation.y = startY + yDiff; //startY + Math.sqrt(y - startY); //startY + (20 * Math.sin(angle*Math.Pi/180.0));
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

    nodes.push({
        id: id,
        icon: icon,
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
    var onlyHomeLeft = true;
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

var createConnectionToNode = function(id) {
    var line = two.makeLine(me.icon.translation.x, me.icon.translation.y, nodes[id].icon.translation.x, nodes[id].icon.translation.y);
    line.stroke = '#000000';
    line.linewidth = 4;
    line.opacity = 1;
    background.add(line);
    connections.push({
        id: id,
        line: line
    });
}

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
    // new TWEEN.Tween(aim_line)
    //     .to({
    //         opacity: 0.5
    //     }, 500)
    //     .easing(TWEEN.Easing.Elastic.Out)
    //     .start();
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
    // new TWEEN.Tween(aim_line)
    //     .to({
    //         opacity: 0.0
    //     }, 500)
    //     .easing(TWEEN.Easing.Elastic.Out)
    //     .start();
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
    var x_pos = nodes[id].icon.translation.x - me.icon.translation.x;
    var y_pos = nodes[id].icon.translation.y - me.icon.translation.y;
    var guide = guides.filter(function(o) {
        return o.id == id;
    });
    if (guide[0]) {
        new TWEEN.Tween(guide[0].preline.vertices[1])
            .to({
                x: x_pos,
                y: y_pos
            }, 500)
            .easing(TWEEN.Easing.Exponential.Out)
            .start();
    } else {
        console.log("this id doesn't have a guide: " + id);
    }
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
    var guide = guides.filter(function(o) {
        return o.id == id;
    });
    if (guide[0]) {
        new TWEEN.Tween(guide[0].preline.vertices[1])
            .to({
                x: 0,
                y: 0
            }, 500)
            .easing(TWEEN.Easing.Exponential.Out)
            .start();
    } else {
        console.log("this id doesn't have a guide: " + id);
    }
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

var drawToSelectedNode = function() {
    // if no change, don't animate
    if (lastSelectedNode == nodes[selectedNodeID])
        return;

    var x_pos = nodes[selectedNodeID].icon.translation.x - me.icon.translation.x;
    var y_pos = nodes[selectedNodeID].icon.translation.y - me.icon.translation.y;
    new TWEEN.Tween(nodes[selectedNodeID].line.vertices[1])
        .to({
            x: x_pos,
            y: y_pos
        }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .start();

    // return old selected line
    if (lastSelectedNode) {
        new TWEEN.Tween(lastSelectedNode.line.vertices[1])
            .to({
                x: 0,
                y: 0
            }, 500)
            .easing(TWEEN.Easing.Exponential.Out)
            .start();
    }

    lastSelectedNode = nodes[selectedNodeID];
};

var getAngleToNode = function(id) {
    // get angle to nod
    var angle = Math.atan2(me.icon.translation.y - nodes[id].icon.translation.y, nodes[id].icon.translation.x - me.icon.translation.x);
    angle = (Math.floor(angle * 180 / 3.14159) + 360) % 360;

    return angle;
};

var getNodeClosestToDirection = function(targetAngle) {
    var id = 0;

    // Might be worth measuring distance and making the selection
    // based on both angle proximity and distance proximity
    // i.e. the user most likely wants the closest node in that general
    // direction, could be frustrating to miss, if easy to miss

    // Algorithm implemented
    // look at all nodes within 15º either direction and
    // choose the closest unvisited one.

    var closeNodes = [];
    var angleThreshold = 15;
    for (var i = 0; i < nodes.length; i++) {
        // only search not yet visited nodes
        if (nodes[i].visited || nodes[i].home) continue;

        var angle = getAngleToNode(i);
        // console.log("target angle: " + targetAngle + " angle to node: " + angle);

        if ((Math.abs(angle - targetAngle) < angleThreshold) || (Math.abs(360 + angle - targetAngle) < angleThreshold)) {
            // console.log("added node " + i + " with angle: " + angle);
            closeNodes.push(nodes[i]);
        }
    }

    if (closeNodes.length > 1) {
        var dist = 1000;
        var angleDistValue = 100000000; // ideally max value...
        console.log("--- Begin Close Nodes ---");
        for (var i = 0; i < closeNodes.length; i++) {
            var xDiff = Math.abs(closeNodes[i].icon.translation.x - me.icon.translation.x);
            var yDiff = Math.abs(closeNodes[i].icon.translation.y - me.icon.translation.y);
            var nodeDist = Math.floor(Math.sqrt(xDiff * xDiff + yDiff * yDiff));
            var angleDiff = Math.abs(targetAngle - getAngleToNode(closeNodes[i].id));
            console.log("node " + closeNodes[i].id + " at distance: " + nodeDist + " with angleDiff: " + angleDiff);
            if (getAngleDistValue(angleDiff, nodeDist) < angleDistValue) {
                id = closeNodes[i].id;
                angleDistValue = getAngleDistValue(angleDiff, nodeDist);
            }
            // if (nodeDist < dist) {
            //     id = closeNodes[i].id;
            //     dist = nodeDist;
            // }
        }
        console.log("--- End Close Nodes ---");
        return id;
    }

    // or just find the closest old fashioned style
    var diff = 360;

    for (var i = 0; i < nodes.length; i++) {

        // only search not yet visited nodes
        if (nodes[i].visited || nodes[i].home) continue;

        var angle = getAngleToNode(i);
        if (Math.abs(angle - targetAngle) < diff) {
            diff = Math.abs(angle - targetAngle);
            id = i;
        }
        if (Math.abs(360 + angle - targetAngle) < diff) {
            diff = Math.abs(angle - targetAngle);
            id = i;
        }
    }

    // if the angle diff is really big, maybe open up the angleThreshold and try that again...

    return id;
};

var getAngleDistValue = function(angle, distance) {
    // return distance * Math.sqrt(angle);
    return distance + (10 * angle);
    // return distance + (100 * angle / distance);
}

var updateLineDirection = function(angle) {

    var nodeID = getNodeClosestToDirection(angle);
    if (selectedNodeID < 0) {
        makeNodeBig(nodeID);
        selectedNodeID = nodeID;
    } else if (selectedNodeID != nodeID) {
        makeNodeSmall(selectedNodeID);
        makeNodeBig(nodeID);
        selectedNodeID = nodeID;
    }
};

var isComplete = function() {
    for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].visited)
            return false;
    }
    return true;
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
    }
    nodes = [];

    // remove leftover connections
    for (var i = 0; i < connections.length; i++) {
        background.remove(connections[i].line);
    }
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
    createJoystick();

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
        console.log("began touch: (" + touch.pageX + ", " + touch.pageY + ")");
        document.getElementById('x_coord_start').innerHTML = Math.floor(touch.pageX);
        document.getElementById('y_coord_start').innerHTML = Math.floor(touch.pageY);
        startTouchPoint.x = touch.pageX;
        startTouchPoint.y = touch.pageY;
        makeMeBig();
        showGuideLines();
        showJoystick();
        updateJoystick(startTouchPoint.x, startTouchPoint.y, startTouchPoint.x, startTouchPoint.y);
    }
}, false);

obj.addEventListener('touchmove', function(event) {
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
        var touch = event.targetTouches[0];
        // location of touch
        // console.log("moved touch: (" + touch.pageX + ", " + touch.pageY + ")");
        document.getElementById('x_coord_move').innerHTML = Math.floor(touch.pageX);
        document.getElementById('y_coord_move').innerHTML = Math.floor(touch.pageY);

        // update angle
        var angle = Math.atan2(startTouchPoint.y - touch.pageY, touch.pageX - startTouchPoint.x);
        angle = ((angle * 180 / 3.14159) + 360) % 360;

        document.getElementById('angle').innerHTML = Math.floor(angle);

        updateLineDirection(angle);
        updateJoystick(startTouchPoint.x, startTouchPoint.y, touch.pageX, touch.pageY);
    }
}, false);

obj.addEventListener('touchend', function(event) {
    if (event.changedTouches.length == 1) {
        var touch = event.changedTouches[0];
        // location of touch
        console.log("ended touch: (" + touch.pageX + ", " + touch.pageY + ")");
        document.getElementById('x_coord_end').innerHTML = Math.floor(touch.pageX);
        document.getElementById('y_coord_end').innerHTML = Math.floor(touch.pageY);

        // update angle
        var angle = Math.atan2(startTouchPoint.y - touch.pageY, touch.pageX - startTouchPoint.x);
        angle = ((angle * 180 / 3.14159) + 360) % 360;

        document.getElementById('angle').innerHTML = Math.floor(angle);

        // choose item closest to angle to travel to
        var nodeID = getNodeClosestToDirection(angle);
        // var nodeID = Math.floor(20*Math.random());

        makeMeSmall();
        makeNodeSmall(nodeID);
        hideGuideLines();
        createConnectionToNode(nodeID);
        hideJoystick();

        console.log("now at: " + nodeID + " node");
        updateMeToID(nodeID);

        var dist = getTotalConnectionDistance();
        document.getElementById('distance').innerHTML = dist;
        document.getElementById('sum-distance').innerHTML = dist;

        if (isComplete() && !isSolved) {
            isSolved = true;
            createSolutionShape();
        }
    }
    // makePlayerSmall(selectedPlayerID);
    // hideGuideLines();
    // drawToSelectedPlayer();
}, false);

// migrate button
document.getElementById("moreNodes").addEventListener("click", function() {
    console.log("add one more node");
    numNodes++;
    if(numNodes > 50) numNodes = 50;
});

// migrate button
document.getElementById("lessNodes").addEventListener("click", function() {
  console.log("add one more node");
  numNodes--;
  if(numNodes < 10) numNodes = 10;
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
    }
    // remove leftover connections
    for (var i = 0; i < connections.length; i++) {
        background.remove(connections[i].line);
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
