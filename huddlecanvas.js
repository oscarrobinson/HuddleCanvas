HuddleCanvas = function(computerVisionServer, computerVisionPort, huddleName, imgSrc) {


    $(function() {
        this.huddle = Huddle.client(huddleName);
        this.huddle.connect(computerVisionServer, computerVisionPort);
        sessionServer = computerVisionServer + computerVisionPort;

    });

    this.layers = [];
    imgSrcPath = imgSrc;
    PanPosition = new Meteor.Collection('panPosition');


    this.loadCanvas();
}

HuddleCanvas.prototype.loadCanvas = function() {

    $(document).ready(function() {


        /*  //choose whether to show the debug box or not
        var showDebugBox = true;

        if (showDebugBox) {
            $("#debug-box").css('display', 'inline');
        }

        //some nice helper functions for debugging
        debugWrite = function(message) {
            document.getElementById('debug-box').innerHTML = "<p>" + message + "</p>";
        }

        debugAppend = function(message) {
            document.getElementById('debug-box').innerHTML += "<p>" + message + "</p>";
        } */

        //get the viewport size
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();

        //Stores the unique mongo ID from the PanPosition collection of this session's offset values
        var sessionOffsetId = "";


        //get pixel ratio, not supported by all browsers so default to 1
        var devicePixelRatio = window.devicePixelRatio || 1.0;


        //area visible to camera in px, we call this the  feed
        var feedWidth = 0;
        var feedHeight = 0;


        //Store the width and height of the canvas image
        //this is used to set width and height of the canvas div
        var imageWidth = 0;
        var imageHeight = 0;


        //offsets from touch panning
        var offsetX = 0;
        var offsetY = 0;

        var inPanOffsetX = 0;
        var inPanOffsetY = 0;

        var currentAngle = 0;


        //load the image we're going to use as the background so we can get its width and height
        var img = document.createElement('img');
        img.src = imgSrcPath;


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
            $("#huddle-canvas-container").css('width', imageWidth);
            $("#huddle-canvas-container").css('height', imageHeight);
            $("#huddle-canvas-container").css('position', 'fixed');


            //set up the div with correct width and height for image
            var backgroundDiv = document.createElement('div');
            backgroundDiv.id = "huddle-canvas-background";
            document.getElementById('huddle-canvas-container').appendChild(backgroundDiv);
            $("#huddle-canvas-background").css('width', imageWidth);
            $("#huddle-canvas-background").css('height', imageHeight);
            $("#huddle-canvas-background").css('background-repeat', 'no-repeat');
            $("#huddle-canvas-background").css('z-index', 1);
            $("#huddle-canvas-background").css('background-image', 'url(' + imgSrcPath + ')');
            $("#huddle-canvas-background").css('position', 'absolute');
            $("#huddle-canvas-background").css('background-position', 'center');
            $("#huddle-canvas-background").css('background-size', 'contain');



            for (layer in this.layers) {
                var layerDiv = document.createElement('div');
                layerDiv.id = layer;
                $("#" + layer).css('width', imageWidth);
                $("#" + layer).css('height', imageHeight);
                $("#" + layer).css('z-index', 1000);
                $("#" + layer).css('position', 'absolute');

                document.getElementById('huddle-canavs-container').appendChild(layerDiv);

            }



        };


        //layout preparations, body is just size of viewport then we offset the canvases to give the illusion of movement
        $("body").css('min-height', $(window).height() + "px");
        $("body").css('position', 'relative');
        $("body").css('overflow', 'hidden');
        $("body").css('padding', '0px');



        //Called on receiving of Huddle API data to move the canvases
        function moveCanvas(id, x, y, scaleX, scaleY, rotation, ratioX, ratioY, offsetX, offsetY, inPanOffsetX, inPanOffsetY) {

            //work out some values for canvas movement
            var deviceCenterToDeviceLeft = ((feedWidth / ratioX) / 2);
            var deviceCenterToDeviceTop = ((feedHeight / ratioY) / 2);

            //offsetX and offsetY take into account touch panning, we need to get them from our meteor collection so it's synced across all devices in the huddle
            if (PanPosition) {
                var sessionDoc = PanPosition.findOne({
                    sessionId: sessionServer
                });
                if (sessionDoc) {
                    sessionOffsetId = sessionDoc._id;
                }

                if (sessionOffsetId !== "") {
                    var offsets = PanPosition.findOne(sessionOffsetId);
                    if (offsets) {
                        offsetX = offsets.offsetX;
                        offsetY = offsets.offsetY;
                        inPanOffsetX = offsets.inPanOffsetX;
                        inPanOffsetY = offsets.inPanOffsetY;
                    }
                }
            }

            //setup the variables to translate our canvas
            var tx = (-1 * x * feedWidth) + offsetX + inPanOffsetX;
            var ty = (-1 * y * feedHeight) + offsetY + inPanOffsetY;

            var txd = tx + deviceCenterToDeviceLeft;
            var tyd = ty + deviceCenterToDeviceTop;

            //scale the canvas according to the device's size (ensures e.g iphone canvas is same physical size as surface pro canvas)
            var scale = 'scale(' + scaleX + ',' + scaleY + ') ';
            $(id).css('-webkit-transform', scale);

            //set the offset of the canvas so its physical position changes
            $(id).css('top', tyd);
            $(id).css('left', txd);


            //Handle the rotation of the canvas
            var rotationX = -tx;
            var rotationY = -ty;
            $(id).css('-webkit-transform-origin', rotationX + 'px ' + rotationY + 'px');
            var rotate = 'rotate(' + (-rotation) + 'deg)';
            $(id).css('-webkit-transform', rotate);
        }



        //Adjusts canvas postition on receive of new device position data
        this.huddle.on("proximity", function(data) {

            //Extract the raw API data
            var loc = data.Location;
            var x = loc[0];
            var y = loc[1];
            var angle = data.Orientation;
            currentAngle = angle;
            var ratio = data.RgbImageToDisplayRatio;


            //set feed width and height
            feedWidth = ratio.X * windowWidth;
            feedHeight = ratio.Y * windowHeight;
            var feedAspectRatio = feedWidth / feedHeight;

            //set width and height of canvas to correct values
            $("#huddle-canvas-container").css('width', feedWidth);
            $("#huddle-canvas-container").css('height', feedHeight);
            $("#huddle-canvas-background").css('width', feedWidth);
            $("#huddle-canvas-background").css('height', feedHeight);

            for (layer in this.layers) {
                $("#" + layer).css('width', feedWidth);
                $("#" + layer).css('height', feedHeight);
            }


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
                canvasWidth: imageWidth,
                canvasHeight: imageHeight,
                scaleX: 1 / (ratio.X / window.canvasScaleFactor),
                scaleY: 1 / (ratio.Y / window.canvasScaleFactor)
            };
            window.orientationDevice = angle;

            //update the canvas position
            moveCanvas("#huddle-canvas-container", x, y, scaleX, scaleY, angle, ratio.X, ratio.Y, offsetX, offsetY, inPanOffsetX, inPanOffsetY);




        });

        /*   //---------------TOUCH DRAG STUFF---------------------
        var canvas = document.getElementById("huddle-canvas-container");
        var hammertime = new Hammer(canvas);

        hammertime.on('pan', function(ev) {
            //console.log(ev.direction);
            ev.preventDefault()
            //console.log(ev);
            //console.log("deltaX: " + ev.deltaX + "|| deltaY: " + ev.deltaY);
            var angle = currentAngle * Math.PI / 180.0;
            var dx = ev.deltaX;
            var dy = ev.deltaY;
            inPanOffsetX = (Math.cos(angle) * dx) - (Math.sin(angle) * dy);
            inPanOffsetY = (Math.sin(angle) * dx) + (Math.cos(angle) * dy);

            //do we have offsets for our session?, if not create a new doc for them
            if (sessionOffsetId === "") {
                var doc = PanPosition.findOne({
                    sessionId: sessionServer
                });
                if (!doc) {
                    sessionOffsetId = PanPosition.insert({
                        sessionId: sessionServer
                    });
                } else {
                    sessionOffsetId = doc._id;
                }
                //console.log(sessionOffsetId);
            }

            //update our panning position
            PanPosition.update(sessionOffsetId, {
                $set: {
                    inPanOffsetX: inPanOffsetX,
                    inPanOffsetY: inPanOffsetY
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
        /////////////////////////////////////////////// */
    });
}

HuddleCanvas.prototype.addLayer = function(layerId) {
    this.layers.push(layerId);

    var layerDiv = document.createElement('div');
    layerDiv.id = layer;
    $("#" + layer).css('width', imageWidth);
    $("#" + layer).css('height', imageHeight);
    $("#" + layer).css('z-index', 1000);
    $("#" + layer).css('position', 'absolute');

    document.getElementById('huddle-canavs-container').appendChild(layerDiv);
}

//Make HuddleCanvas globally available
window.HuddleCanvas = HuddleCanvas;