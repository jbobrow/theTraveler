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
var connections = [];
var selectedNodeID = -1;
var lastSelectedNode;
var lastPreSelectedNode;

var numNodes = 20;
var nodeSize = 8;
var icon_spacing = 20;
var line_length = 28;

var aim_line;
var aim_circle;

// make layers
var background;
var middleground;
var foreground;


var isWellSpacedPosition = function(x, y) {

    // proximity to walls
    if (x < icon_spacing || x > $(window).width() - icon_spacing || y < icon_spacing || y > $(window).height() - icon_spacing)
        return false;

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
        visited: false
    });
};

var updateAngles = function() {
    //  for each(node in nodes) {
    //
    //      if (node.id != me.id) {
    //          var theta = Math.atan2(me.icon.translation.x - x, me.icon.translation.y - y) + Math.PI / 2;
    //          if (theta > 2 * Math.PI) theta -= 2 * Math.PI;
    //          if (theta < 0) theta += 2 * Math.PI;
    //          //theta = 2 * Math.PI - theta;
    //          var degrees = theta * 180 / Math.PI;
    //          console.log("node " + id + " is " + Math.floor(degrees) + "º from me");
    //      }
    //  }
};

var updateMeToID = function(id) {
    me = nodes[id];
    nodes[id].visited = true;
    // fill visited w/ red
    nodes[id].icon.fill = '#FF0000';
    //  updateConnections();
    //  updateAngles();
};

var createConnections = function() {
    var guide = two.makeLine(x, y, me.icon.translation.x, me.icon.translation.y);
    guide.stroke = '#00CCFF';
    guide.linewidth = 4;
    guide.opacity = 0;
    background.add(guide);

    var pre_line = two.makeLine(me.icon.translation.x, me.icon.translation.y, me.icon.translation.x, me.icon.translation.y);
    pre_line.stroke = '#00CCFF';
    pre_line.opacity = 0.5;
    pre_line.linewidth = 4;
    background.add(pre_line);

    var line = two.makeLine(me.icon.translation.x, me.icon.translation.y, me.icon.translation.x, me.icon.translation.y);
    line.stroke = '#000000';
    line.opacity = 1;
    line.linewidth = 4;
    background.add(line);

    connections = [];

    connections.push({
        guide: guide,
        pre_line: pre_line,
        line: line
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
    new TWEEN.Tween(aim_line)
        .to({
            opacity: 0.5
        }, 500)
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
    new TWEEN.Tween(aim_line)
        .to({
            opacity: 0.0
        }, 500)
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
            scale: 3
        }, 750)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
    var x_pos = nodes[id].icon.translation.x - me.icon.translation.x;
    var y_pos = nodes[id].icon.translation.y - me.icon.translation.y;
    new TWEEN.Tween(nodes[id].preline.vertices[1])
        .to({
            x: x_pos,
            y: y_pos
        }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
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
    new TWEEN.Tween(nodes[id].preline.vertices[1])
        .to({
            x: 0,
            y: 0
        }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .start();
};

var drawLineToNode = function(id) {

};

var removeLineFromNode = function(id) {

};

var showGuideLines = function() {
    for (var i = 0; i < numNodes; i++) {
        new TWEEN.Tween(nodes[i].guide)
            .to({
                opacity: 0.1
            }, 250)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
    }
};

var hideGuideLines = function() {
    for (var i = 0; i < numNodes; i++) {
        new TWEEN.Tween(nodes[i].guide)
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
  angle = (Math.floor(angle * 180 / 3.14159) + 360 ) % 360;

  return angle;
};

var getNodeClosestToDirection = function(targetAngle) {
    var id = 0;
    var diff = 360;
    for (var i = 0; i < numNodes; i++) { // TODO: fix this
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
    return id;
};

var updateLineDirection = function(x, y) {
    //console.log("my position: ("+me.icon.translation.x+", "+me.icon.translation.y+")");
    var theta = Math.atan2(x, y) - Math.PI / 2;
    if (theta < 0) theta += 2 * Math.PI;
    theta = 2 * Math.PI - theta;
    document.getElementById('angle').innerHTML = Math.floor(theta * 180 / Math.PI);
    //console.log("degrees: " + theta * 180 / Math.PI);
    aim_line.vertices[1].x = Math.round(line_length * Math.cos(theta));
    aim_line.vertices[1].y = -Math.round(line_length * Math.sin(theta));
    //console.log("line point: (" + aim_line.vertices[1].x + ", " + aim_line.vertices[1].y + ")");

    //aim_circle.translation.x = me.icon.translation.x + Math.round(2 * nodeSize * Math.cos(Math.atan2(x, y) - Math.PI / 2));
    //aim_circle.translation.y = me.icon.translation.y + Math.round(2 * nodeSize * Math.sin(Math.atan2(x, y) - Math.PI / 2));

    var nodeID = getNodeClosestToDirection(Math.floor(theta * 180 / Math.PI));
    if (selectedNodeID < 0) {
        makeNodeBig(nodeID);
        selectedNodeID = nodeID;
    } else if (selectedNodeID != nodeID) {
        makeNodeSmall(selectedNodeID);
        makeNodeBig(nodeID);
        selectedNodeID = nodeID;
    }
    // find node closest to direction
    // if doesn't exist a node currently selected
    // connect to node
    // else
    // if different from node currently selected
    // disconnect from current node
    // select new node to connect to

};

var drawLineToNode = function(node) {

}


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
    updateMeToID(1);  // start as the first player created
};


// make travel points
var createNodes = function() {
    while (nodes.length < numNodes) {
        var x_pos = Math.random() * $(window).width();
        var y_pos = Math.random() * $(window).height();
        if (isWellSpacedPosition(x_pos, y_pos))
            createNode(nodes.length, x_pos, y_pos);
    }
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
        console.log("began touch: (" + touch.pageX + ", " + touch.pageY + ")");
        document.getElementById('x_coord_start').innerHTML = Math.floor(touch.pageX);
        document.getElementById('y_coord_start').innerHTML = Math.floor(touch.pageY);
        startTouchPoint.x = touch.pageX;
        startTouchPoint.y = touch.pageY;
        // makeMeBig();
        // showGuideLines();
    }
}, false);

obj.addEventListener('touchmove', function(event) {
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
        var touch = event.targetTouches[0];
        // location of touch
        console.log("moved touch: (" + touch.pageX + ", " + touch.pageY + ")");
        document.getElementById('x_coord_move').innerHTML = Math.floor(touch.pageX);
        document.getElementById('y_coord_move').innerHTML = Math.floor(touch.pageY);

        // update angle
        var angle = Math.atan2(startTouchPoint.y - touch.pageY, touch.pageX - startTouchPoint.x);
        angle = (Math.floor(angle * 180 / 3.14159) + 360) % 360;

        document.getElementById('angle').innerHTML = angle;

        // updateLineDirection(touch.pageX - startTouchPoint.x, startTouchPoint.y - touch.pageY);
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
        angle = (Math.floor(angle * 180 / 3.14159) + 360) % 360;

        document.getElementById('angle').innerHTML = angle;

        // choose item closest to angle to travel to
        var nodeID = getNodeClosestToDirection(angle);
        // var nodeID = Math.floor(20*Math.random());
        console.log("now at: " + nodeID + " node");
        updateMeToID(nodeID);
    }
    // makeMeSmall();
    // makePlayerSmall(selectedPlayerID);
    // hideGuideLines();
    // drawToSelectedPlayer();
}, false);