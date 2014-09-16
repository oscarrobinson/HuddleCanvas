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


    //various values to hold panning, rotation and scale values
    var totalRotation = 0;

    var currentDeviceAngle = 0;
    var finalRotationOffset = 0;
    var rotationOffset = 0;
    var rotationOffsetX = 0;
    var rotationOffsetY = 0;

    var deviceCenterToDeviceLeft = 0;
    var deviceCenterToDeviceTop = 0;


    var scaleOffset = 1;
    var finalScaleOffset = 1;
    var scaleOffsetX = 0;
    var scaleOffsetY = 0;




    //set default values for settings
    var settings = {
        showDebugBox: false,
        panningEnabled: true,
        imgSrcPath: "",
        layers: [],
        onLoadCallback: function() {},
        onMoveCallback: function() {},
        scalingEnabled: true,
        rotationEnabled: true,
        useTiles: false,
        maxScale: 4,
        minScale: 0.4
    }

    //we can't load the canvas until the subscription to the position collection is ready
    //this function keeps checking until it is ready
    function checkSubscription() {
        if (window.panPositionSubscription.ready()) {
            loadCanvas()
        } else {
            setTimeout(function() {
                checkSubscription()
            }, 10);
        }
    }

    //called on HuddleCanvas.create(...)
    function publicInit(computerVisionServer, computerVisionPort, huddleName, settingsParam) {
        huddle = Huddle.client(huddleName);

        //get our settings values
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
            if (settingsParam.onLoadCallback !== undefined) {
                settings.onLoadCallback = settingsParam.onLoadCallback;
            }
            if (settingsParam.onMoveCallback !== undefined) {
                settings.onMoveCallback = settingsParam.onMoveCallback;
            }
            if (settingsParam.scalingEnabled !== undefined) {
                settings.scalingEnabled = settingsParam.scalingEnabled;
            }
            if (settingsParam.rotationEnabled !== undefined) {
                settings.rotationEnabled = settingsParam.rotationEnabled;
            }
            if (settingsParam.useTiles !== undefined) {
                settings.useTiles = settingsParam.useTiles;
            }
            if (settingsParam.maxScale !== undefined) {
                settings.maxScale = settingsParam.maxScale;
            }
            if (settingsParam.minScale !== undefined) {
                settings.minScale = settingsParam.minScale;
            }
        }

        //connect to huddle
        huddle.connect(computerVisionServer, computerVisionPort);
        //get the subscription for shared panning collection
        sessionServer = computerVisionServer + computerVisionPort;
        PanPosition = HuddleCanvasCollections.getPanPositions();
        checkSubscription();

        return this;
    }


    //various getters
    function publicGetHuddleSessionServer() {
        return sessionServer;
    }

    function publicGetHuddleData() {
        return getterData;
    }

    function publicGetTotalScale() {
        if (settings.scalingEnabled) {
            return finalScaleOffset;
        } else {
            return 1;
        }
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

    function publicGetTotalRotation() {
        if (settings.rotationEnabled) {
            return totalRotation;
        } else {
            return -currentDeviceAngle;
        }

    }

    //used to apply a css property to an element with all browser prefixes
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


    //functions returned in the HuddleCanvas object to allow writing to the debug box
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

    //takes an angle and makes it fit CSS angle i.e 0-180, 0- -180
    function boundAngle(input) {
        if (input > 180) {
            input = -(360 - input);
        } else if (input < -180) {
            input = (360 + input);
        }
        return input;
    }

    //get current angle of the element
    function getCanvasAngle() {
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

    //This is where the magic happens :)
    function loadCanvas() {
        $(document).ready(function() {


            //show debug box if it's turned on
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


            //add a touch overlay to ensure our panning works nicely
            $('#' + huddleContainerId).prepend("<div id=\"touchoverlay\" style=\"z-index:1;\"></div>");
            settings.layers.push('touchoverlay');


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

                    var tileWidth = 500;
                    var tileHeight = 500;
                    $('#huddle-canvas-background').css({
                        'width': imageWidth + 'px',
                        'height': imageHeight + 'px',
                        'z-index': 0
                    })

                    //set up the tiles if they're being used
                    if (settings.useTiles) {

                        for (var y = 0; y < imageHeight; y += tileHeight) {
                            for (var x = 0; x < imageWidth; x += tileWidth) {
                                $('#huddle-canvas-background').append('<div class="tile" id="tile-' + x + '-' + y + '"></div>')
                                $('#tile-' + x + '-' + y).css({
                                    'position': 'absolute',
                                    'top': y + 'px',
                                    'left': x + 'px',
                                    'width': tileWidth,
                                    'height': tileHeight,
                                    'background-image': 'url(\'../../tiles/tile-' + x + '-' + y + '.png\')',
                                    'background-repeat': 'no-repeat'
                                });
                            }
                        }
                    }
                    //if not just prepare conventional background
                    else {
                        $("#huddle-canvas-background").css('background-repeat', 'no-repeat');
                        $("#huddle-canvas-background").css('z-index', 0);
                        $("#huddle-canvas-background").css('background-image', 'url(' + settings.imgSrcPath + ')');
                        $("#huddle-canvas-background").css('position', 'absolute');
                        $("#huddle-canvas-background").css('background-position', 'left top');
                        $("#huddle-canvas-background").css('background-size', 'contain');

                    }

                    //finally add our background layer to the list of layers
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

                var move_offsetX = 0;
                var move_offsetY = 0;
                var move_inPanOffsetX = 0;
                var move_inPanOffsetY = 0;
                var move_rotationOffset = 0;
                var move_finalRotationOffset = 0;
                var move_rotationOffsetX = 0;
                var move_rotationOffsetY = 0;
                var move_scaleOffset = 1;
                var move_finalScaleOffset = 1;
                var move_scaleOffsetX = 0;
                var move_scaleOffsetY = 0;



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
                                finalRotationOffset: 0,
                                rotationOffsetX: 0,
                                rotationOffsetY: 0,
                                scaleOffset: 1,
                                finalScaleOffset: 1,
                                scaleOffsetX: 0,
                                scaleOffsetY: 0
                            });

                        }

                        if (sessionOffsetId !== "") {
                            var offsets = PanPosition.findOne(sessionOffsetId);
                            if (offsets) {
                                move_offsetX = offsets.offsetX;
                                move_offsetY = offsets.offsetY;
                                move_inPanOffsetX = offsets.inPanOffsetX;
                                move_inPanOffsetY = offsets.inPanOffsetY;
                                move_rotationOffset = offsets.rotationOffset;
                                move_finalRotationOffset = offsets.finalRotationOffset;
                                move_rotationOffsetX = offsets.rotationOffsetX;
                                move_rotationOffsetY = offsets.rotationOffsetY;
                                move_scaleOffset = offsets.scaleOffset;
                                move_finalScaleOffset = offsets.finalScaleOffset;
                                move_scaleOffsetX = offsets.scaleOffsetX;
                                move_scaleOffsetY = offsets.scaleOffsetY;

                                //set for getters too
                                finalScaleOffset = offsets.finalScaleOffset;
                                finalRotationOffset = offsets.finalRotationOffset;
                            }
                        }
                    }
                }

                //setup the variables to translate our canvas
                var tx = (-1 * x * feedWidth) + move_offsetX + move_inPanOffsetX;
                var ty = (-1 * y * feedHeight) + move_offsetY + move_inPanOffsetY;

                if (deviceCenterToDeviceLeft && deviceCenterToDeviceTop) {
                    var txd = tx + deviceCenterToDeviceLeft;
                    var tyd = ty + deviceCenterToDeviceTop;
                } else {
                    var txd = tx;
                    var tyd = ty;
                }


                var containerWidth = $('#' + huddleContainerId).width() / 2;
                var containerHeight = $('#' + huddleContainerId).height() / 2;


                //set the offset of the canvas so its physical position changes
                coordX = txd;
                coordY = tyd;
                $(id).css('top', tyd);
                $(id).css('left', txd);



                //Handle the rotation of the canvas
                //var existingCanvasAngle = getCanvasAngle();
                var rotationX = -tx;
                var rotationY = -ty;


                //apply correct transformation string to huddle-canvas-container according to which transformations are enabled
                if (settings.rotationEnabled && settings.scalingEnabled) {
                    var transformation =
                        'scale(' + scaleX + ',' + scaleY + ') ' +
                        'translate(' + (-(containerWidth - move_scaleOffsetX)) + 'px,' + (-(containerHeight - move_scaleOffsetY)) + 'px)' +
                        'scale(' + move_scaleOffset * move_finalScaleOffset + ',' + move_scaleOffset * move_finalScaleOffset + ')' +
                        'translate(' + ((containerWidth - move_scaleOffsetX)) + 'px,' + ((containerHeight - move_scaleOffsetY)) + 'px)' +
                        'translate(' + (-(containerWidth - rotationX)) + 'px,' + (-(containerHeight - rotationY)) + 'px)' +
                        'rotate(' + (-(rotation)) + 'deg)' +
                        'translate(' + (containerWidth - rotationX) + 'px,' + (containerHeight - rotationY) + 'px)' +
                        'translate(' + (-(containerWidth - move_rotationOffsetX)) + 'px,' + (-(containerHeight - move_rotationOffsetY)) + 'px)' +
                        'rotate(' + (move_rotationOffset + move_finalRotationOffset) + 'deg)' +
                        'translate(' + (containerWidth - move_rotationOffsetX) + 'px,' + (containerHeight - move_rotationOffsetY) + 'px)';
                    applyAllBrowsers(id, 'transform', transformation);
                } else if (settings.rotationEnabled && !settings.scalingEnabled) {
                    var transformation =
                        'scale(' + scaleX + ',' + scaleY + ') ' +
                        'translate(' + (-(containerWidth - rotationX)) + 'px,' + (-(containerHeight - rotationY)) + 'px)' +
                        'rotate(' + (-(rotation)) + 'deg)' +
                        'translate(' + (containerWidth - rotationX) + 'px,' + (containerHeight - rotationY) + 'px)' +
                        'translate(' + (-(containerWidth - move_rotationOffsetX)) + 'px,' + (-(containerHeight - move_rotationOffsetY)) + 'px)' +
                        'rotate(' + (move_rotationOffset + move_finalRotationOffset) + 'deg)' +
                        'translate(' + (containerWidth - move_rotationOffsetX) + 'px,' + (containerHeight - move_rotationOffsetY) + 'px)';
                    applyAllBrowsers(id, 'transform', transformation);
                } else if (settings.scalingEnabled && !settings.rotationEnabled) {
                    var transformation =
                        'scale(' + scaleX + ',' + scaleY + ') ' +
                        'translate(' + (-(containerWidth - move_scaleOffsetX)) + 'px,' + (-(containerHeight - move_scaleOffsetY)) + 'px)' +
                        'scale(' + move_scaleOffset * move_finalScaleOffset + ',' + move_scaleOffset * move_finalScaleOffset + ')' +
                        'translate(' + ((containerWidth - move_scaleOffsetX)) + 'px,' + ((containerHeight - move_scaleOffsetY)) + 'px)' +
                        'translate(' + (-(containerWidth - rotationX)) + 'px,' + (-(containerHeight - rotationY)) + 'px)' +
                        'rotate(' + (-(rotation)) + 'deg)' +
                        'translate(' + (containerWidth - rotationX) + 'px,' + (containerHeight - rotationY) + 'px)';
                    applyAllBrowsers(id, 'transform', transformation);
                } else {
                    var transformation =
                        'scale(' + scaleX + ',' + scaleY + ') ' +
                        'translate(' + (-(containerWidth - rotationX)) + 'px,' + (-(containerHeight - rotationY)) + 'px)' +
                        'rotate(' + (-(rotation)) + 'deg)' +
                        'translate(' + (containerWidth - rotationX) + 'px,' + (containerHeight - rotationY) + 'px)';
                    applyAllBrowsers(id, 'transform', transformation);
                }

                //do on move callback
                if (!firstRun) {
                    settings.onMoveCallback();
                }


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

                totalRotation = angle + rotationOffset + finalRotationOffset;
                totalRotation = boundAngle(totalRotation);

                //set feed width and height
                feedWidth = ratio.X * windowWidth;
                feedHeight = ratio.Y * windowHeight;

                var feedAspectRatio = feedWidth / feedHeight;

                //set width and height of canvases to correct values
                $("#" + huddleContainerId).css('width', feedWidth);
                $("#" + huddleContainerId).css('height', feedHeight);

                $("#huddle-canvas-background").css('position', 'absolute');

                //do onLoad callback if first run and we have a feed size
                if (firstRun && feedWidth != 0 && feedHeight != 0) {
                    settings.onLoadCallback();
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
                    scaleX: 1 / (ratio.X / window.canvasScaleFactor),
                    scaleY: 1 / (ratio.Y / window.canvasScaleFactor)
                };
                window.orientationDevice = angle;

                //update the canvas position
                moveCanvas("#" + huddleContainerId, x, y, scaleX, scaleY, angle, ratio.X, ratio.Y, offsetX, offsetY, inPanOffsetX, inPanOffsetY);




            });

            //---------------TOUCH DRAG STUFF---------------------
            if (settings.panningEnabled === true) {


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
                            finalRotationOffset: 0,
                            rotationOffsetX: 0,
                            rotationOffsetY: 0,
                            scaleOffset: 1,
                            finalScaleOffset: 1,
                            scaleOffsetX: 0,
                            scaleOffsetY: 0
                        });
                    } else {
                        sessionOffsetId = doc._id;
                    }
                }

                var hammerCanvas = document.getElementsByTagName("body")[0];
                var hammertime = new Hammer(hammerCanvas);

                hammertime.get('rotate').set({
                    enable: true
                });

                hammertime.get('pinch').set({
                    enable: true
                });

                hammertime.on('pan rotate pinch', function(ev) {
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

                    //handle the pinch zoom stuff
                    if (ev.type == "pinch") {
                        scaleOffset = ev.scale;

                        scaleOffsetX = ev.center.x + (-publicGetOffsets()[0])
                        scaleOffsetY = ev.center.y + (-publicGetOffsets()[1])

                        var maxScale = settings.maxScale;
                        var minScale = settings.minScale;

                        //limit the scale offsets for max and min scale
                        if (ev.srcEvent.type == "touchend") {
                            finalScaleOffset = finalScaleOffset * scaleOffset;
                            scaleOffset = 1;
                            if (finalScaleOffset > maxScale) {
                                finalScaleOffset = maxScale;
                            }
                            if (finalScaleOffset < minScale) {
                                finalScaleOffset = minScale;
                            }
                        } else {
                            if (finalScaleOffset * scaleOffset > maxScale) {
                                scaleOffset = maxScale / finalScaleOffset;
                            }
                            if (finalScaleOffset * scaleOffset < minScale) {
                                scaleOffset = minScale / finalScaleOffset;
                            }
                        }

                        //save our scale values
                        PanPosition.update(sessionOffsetId, {
                            $set: {
                                scaleOffset: scaleOffset,
                                finalScaleOffset: finalScaleOffset,
                                scaleOffsetX: scaleOffsetX,
                                scaleOffsetY: scaleOffsetY

                            }
                        });

                    }

                    if (ev.rotation) {
                        var eventRotation = ev.rotation;

                        //little hack to fix some of hammer's stupid bugginess
                        if ((!(Math.abs(rotationOffset - eventRotation) > 10)) || Math.abs(eventRotation) < 10 || (!(Math.abs(Math.abs(rotationOffset) - Math.abs(eventRotation)) > 10))) {
                            rotationOffset = eventRotation;
                        }
                        var rotation_rad = (totalRotation * Math.PI) / 180.0;
                        rotationOffsetX = ev.center.x + (-publicGetOffsets()[0]);
                        rotationOffsetY = ev.center.y + (-publicGetOffsets()[1]);


                        if (ev.srcEvent.type == "touchend" && rotationOffset != 0) {
                            finalRotationOffset += rotationOffset;
                            finalRotationOffset = boundAngle(finalRotationOffset);
                            rotationOffset = 0;
                        }

                        PanPosition.update(sessionOffsetId, {
                            $set: {
                                rotationOffset: rotationOffset,
                                finalRotationOffset: finalRotationOffset,
                                rotationOffsetX: rotationOffsetX,
                                rotationOffsetY: rotationOffsetY

                            }
                        });

                    }



                    PanPosition.update(sessionOffsetId, {
                        $set: {
                            inPanOffsetX: inPanOffsetX,
                            inPanOffsetY: inPanOffsetY,
                        }
                    });


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

    //the HuddleCanvas object with publicly accessible functions
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
        getTotalRotation: publicGetTotalRotation,
        getTotalScale: publicGetTotalScale
    }
})();

//Make HuddleCanvas globally available
window.HuddleCanvas = HuddleCanvas;