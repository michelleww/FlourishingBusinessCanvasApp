"use strict";
console.log("canvas.js");

// Global vars
let canvas;
const snapGridSize = 30;
const mainCanvasWidth = 2040;
const mainCanvasHeight = 1320;
let numberOfStickies = 0;
let stickyList = [];
const ogLeft = 173;
let currLeft = ogLeft;
const ogTop = 240;
let currTop = ogTop;
const stickyRadius = 5;
const stickyOgWidth = 100;
const stickyOgHeight = 100;
const stickyPadding = 20;

// Define colors
const fallbackBackgroundColor = 'rgb(236,232,238)';
const stickyWhite = 'rgb(255,255,255)';
const stickyPink = 'rgb(255,230,252)';
const stickyOrange = 'rgb(255,220,188)';
const stickyYellow = 'rgb(252,255,197)';
const stickyGold = 'rgb(251,254,94)';
const stickyBlue = 'rgb(204,243,255)';
const stickyOlive = 'rgb(222,225,171)';
const stickyBrown = 'rgb(252,215,193)';
const stickyPurple = 'rgb(234,233,253)';
const stickyColors = [stickyWhite, stickyPink, stickyOrange, stickyYellow, stickyGold, stickyBlue, stickyOlive, stickyBrown, stickyPurple]
const stickyShadow = 'rgba(3, 3, 3, 0.1) 0px 10px 20px';
const stickyStroke = 'rgba(100,200,200,0.1)';
const imageUrl = "https://i.imgur.com/TROjQTF.png";


