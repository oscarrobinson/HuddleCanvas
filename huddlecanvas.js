var HuddleCanvas = (function() {
    var huddle;
    var sessionServer;
    var PanPosition;


    //Store the width and height of the canvas image
    //this is used to set width and height of the canvas div
    var imageWidth = 0;
    var imageHeight = 0;

    //area visible to camera in px, we call this the  feed
    var feedWidth = 0;
    var feedHeight = 0;

    var huddleContainerId = "huddle-canvas-container";

    //values to hold current total offset of canvas on device
    var coordX = 0;
    var coordY = 0;

    //is panning allowed at this moment?
    var panLocked = false;

    //holds whether this is the first time getting the feed info from huddle
    var firstRun = true;

    //holds huddle data for getter
    var getterData = {};

    var totalRotation = 0;

    var currentDeviceAngle = 0;
    var rotationOffset = 0;
    var rotationOffsetX = 0;
    var rotationOffsetY = 0;

    var deviceCenterToDeviceLeft = 0;
    var deviceCenterToDeviceTop = 0;



    //set default values for settings
    var settings = {
        showDebugBox: false,
        panningEnabled: true,
        imgSrcPath: "",
        layers: [],
        callbacks: []
    }

    function publicInit(computerVisionServer, computerVisionPort, huddleName, settingsParam) {
        huddle = Huddle.client(huddleName);
        if (settingsParam != undefined) {
            if (settingsParam.showDebugBox !== undefined) {
                settings.showDebugBox = settingsParam.showDebugBox;
            }
            if (settingsParam.backgroundImage !== undefined) {
                settings.imgSrcPath = settingsParam.backgroundImage;
            }
            if (settingsParam.panningEnabled !== undefined) {
                settings.panningEnabled = settingsParam.panningEnabled;
            }
            if (settingsParam.layers !== undefined) {
                for (var u = 0; u < settingsParam.layers.length; u++) {
                    settings.layers.push(settingsParam.layers[u]);
                }
            }
            if (settingsParam.callbacks !== undefined) {
                for (var u = 0; u < settingsParam.callbacks.length; u++) {
                    settings.callbacks.push(settingsParam.callbacks[u]);
                }
            }
        }
        huddle.connect(computerVisionServer, computerVisionPort);
        sessionServer = computerVisionServer + computerVisionPort;
        PanPosition = HuddleCanvasCollections.getPanPositions();
        loadCanvas();
        return this;
    }

    function publicGetHuddleSessionServer() {
        return sessionServer;
    }

    function publicGetTotalRotation() {
        return totalRotation;
    }

    function publicGetHuddleData() {
        return getterData;
    }

    function publicGetHuddleContainerId() {
        return huddleContainerId;
    }

    function publicGetOffsets() {
        return [coordX, coordY];
    }

    function publicAddLayer(layerId) {
        settings.layers.push(layerId);
    }

    function publicRemoveLayer(layerId) {
        settings.layers = jQuery.grep(settings.layers, function(value) {
            return value != layerId;
        });
    }

    function publicGetFeedSize() {
        return [feedWidth, feedHeight];
    }

    function publicPanLock() {
        panLocked = true;
    }

    function publicPanUnlock() {
        panLocked = false;
    }

    function applyAllBrowsers(element, action, parameters) {
        var browserPrefixes = [
            "-o-",
            "-webkit-",
            "-ms-",
            "",
            "-moz-"
        ];
        for (z = 0; z < browserPrefixes.length; z++) {
            $(element).css(browserPrefixes[z] + action, parameters);
        }

    }


    function publicDebugWrite(message) {
        $(document).ready(function() {
            if (document.getElementById('debug-box')) {
                document.getElementById('debug-box').innerHTML = "<p>" + message + "</p>";
            }
        });
    }

    function publicDebugAppend(message) {
        $(document).ready(function() {
            if (document.getElementById('debug-box')) {
                document.getElementById('debug-box').innerHTML += "<p>" + message + "</p>";
            }
        });
    }

    function boundAngle(input) {
        //takes an angle and makes it fit CSS angle i.e 0-180, 0- -180
        if (input > 180) {
            input = -(360 - input);
        } else if (input < -180) {
            input = (360 + input);
        }
        return input;
    }

    function getCanvasAngle() {
        //get current angle of the element
        //thanks to http://css-tricks.com/get-value-of-css-rotation-through-javascript/
        var el = document.getElementById(huddleContainerId);
        var st = window.getComputedStyle(el, null);
        //canvas.debugAppend(st);
        var tr = st.getPropertyValue("-webkit-transform") ||
            st.getPropertyValue("-moz-transform") ||
            st.getPropertyValue("-ms-transform") ||
            st.getPropertyValue("-o-transform") ||
            st.getPropertyValue("transform") ||
            "fail...";

        // rotation matrix - http://en.wikipedia.org/wiki/Rotation_matrix

        var values = tr.split('(')[1];
        values = values.split(')')[0];
        values = values.split(',');
        var a = values[0];
        var b = values[1];
        var c = values[2];
        var d = values[3];

        var scale = Math.sqrt(a * a + b * b);

        // arc tan, convert from radians to degrees, round
        var sin = b / scale;
        var existingAngle__ = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        //canvas.debugAppend(existingAngle__);
        return existingAngle__;
    }

    function loadCanvas() {
        $(document).ready(function() {


            //choose whether to show the debug box or not

            if (settings.showDebugBox) {
                $('body').prepend("<div id='debug-box'>DEBUG MESSAGES WILL APPEAR HERE</div>");
                $("#debug-box").css({
                    'height': '200px',
                    'width': '300px',
                    'padding': '5px',
                    'background-color': 'rgba(0, 0, 0, 0.2)',
                    'font-size': '12px',
                    'color': 'white',
                    'text-align': 'left',
                    'font-weight': 'bold',
                    'font-family': 'sans-serif',
                    'position': 'fixed',
                    'top': 10,
                    'left': 10,
                    'z-index': 1000,
                    'border-radius': '10px'
                });
            }


            //get the viewport size
            var windowWidth = $(window).width();
            var windowHeight = $(window).height();

            //Stores the unique mongo ID from the PanPosition collection of this session's offset values
            var sessionOffsetId = "";


            //get pixel ratio, not supported by all browsers so default to 1
            var devicePixelRatio = window.devicePixelRatio || 1.0;


            //offsets from touch panning
            var offsetX = 0;
            var offsetY = 0;

            var inPanOffsetX = 0;
            var inPanOffsetY = 0;

            //load the image we're going to use as the background so we can get its width and height
            if (settings.imgSrcPath) {
                var img = document.createElement('img');
                img.src = settings.imgSrcPath;


                //get width and height after image loaded
                img.onload = function() {
                    imageWidth = (img.width);
                    imageHeight = (img.height);


                    //set the metadata, used to scale image on retina devices
                    window.peepholeMetadata = {
                        canvasWidth: imageWidth,
                        canvasHeight: imageHeight,
                        scaleX: 1.0,
                        scaleY: 1.0
                    };
                    window.canvasScaleFactor = devicePixelRatio;

                    //Sizings following are initial, the canvases are resized to fit video feed area later

                    //set up container with correct width and height
                    $("#" + huddleContainerId).css('width', imageWidth);
                    $("#" + huddleContainerId).css('height', imageHeight);

                    //set up the div with correct width and height for image
                    var backgroundDiv = document.createElement('div');
                    backgroundDiv.id = "huddle-canvas-background";
                    document.getElementById(huddleContainerId).appendChild(backgroundDiv);
                    $("#huddle-canvas-background").css('background-repeat', 'no-repeat');
                    $("#huddle-canvas-background").css('z-index', 1);
                    $("#huddle-canvas-background").css('background-image', 'url(' + settings.imgSrcPath + ')');
                    $("#huddle-canvas-background").css('position', 'absolute');
                    $("#huddle-canvas-background").css('background-position', 'left top');
                    $("#huddle-canvas-background").css('background-size', 'contain');

                    settings.layers.push("huddle-canvas-background");

                    //get all the layers including background
                    var children = $('#' + huddleContainerId).children()

                    //set all layers to correct width/height, only show layers in the 'layers list'
                    children.css({
                        'width': imageWidth,
                        'height': imageHeight,
                        'position': 'absolute',
                        'display': function() {
                            for (c = 0; c < settings.layers.length; c++) {
                                if (settings.layers[c] === this.id || $(this).hasClass(settings.layers[c]) || this.id === "huddle-canvas-background") {
                                    return 'inline'
                                }
                            }
                            return 'none';
                        }
                    });
                }


            }

            window.canvasScaleFactor = devicePixelRatio;

            $("#" + huddleContainerId).css('position', 'fixed');

            //layout preparations, body is just size of viewport then we offset the canvases to give the illusion of movement
            $("body").css('min-height', $(window).height() + "px");
            $("body").css('position', 'relative');
            $("body").css('overflow', 'hidden');
            $("body").css('padding', '0px');



            //Called on receiving of Huddle API data to move the canvases
            function moveCanvas(id, x, y, scaleX, scaleY, rotation, ratioX, ratioY, offsetX, offsetY, inPanOffsetX, inPanOffsetY) {
                //work out some values for canvas movement
                deviceCenterToDeviceLeft = ((feedWidth / ratioX) / 2);
                deviceCenterToDeviceTop = ((feedHeight / ratioY) / 2);

                //offsetX and offsetY take into account touch panning, we need to get them from our meteor collection so it's synced across all devices in the huddle
                if (settings.panningEnabled === true) {
                    if (PanPosition) {
                        var sessionDoc = PanPosition.findOne({
                            sessionId: sessionServer
                        });

                        //if we have a document storing our PanPositions then get its id
                        if (sessionDoc) {
                            sessionOffsetId = sessionDoc._id;
                        }
                        //if we don't, create one
                        else {
                            sessionOffsetId = PanPosition.insert({
                                sessionId: sessionServer,
                                offsetX: 0,
                                offsetY: 0,
                                inPanOffsetX: 0,
                                inPanOffsetY: 0,
                                rotationOffset: 0,
                                rotationOffsetX: 0,
                                rotationOffsetY: 0
                            });

                        }

                        if (sessionOffsetId !== "") {
                            var offsets = PanPosition.findOne(sessionOffsetId);
                            if (offsets) {
                                offsetX = offsets.offsetX;
                                offsetY = offsets.offsetY;
                                inPanOffsetX = offsets.inPanOffsetX;
                                inPanOffsetY = offsets.inPanOffsetY;
                                rotationOffset = offsets.rotationOffset;
                                rotationOffsetX = offsets.rotationOffsetX;
                                rotationOffsetY = offsets.rotationOffsetY;
                            }
                        }
                    }
                }

                //setup the variables to translate our canvas
                var tx = (-1 * x * feedWidth) + offsetX + inPanOffsetX;
                var ty = (-1 * y * feedHeight) + offsetY + inPanOffsetY;

                if (deviceCenterToDeviceLeft && deviceCenterToDeviceTop) {
                    var txd = tx + deviceCenterToDeviceLeft;
                    var tyd = ty + deviceCenterToDeviceTop;
                } else {
                    var txd = tx;
                    var tyd = ty;
                }



                //scale the canvas according to the device's size (ensures e.g iphone canvas is same physical size as surface pro canvas)
                var scale = 'scale(' + scaleX + ',' + scaleY + ') ';
                applyAllBrowsers(id, 'transform', scale);

                //set the offset of the canvas so its physical position changes
                coordX = txd;
                coordY = tyd;
                $(id).css('top', tyd);
                $(id).css('left', txd);



                //Handle the rotation of the canvas
                //var existingCanvasAngle = getCanvasAngle();
                var rotationX = -tx;
                var rotationY = -ty;

                /* d3.select("#testlayer").append("circle")
                    .attr("cx", rotationX)
                    .attr("cy", rotationY)
                    .attr("r", 10)
                    .style("fill", "red");

                d3.select("#testlayer").append("circle")
                    .attr("cx", rotationOffsetX)
                    .attr("cy", rotationOffsetY)
                    .attr("r", 10)
                    .style("fill", "steelblue");

                d3.select("#testlayer").append("circle")
                    .attr("cx", $('#' + huddleContainerId).width() / 2)
                    .attr("cy", $('#' + huddleContainerId).height() / 2)
                    .attr("r", 10)
                    .style("fill", "green"); */

                var containerWidth = $('#' + huddleContainerId).width() / 2;
                var containerHeight = $('#' + huddleContainerId).height() / 2;
                //console.log("rotationX: " + rotationX + " || rotationY: " + rotationY + " || rotationOffsetX: " + rotationOffsetX + " || rotationOffsetY: " + rotationOffsetY);
                var rotate = 'translate(' + (-(containerWidth - rotationX)) + 'px,' + (-(containerHeight - rotationY)) + 'px)' +
                    'rotate(' + (-(rotation)) + 'deg)' +
                    'translate(' + (containerWidth - rotationX) + 'px,' + (containerHeight - rotationY) + 'px)' +
                    'translate(' + (-(containerWidth - rotationOffsetX)) + 'px,' + (-(containerHeight - rotationOffsetY)) + 'px)' +
                    'rotate(' + (rotationOffset) + 'deg)' +
                    'translate(' + (containerWidth - rotationOffsetX) + 'px,' + (containerHeight - rotationOffsetY) + 'px)';
                applyAllBrowsers(id, 'transform', rotate);

                //rotation offset from touch
                //existingCanvasAngle = getCanvasAngle();
                /*canvas.debugWrite("rotationOffset: " + rotationOffset);
                applyAllBrowsers(id, 'transform-origin', rotationOffsetX + 'px ' + rotationOffsetY + 'px');
                applyAllBrowsers(id, 'transform', 'rotate(' + (rotationOffset) + 'deg)');*/


            }



            //Adjusts canvas postition on receive of new device position data
            huddle.on("proximity", function(data) {

                $('#huddle-glyph-container').css('z-index', 1001);

                //Extract the raw API data
                getterData = data;
                var loc = data.Location;
                var x = loc[0];
                var y = loc[1];
                var angle = data.Orientation;
                var ratio = data.RgbImageToDisplayRatio;
                currentDeviceAngle = angle;

                totalRotation = angle + rotationOffset;
                totalRotation = boundAngle(totalRotation);
                //canvas.debugWrite(totalRotation);

                //set feed width and height
                feedWidth = ratio.X * windowWidth;
                feedHeight = ratio.Y * windowHeight;
                var feedAspectRatio = feedWidth / feedHeight;

                //set width and height of canvases to correct values
                $("#" + huddleContainerId).css('width', feedWidth);
                $("#" + huddleContainerId).css('height', feedHeight);

                $("#huddle-canvas-background").css('position', 'absolute');

                //do any callbacks passed to the canvas if first run and we have a feed size
                if (firstRun && feedWidth != 0 && feedHeight != 0) {
                    for (var cq = 0; cq < settings.callbacks.length; cq++) {
                        settings.callbacks[cq]();
                    }
                    firstRun = false;
                }


                //get all the layers including background
                var children = $('#' + huddleContainerId).children()

                //set all layers to correct width/height, only show layers in the 'layers list'
                children.css({
                    'width': feedWidth,
                    'height': feedHeight,
                    'position': 'absolute',
                    'display': function() {
                        for (c = 0; c < settings.layers.length; c++) {
                            if (settings.layers[c] === this.id || $(this).hasClass(settings.layers[c]) || this.id === "huddle-canvas-background") {
                                return 'inline'
                            }
                        }
                        return 'none';
                    }
                });

                //work out aspect ratio of our image
                var imageAspectRatio = imageWidth / imageHeight;

                //resize our image so that it fits nicely into the area explorable with huddle
                if (imageAspectRatio > feedAspectRatio) {
                    $("#huddle-canvas-background").css('background - size', feedWidth + "px auto");
                } else if (imageAspectRatio <= feedAspectRatio) {
                    $("#huddle-canvas-background").css('background - size', "auto " + feedHeight + "px");
                }


                //work out how much we'll have to scale our image
                var scaleX = ((ratio.X * windowWidth) / feedWidth);
                var scaleY = ((ratio.Y * windowHeight) / feedHeight);

                //uodate the metadata to allow proper viewing on iOS devices

                window.peepholeMetadata = {
                    //canvasWidth: feedWidth,
                    //canvasHeight: feedHeight,
                    scaleX: 1 / (ratio.X / window.canvasScaleFactor),
                    scaleY: 1 / (ratio.Y / window.canvasScaleFactor)
                };
                window.orientationDevice = angle;

                //update the canvas position
                moveCanvas("#" + huddleContainerId, x, y, scaleX, scaleY, angle, ratio.X, ratio.Y, offsetX, offsetY, inPanOffsetX, inPanOffsetY);




            });

            //---------------TOUCH DRAG STUFF---------------------
            if (settings.panningEnabled === true) {
                var hammerCanvas = document.getElementsByTagName("body")[0];
                var hammertime = new Hammer(hammerCanvas);

                hammertime.get('rotate').set({
                    enable: true
                });

                hammertime.on('pan rotate', function(ev) {
                    ev.preventDefault();

                    //we don't pan if the pan lock is on
                    if (panLocked == true) {
                        return;
                    }

                    var angle = (currentDeviceAngle * Math.PI) / 180.0;
                    var dx = ev.deltaX;
                    var dy = ev.deltaY;
                    inPanOffsetX = (Math.cos(angle) * dx) - (Math.sin(angle) * dy);
                    inPanOffsetY = (Math.sin(angle) * dx) + (Math.cos(angle) * dy);

                    ////canvas.debugWrite(ev.type);

                    if (ev.rotation && !ev.isFinal) {
                        var eventRotation = ev.rotation;
                        //console.log(ev);

                        //eventRotation = boundAngle(eventRotation);

                        //canvas.debugWrite(Math.abs(rotationOffset - eventRotation));
                        //canvas.debugAppend("rotationOffset: " + rotationOffset);
                        //canvas.debugAppend("ev.rotation: " + eventRotation);
                        //little hack to fix some of hammer's stupid bugginess
                        if ((!(Math.abs(rotationOffset - eventRotation) > 10)) || Math.abs(eventRotation) < 10 || (!(Math.abs(Math.abs(rotationOffset) - Math.abs(eventRotation)) > 10))) {
                            rotationOffset = eventRotation;
                            //canvas.debugAppend(ev.isFirst);
                        }
                        rotationOffsetX = ev.center.x + (-publicGetOffsets()[0]);
                        rotationOffsetY = ev.center.y + (-publicGetOffsets()[1]);
                        ////canvas.debugWrite(rotationOffset);
                        ////canvas.debugAppend(rotationOffsetX);
                        ////canvas.debugAppend(rotationOffsetY);

                    }


                    //do we have offsets for our session?, if not create a new doc for them
                    if (sessionOffsetId === "") {
                        var doc = PanPosition.findOne({
                            sessionId: sessionServer
                        });
                        if (!doc) {
                            sessionOffsetId = PanPosition.insert({
                                sessionId: sessionServer,
                                offsetX: 0,
                                offsetY: 0,
                                inPanOffsetX: 0,
                                inPanOffsetY: 0,
                                rotationOffset: 0,
                                rotationOffsetX: 0,
                                rotationOffsetY: 0
                            });
                        } else {
                            sessionOffsetId = doc._id;
                        }
                        //console.log(sessionOffsetId);
                    }



                    PanPosition.update(sessionOffsetId, {
                        $set: {
                            inPanOffsetX: inPanOffsetX,
                            inPanOffsetY: inPanOffsetY,
                            rotationOffset: rotationOffset,
                            rotationOffsetX: rotationOffsetX,
                            rotationOffsetY: rotationOffsetY
                        }
                    });

                    //console.log(PanPosition.findOne(sessionOffsetId));

                    if (ev.isFinal) {
                        //update our current offset to mirror others in the huddle
                        if (sessionOffsetId !== "") {
                            var offsets = PanPosition.findOne(sessionOffsetId);

                            if (offsets) {
                                offsetX = offsets.offsetX;
                                offsetY = offsets.offsetY;
                            }
                        }

                        //then add the result of our pan
                        offsetX += inPanOffsetX;
                        offsetY += inPanOffsetY;
                        inPanOffsetX = 0;
                        inPanOffsetY = 0;



                        //update our final offset and set the current panning position to 0
                        PanPosition.update(sessionOffsetId, {
                            $set: {
                                inPanOffsetX: 0,
                                inPanOffsetY: 0,
                                offsetX: offsetX,
                                offsetY: offsetY
                            }
                        })

                    }
                });
            }


            //Prevents elastic scrolling on iOS
            //stolen from https://gist.github.com/amolk/1599412
            document.body.addEventListener('touchmove', function(event) {
                //console.log(event.source);
                event.preventDefault();
            }, false);

            window.onresize = function() {
                $(document.body).width(window.innerWidth).height(window.innerHeight);
            }

            $(function() {
                window.onresize();
            });
            ///////////////////////////////////////////////
        });

    }

    return {
        create: publicInit,
        debugAppend: publicDebugAppend,
        debugWrite: publicDebugWrite,
        addLayer: publicAddLayer,
        removeLayer: publicRemoveLayer,
        getOffsets: publicGetOffsets,
        panLock: publicPanLock,
        panUnlock: publicPanUnlock,
        getFeedSize: publicGetFeedSize,
        getHuddleData: publicGetHuddleData,
        getHuddleContainerId: publicGetHuddleContainerId,
        getHuddleSessionServer: publicGetHuddleSessionServer,
        getTotalRotation: publicGetTotalRotation
    }
})();

//Make HuddleCanvas globally available
window.HuddleCanvas = HuddleCanvas;