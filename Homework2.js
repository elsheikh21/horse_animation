"use strict";

var canvas, gl, program;

var projectionMatrix, modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];


// Horse related start
// Horse component ID Start
var torsoId = 0;

var headId = 1, head1Id = 1, head2Id = 10;

var leftUpperArmId = 2, leftLowerArmId = 3;

var rightUpperArmId = 4, rightLowerArmId = 5;

var leftUpperLegId = 6, leftLowerLegId = 7;

var rightUpperLegId = 8, rightLowerLegId = 9;

var tailId = 11
// Horse component ID End

// Horse component Height & Width 
var torsoHeight = 4.0, torsoWidth = 2.0;

var upperArmHeight = 2.0, upperArmWidth = 1.0;
var upperLegWidth = 1.0, upperLegHeight = 2.0;

var lowerArmHeight = 2.0, lowerArmWidth = 0.5;
var lowerLegWidth = 0.5, lowerLegHeight = 2.0;

var headHeight = 1.5, headWidth = 1.0;

var tailWidth = 3.0, tailHeight = 0.25;

// Horse component angles as per IDs assigned earlier
var theta = [-90, 90, -60, 90, -60, 90, -120, 90, -120, 45, 0, 45];

// To add to it the horse components to be drawn
var horseFig = [];
// Num horse components to be drawn
var numHorseNodes = 12;

// Horse related end

// Obstacles related start
// Obstacle component ID 
var leftPoleId = 0, horizontalPoleId = 1, rightPoleId = 2;

// Obstacle component Height & Width
var verticalPoleWidth = 0.5, verticalPoleHeight = 5.0;

var horizontalPoleWidth = 2.0, horizontalPoleHeight = 1.0;

// Obstacle component angles as per IDs assigned earlier
var obstacleAngles = [90, 0, 90];

// To add to it the obstacle components to be drawn
var obstacleFig = [];

// Num obstacle components to be drawn
var numObstacleNodes = 3;
// Obstacle related end

var stack = [];

var vBuffer;
var modelViewLoc;

var pointsArray = [];

// Animation responsible flags
var animation_flag = true, ascend = true,
    traverse_up = true, jump_flag = false;

// Animation responsible angles and their changes
var current_angle = 0, delta_angle = 1.0,
    min_angle = -45, max_angle = 60;

// Responsible for defining horse path
// starting place in x & y and ending place in x & y
var torsoX_start = -20.0, torsoX_end = 15, torsoY_start = 0.0, torsoY_end = 5.5;


// Texture size (no of cubes as per block)
var numVertices = 24, textureSize = 64, texture;

// Texture coordinates array
var texCoordsArray = [],
    texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

var c;

// checkerboard pattern with linear gradient intensity
function createCheckerBoardTexture() {
    var image = new Uint8Array(4 * textureSize * textureSize);
    for (var i = 0; i < textureSize; i++) {
        for (var j = 0; j < textureSize; j++) {
            var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0)) * 255;
            var linear_intensity = 4 * i * textureSize + 4 * j;
            image[4 * i * textureSize + 4 * j] = c * linear_intensity;
            image[4 * i * textureSize + 4 * j + 1] = c * linear_intensity;
            image[4 * i * textureSize + 4 * j + 2] = c * linear_intensity;
            image[4 * i * textureSize + 4 * j + 3] = 255;
        }
    }
    return image;
}

//-------------------------------------------
function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}
//--------------------------------------------

// Hierarchical Model building Start
function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