// Initialize the canvas
function initialize_canvas() {
    // Check if there's an existing canvas
    if (canvas) {
        canvas.clear();
        canvas.dispose();
    }
    canvas = new fabric.Canvas('mainCanvas', {
        hoverCursor: 'pointer'
    });

    // Reset global vars
    numberOfStickies = 1;
    stickyList = [];
    setCanvasBgImg();
    currLeft = ogLeft;
    currTop = ogTop;

    // Event listeners down below
    /// updateInfoText for every changes
    canvas.on({
        'object:moving': updateInfoText,
        'object:scaling': updateInfoText,
        'object:resizing': updateInfoText,
        'object:rotating': updateInfoText,
        'object:skewing': updateInfoText
    });
    /// Snap to grid
    canvas.on('object:moving', function (e) {
        // snapToGrid(e.target);
    });
    /// Boundary Check
    canvas.on({
        // 'object:moving': checkBoudningBox,
        // 'object:scaling': checkBoudningBox,
        // 'object:resizing': checkBoudningBox,
        // 'object:rotating': checkBoudningBox,
        // 'object:skewing': checkBoudningBox
    });
    /// Pan and zoom
    canvas.on('mouse:down', function (opt) {
        const evt = opt.e;
        if (evt.ctrlKey === true) {
            this.isDragging = true;
            this.selection = false;
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
        }
    });
    canvas.on('mouse:move', function (opt) {
        if (this.isDragging) {
            const e = opt.e;
            this.viewportTransform[4] += e.clientX - this.lastPosX;
            this.viewportTransform[5] += e.clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = e.clientX;
            this.lastPosY = e.clientY;
        }
    });
    canvas.on('mouse:up', function (opt) {
        this.isDragging = false;
        this.selection = true;
        canvas.forEachObject(obj => {
            obj.selectable = true;
            obj.setCoords();
        });
    });
    canvas.on('mouse:wheel', function (opt) {
        const delta = opt.e.deltaY;
        const pointer = canvas.getPointer(opt.e);
        let zoom = canvas.getZoom();
        zoom = zoom + delta / 600;
        if (zoom > 8) zoom = 8;
        if (zoom < 0.8) zoom = 0.8;
        canvas.zoomToPoint({
            x: opt.e.offsetX,
            y: opt.e.offsetY
        }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
        canvas.renderAll()
    });
}

// Used to set / reset background image of the canvas
function setCanvasBgImg() {
    canvas.backgroundColor = fallbackBackgroundColor;
    canvas.renderTop();
    canvas.setBackgroundImage(imageUrl, canvas.renderAll.bind(canvas), {
        backgroundImageOpacity: 1,
        backgroundImageStretch: true,
        crossOrigin: 'anonymous'
    });
}

const Sticky = function () {
    this.shape = getShape();
    // this.shape.hasControls = false;
    this.stickyId = numberOfStickies;
    this.shape.on('mousedown', doubleClicked([this.shape, this.stickyId], function (obj) {
        displayEditForm(obj)
    }));
    this.shape.on('moving', function () {
        let left = this.left;
        let top = this.top;
        if (top < ogTop) top = ogTop;
        if (top > 1133 - this.height * this.scaleY) top = 1133 - this.height * this.scaleY;
        if (left < ogLeft) left = ogLeft;
        if (left > 1865 - this.width * this.scaleX) left = 1865 - this.width * this.scaleX;
        this.left = left;
        this.top = top;
        console.log(this.left + ', ' + this.top);
    })
    this.shape.on('scaling', function () {
        let width = this.width * this.scaleX;
        let height = this.height * this.scaleY;
        this.set('width', width);
        this.set('height', height);
        this.set('scaleX', 1);
        this.set('scaleY', 1);
        const stickyBg = this.item(0);
        stickyBg.set('width', width);
        stickyBg.set('height', height);
        const stickyCt = this.item(1);
        stickyCt.set('width', width - stickyPadding); //20 as padding
        stickyCt.set('height', height - stickyPadding); //20 as padding
    })
    numberOfStickies++;
}

const getBackgroundJson = function () {
    const backgroundJson = {
        left: 0,
        top: 0, // position offset the center
        originX: 'center',
        originY: 'center', // centered within the group
        fill: stickyYellow,
        shadow: stickyShadow,
        strokeWidth: 3,
        stroke: stickyStroke,
        width: stickyOgWidth,
        height: stickyOgHeight,
        rx: stickyRadius,
        ry: stickyRadius,
    };
    return backgroundJson;
}

const getContentJson = function () {
    const contentJson = {
        // content box position offset & size
        left: 0,
        top: 0, // position offset the center
        originX: 'center',
        originY: 'center',
        width: stickyOgWidth - stickyPadding,
        height: stickyOgHeight - stickyPadding,
        // font styling
        fontFamily: 'Roboto',
        fontSize: 14,
        fontWeight: 'normal', // or 'bold'
        fontStyle: 'normal', // or 'italic'
        underline: false,
        linethrough: false,
        overline: false,
        // fill: 'rgba(100,200,200,0.5)',
        // paragraph & alignment
        textAlign: 'left', // or 'center', 'right'
        lineHeight: 1.2,

        // other properties
        editable: true,
        // selectable: false
    };
    return contentJson;
}

const getStickyObjJson = function () {
    const stickyObjJson = {
        left: currLeft,
        top: currTop,
        width: stickyOgWidth,
        height: stickyOgHeight,
        // lockUniScaling: true,
        // lockScalingX: true,
        originX: 'left',
        originY: 'top'
    };
    currLeft += 10;
    currTop += 10;
    return stickyObjJson;
}

function getShape() {
    const textboxValue = $('#textInputBox').val();
    const stickyBackground = new fabric.Rect(new getBackgroundJson());
    const stickyContent = new fabric.Textbox(textboxValue, new getContentJson());
    $('#textInputBox').val("");
    const stickyObj = new fabric.Group([stickyBackground, stickyContent], new getStickyObjJson());
    const stickyCt = stickyObj.item(1);
    stickyCt.set('width', stickyObj.width - stickyPadding); //20 as padding
    stickyCt.set('height', stickyObj.height - stickyPadding); //20 as padding
    return stickyObj;
}

function createSticky() {
    const newSticky = new Sticky();
    canvas.add(newSticky.shape);
    stickyList.push(newSticky);
    createControl(newSticky);
    canvas.renderAll();
}

function removeAll() {
    initialize_canvas();
    $('#infoBarContainer').html("");
    currLeft = ogLeft;
    currTop = ogTop;
}

function removeSticky() {
    // remove sticky in canvas
    const indexToRemove = stickyList.findIndex(s => s.stickyId == this.parentNode.id.split('y')[1]);
    const stickyToRemove = stickyList.find(s => s.stickyId == this.parentNode.id.split('y')[1]).shape;
    canvas.remove(stickyToRemove);
    canvas.discardActiveObject();
    // remove stickyInfo
    document.querySelector('#infoBarContainer').removeChild(this.parentNode);
    // remove sticky in list
    stickyList.splice(indexToRemove, 1);
}

function createControl(sticky) {
    const stickyInfo = document.createElement('div');
    stickyInfo.className = 'stickyInfo';
    stickyInfo.id = 'sticky' + sticky.stickyId;
    const idText = document.createElement('span');
    idText.id = 'idText';
    idText.innerHTML = "ID: " + sticky.stickyId;

    const changeColor = document.createElement('button');
    changeColor.id = 'changeColor';
    changeColor.innerText = 'Color';
    changeColor.onclick = function () {
        sticky.shape._objects[0].set('fill', stickyColors[(stickyColors.indexOf(sticky.shape._objects[0].fill) + 1) % (stickyColors.length)])
        canvas.renderAll();
    }
    const removeBtn = document.createElement('button');
    removeBtn.id = 'removeBtn';
    removeBtn.innerText = 'Remove';
    removeBtn.onclick = removeSticky;

    stickyInfo.appendChild(idText);
    stickyInfo.appendChild(changeColor);
    stickyInfo.appendChild(removeBtn);
    document.querySelector('#infoBarContainer').appendChild(stickyInfo);
}

function updateInfoText(e) {
    for (let i = 0; i < stickyList.length; i++) {
        const shape = stickyList[i].shape;
        const id = stickyList[i].stickyId;
        const infoBarId = '#sticky' + id;
    }
}

// Serialization of the canvas

// download popup helper function
function downloadPopup(href, extension) {
    const link = document.createElement('a');
    link.href = href;
    link.download = $('#canvasTitle').text() + extension;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// toJSON
function exportJson() {
    console.log(JSON.stringify(canvas));
    const href = 'data:text/plain;charset=utf-u,' + JSON.stringify(canvas);
    downloadPopup(href, '.json');
}

// toSVG
function exportSvg() {
    const href = 'data:image/svg+xml,' + canvas.toSVG();
    downloadPopup(href, '.svg');
}

// toPNG
function exportPng() {
    const href = canvas.toDataURL("image/png");
    downloadPopup(href, '.png');
}

// toPDF
function exportPdf() {
    const imgData = canvas.toDataURL({
        format: 'jpeg',
        quality: 1
    });
    console.log(imgData)
    const pdf = new jsPDF({
        orientation: 'portrait', // or 'landscape'
        format: 'letter', // or 'a4'
    });
    pdf.addImage(imgData, 'JPEG', 0, 0);
    pdf.save($('#canvasTitle').text() + ".pdf");
}

// Deserialization of a canvas from JSON
function importJson() {
    const fileInput = document.createElement('input');
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.style = "display:none";
    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.onchange = function () {
        const importedJson = fileInput.files[0];
        const reader = new FileReader();
        if (importedJson) {
            reader.readAsText(importedJson);
        }
        if (importedJson.size > 10485760) { // > 10MB
            alert("File too large. Maximum upload size is 10MB.");
        } else {
            reader.addEventListener("load", function () {
                loadJsonToCanvas(reader.result);
            }, false);
        }
    }
    document.body.removeChild(fileInput);
}

function loadJsonToCanvas(jsonOutput) {
    canvas.loadFromJSON(jsonOutput);
}

function displayEditForm(obj) {
    console.log(obj);
    const shape = obj[0]
    const stickyId = obj[1]

    const textarea = document.createElement('textarea');
    textarea.rows = '4';
    textarea.cols = '40';
    textarea.id = 'newText';
    textarea.onkeydown = function (e) {
        let key = e.keyCode;
        if (key == '13') {
            shape.item(1).text = $('#newText').val()
            const stickyCt = shape.item(1);
            stickyCt.set('width', shape.width - stickyPadding); //20 as padding
            stickyCt.set('height', shape.height - stickyPadding); //20 as padding
            stickyCt.setCoords()
            canvas.renderAll();
            const editDiv = document.querySelector('#editDiv')
            editDiv.removeChild(editDiv.children[0]);
            editDiv.removeChild(editDiv.children[0]);
            editDiv.style.display = 'none';

        }
    }
    const editRemoveBtn = document.createElement('button');
    editRemoveBtn.id = 'editRemoveBtn';
    editRemoveBtn.innerText = 'Remove';
    editRemoveBtn.onclick = function () {
        // remove sticky in canvas
        const indexToRemove = stickyList.findIndex(s => s.stickyId == stickyId);
        const stickyToRemove = stickyList.find(s => s.stickyId == stickyId).shape;
        canvas.remove(stickyToRemove);
        canvas.discardActiveObject();
        // remove stickyInfo
        document.querySelector('#infoBarContainer').removeChild(document.querySelector('#sticky' + stickyId));
        // remove sticky in list
        stickyList.splice(indexToRemove, 1);

        const editDiv = document.querySelector('#editDiv')
        editDiv.removeChild(editDiv.children[0]);
        editDiv.removeChild(editDiv.children[0]);
        editDiv.style.display = 'none';
    };

    const editDiv = document.querySelector('#editDiv')
    if (document.querySelector('#editRemoveBtn') == undefined) {
        editDiv.appendChild(textarea);
        editDiv.appendChild(editRemoveBtn);
    }
    editDiv.style.display = 'block';

}

function doubleClicked(obj, handler) {
    return function () {
        if (obj.clicked) handler(obj);
        else {
            obj.clicked = true;
            setTimeout(function () {
                obj.clicked = false;
            }, 500);
        }
    };
};

function handleWindowResize() {
    $(".canvas-container").width($(window).width());
    $(".canvas-container").height($(window).height());
    $("canvas").width($(window).width());
    $("canvas").height($(window).height());
    $('canvas').attr('width', $(window).width());
    $('canvas').attr('height', $(window).height());
    canvas.set('width', $(window).width());
    canvas.set('height', $(window).height());
    canvas.renderAll();
}


// Used to call functions after page is fully loaded.
function main() {
    initialize_canvas();
    canvas.selection = false; // disable group selection
    handleWindowResize();
    canvas.renderAll();
}
$(window).resize(handleWindowResize);
$(document).ready(main);