// This method defines the horse nodes, based on the ID passed to it
// for example the torso we want to translate it based on torsoX_start, torsoY_start
// and then rotate on both axes X & Y. All of this roto-translation will be saved
// in a 4x4 matrix hence (mat4), then we create a node for it, by passing the transform object,
// what object to render, children, and siblings
function initHorseNode(Id) {
    var m = mat4();
    switch (Id) {
        case torsoId:
            m = translate(torsoX_start, torsoY_start, 0.0);
            m = mult(m, rotate(theta[torsoId], 0, 1, 0));
            m = mult(m, rotate(theta[torsoId], 1, 0, 0));
            horseFig[torsoId] = createNode(m, torso, null, headId);
            break;

        case headId:
        case head1Id:
        case head2Id:
            m = translate(0.0, torsoHeight + 0.5 * headHeight, 0.0);
            m = mult(m, rotate(theta[head1Id], 1, 0, 0));
            m = mult(m, rotate(theta[head2Id], 0, 1, 0));
            m = mult(m, translate(0.0, -0.5 * headHeight, 0.0));
            horseFig[headId] = createNode(m, head, leftUpperArmId, null);
            break;

        case leftUpperArmId:
            m = translate(-(torsoWidth + upperArmWidth), 0.9 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
            horseFig[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);
            break;

        case rightUpperArmId:
            m = translate(torsoWidth + upperArmWidth, 0.9 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
            horseFig[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId);
            break;

        case leftUpperLegId:
            m = translate(-(torsoWidth + upperLegWidth), 0.1 * upperLegHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperLegId], 1, 0, 0));
            horseFig[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
            break;

        case rightUpperLegId:
            m = translate(torsoWidth + upperLegWidth, 0.1 * upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
            horseFig[rightUpperLegId] = createNode(m, rightUpperLeg, tailId, rightLowerLegId);
            break;

        case leftLowerArmId:
            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
            horseFig[leftLowerArmId] = createNode(m, leftLowerArm, null, null);
            break;

        case rightLowerArmId:
            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
            horseFig[rightLowerArmId] = createNode(m, rightLowerArm, null, null);
            break;

        case leftLowerLegId:
            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
            horseFig[leftLowerLegId] = createNode(m, leftLowerLeg, null, null);
            break;

        case rightLowerLegId:
            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
            horseFig[rightLowerLegId] = createNode(m, rightLowerLeg, null, null);
            break;

        case tailId:
            m = translate(-10.0, -torsoHeight * tailHeight, 1.5);
            m = mult(m, rotate(theta[tailId], 1, 0, 0));
            m = mult(m, rotate(theta[tailId], 0, 1, 0));
            horseFig[tailId] = createNode(m, tail, null, null);
            break;
    }
}

function initObstacleNode(Id) {
    var m = mat4();
    const x_com = -1.0, y_com = -4.0;
    switch (Id) {
        case leftPoleId:
            m = translate(x_com, y_com, 0.0);
            m = mult(m, rotate(obstacleAngles[leftPoleId], 0, 1, 0));
            obstacleFig[leftPoleId] = createNode(m, verticalPole, horizontalPoleId, null);
            break;

        case horizontalPoleId:
            m = translate(x_com + 2 * verticalPoleWidth, y_com + verticalPoleHeight / 2 + horizontalPoleHeight, 0.0);
            m = mult(m, rotate(obstacleAngles[horizontalPoleId], 0, 1, 0));
            m = mult(m, translate(0.0, -0.5 * headHeight, 0.0));
            obstacleFig[horizontalPoleId] = createNode(m, horizontalPole, rightPoleId, null);
            break;

        case rightPoleId:
            m = translate(x_com + horizontalPoleWidth, y_com, 0.0);
            m = mult(m, rotate(obstacleAngles[rightPoleId], 0, 1, 0));
            obstacleFig[rightPoleId] = createNode(m, verticalPole, null, null);
            break;
    }
}
// Hierarchical Model building End

function traverse(Id, figure) {
    if (Id == null) {
        return;
    }
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if (figure[Id].child != null) {
        traverse(figure[Id].child, figure);
    }
    modelViewMatrix = stack.pop();
    if (figure[Id].sibling != null) {
        traverse(figure[Id].sibling, figure);
    }
}

// Creating Horse functions start
function torso() {
    // Adding texture for horse
    var image = createCheckerBoardTexture();
    configureTexture(image);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function head() {
    // Deleting texture from head will result in deleting for all others
    gl.deleteTexture(texture);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function leftUpperArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function leftLowerArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rightUpperArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rightLowerArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function leftUpperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function leftLowerLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rightUpperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rightLowerLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function tail() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}
// Creating Horse functions End


// Creating Obstacle functions Start
function verticalPole() {
    gl.deleteTexture(texture);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * verticalPoleHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(verticalPoleWidth, verticalPoleHeight, verticalPoleWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function horizontalPole() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * horizontalPoleHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(horizontalPoleWidth, horizontalPoleHeight, horizontalPoleWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}
// Creating Obstacle functions End

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[b]);
    texCoordsArray.push(texCoord[1]);
    pointsArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vertices[d]);
    texCoordsArray.push(texCoord[3]);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function configureTexture(image) {
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureSize, textureSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function initGL(canvas) {
    try {
        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) {
            alert("WebGL isn't available");
            return;
        }
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.enable(gl.DEPTH_TEST);
    }
    catch (e) {
        console.log(e);
    }
    if (!gl) {
        alert("WebGL is not available.");
    }
}

function loadInitShaders() {
    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

function initBuffer() {
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function initTexture() {
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
}

function updateAnimationButton() {
    document.getElementById("toggle-animation").innerHTML = animation_flag ? 'Stop Animation' : 'Start Animation';
}

function setupEventListeners() {
    document.getElementById("toggle-animation").onclick = function (event) {
        animation_flag = !animation_flag;
        updateAnimationButton();
    };
}

function webGLStart() {
    // initialize the GL
    canvas = document.getElementById("gl-canvas");
    initGL(canvas);

    loadInitShaders();

    createCheckerBoardTexture();

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    colorCube();

    initBuffer();

    initTexture();

    var image = createCheckerBoardTexture();
    configureTexture(image);

    setupEventListeners();

    render();
}

function horse_walk() {
    delta_angle = Math.abs(delta_angle);
    if (ascend) {
        if (current_angle < min_angle) {
            ascend = !ascend;
        }
    } else {
        delta_angle *= -1;
        if (current_angle > max_angle) {
            ascend = !ascend;
        }
    }

    // responsible for horse joints changing
    // Handling arms angles right and left
    theta[rightUpperArmId] -= delta_angle;
    theta[rightLowerArmId] = -120 - theta[rightUpperArmId];
    theta[leftUpperArmId] += delta_angle;
    theta[leftLowerArmId] = -120 - theta[leftUpperArmId];

    // Handling legs angles right and left
    theta[rightUpperLegId] += delta_angle;
    theta[rightLowerLegId] = -60 - theta[rightUpperLegId];
    theta[leftUpperLegId] -= delta_angle;
    theta[leftLowerLegId] = -60 - theta[leftUpperLegId];

    // Changing the angle using delta angle for
    // the horse to preform the jump pattern correctly
    current_angle += -delta_angle;
}

function translate_body() {
    // this conditional is handling horse translation
    // along the x-axis. whether it is jumping or not
    if (!jump_flag) {
        // horse speed while walking
        torsoX_start += 0.05;
    }
    // if horse finishes the path, it restarts again
    // from the beginning
    if (torsoX_start > torsoX_end) {
        torsoX_start = -15.0;
    }
}

function jump() {
    // change in y axis while the horse is jumping
    var delta_height = 0.08;
    // change in x axis while the horse is jumping
    var delta_path = 0.08;

    // if the horse reaches a certain point, he performs the jump
    if (-7. < torsoX_start && torsoX_start < -6.5) {
        jump_flag = true;
    }

    if (jump_flag) {
        if (traverse_up) {
            // horse jumping part
            torsoY_start += delta_height;
            torsoX_start += delta_path;
            if (torsoY_start > torsoY_end) {
                traverse_up = !traverse_up;
            }
        } else {
            // horse landing part
            torsoY_start -= delta_height;
            torsoX_start += delta_path;
            if (torsoY_start < 0.0) {
                // horse is back on land, so deactivate traversing
                // and jumping flags
                traverse_up = !traverse_up;
                jump_flag = !jump_flag;
            }
        }
    }
}

function obstacle() {
    // Create empty nodes as per obstacle
    for (var j = 0; j < numObstacleNodes; j++) {
        obstacleFig[j] = createNode(null, null, null, null);
    }

    for (j = 0; j < numObstacleNodes; j++) {
        initObstacleNode(j);
    }
}

function horse() {
    // Create empty nodes as per horse
    for (var i = 0; i < numHorseNodes; i++) {
        horseFig[i] = createNode(null, null, null, null);
    }

    for (i = 0; i < numHorseNodes; i++) {
        initHorseNode(i);
    }
}

function handle_animation() {
    if (animation_flag) {
        if (!jump_flag) {
            horse_walk();
        }
        translate_body();
        jump();
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    obstacle();
    horse();
    handle_animation();

    traverse(torsoId, horseFig);
    traverse(leftPoleId, obstacleFig);
    requestAnimFrame(render);
}
