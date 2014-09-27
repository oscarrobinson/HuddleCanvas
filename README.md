HuddleCanvas
============

Huddle canvas abstracts away the complex code of canvas exploration using the [huddle meteor API](https://github.com/raedle/meteor-huddle).  This allows you to create explorable huddle canvases with multiple layers in minutes rather than hours.

To get a basic idea of what Huddle and HuddleCanvas allows you to create with a tabletop of mobile devices, look at this [demo](http://scarrobin.github.io/HuddleCanvas/#demo)

Want to look at an example of a complete, basic app using HuddleCanvas and [HuddleObject](https://github.com/jonnymanf/HuddleObject)? Try [huddle-chess](https://github.com/scarrobin/huddle-chess).

##Getting Started
To use HuddleCanvas you need [Meteor](http://www.meteor.com)<br>
`$ curl https://install.meteor.com/ | sh`

To create a project using HuddleCanvas:<br>
`$ meteor create myhuddleproject`<br>
`$ cd myhuddleproject` <br>
`$ meteor add scarrobin:huddlecanvas`

<b>NOTE:</b> the huddlecanvas package is dependent on the 'huddle' package, this is supposed to install automatically when adding huddlecanvas but for some reason it doesn't work properly when this has happened.  Therefore, to ensure your project works also do:<br>
`$ meteor add raedle:huddle`<br>

##Using HuddleCanvas - The Basics
HuddleCanvas adds its HTML code to a div with the tag `huddle-canvas-container`, so your main HTML document should look something like this:
```html
<body>
   <div id="huddle-canvas-container"></div>
</body>
```

To ensure your application works properly on all devices, also add these meta tags to the head of your document:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="painting demo">
<meta name="viewport" content="minimal-ui, width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
```

Then in the corresponding JavaScript for the page:
```javascript
if (Meteor.isClient) {
	var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName");
}

```
This creates an empty explorable canvas.

So as an example using the Huddle-Orbiter:

```javascript
var canvas = HuddleCanvas.create("huddle-orbiter.proxemicinteractions.org", 60000, "HuddleName");
```

For instructions on setting up the Huddle-Orbiter (a simulator for Huddle), go [here](https://github.com/raedle/meteor-huddle/blob/master/README.md)

##Using HuddleCanvas - Background Image

When you create a canvas, you can add a background image which the user will be able to explore.  The background image is scaled to fit the desktop area available to Huddle.  To add a background image, we pass the create() function a settings object as the last parameter:

```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	backgroundImage: "path/to/image.png"
});
```

###Tiled Background
Due to memory constraints, some mobile web browsers scale down large images to improve performance.  This can result in background images looking fuzzy and low res.  To get around this, HuddleCanvas has a mechanism to allow you to create tiled images so that your image is split into smaller chunks which are then positioned to create the large image.  This ensures your image looks sharp on all devices.

To convert your image into tiles, use [HuddleTileCreator](https://github.com/scarrobin/HuddleTileCreator), just follow the instructions in its README.

You then put the tiles into a folder named 'tiles' in the 'public' directory of your Meteor project.  Don't put them anywhere else or HuddleCanvas won't know where to find them.

Then all you need to do is turn on image tiling in your settings:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	useTiles: true
});
```



##Using HuddleCanvas - Adding Layers

An explorable image is cool but what if you want to add some information to be overlaid on the image.  Well this is where HuddleCanvas layers come in.  Adding a layer to your canvas is as simple as adding a div inside the huddle-canvas-container div and passing it to the canvas when the canvas is initialised:

```html
<div id="huddle-canvas-container">
	<div id="testlayer">
		<div id="someLayerContent">Some Text</div>
	</div>
</div>
```
to pass a layer to the canvas:
```javascript
var canvas = HuddleCanvas.create("huddle-orbiter.proxemicinteractions.org", 60000, "HuddleName", {
		layers: ["testlayer"] //you list all the div IDs of the layers you want to add here
	});
```

The testLayer div will be automatically resized by the API to fit the canvas (but bear in mind depending on its aspect ratio, your background image may not cover the whole canvas).

You can style and position any children of testLayer as you would any other element.  You can also style testLayer's appearance in any way you want (except for variables like width and height, if you change these it could cause problems).

You may find your layers aren't visible, this is probably because they are behind the background, to fix this you just need to give them a z-index in CSS that is greater than 1:
```css
#testLayer{
	z-index: 10;	
}
```


You can add as many layers as you want to your canvas and as they're simply HTML elements, you can add scripts to these elements as you normally would.  Want to make a layer with D3 visualisations? It's easy with HuddleCanvas.

You can also add and remove layers to your canvas dynamically.  You define the layers in your HTML as before but if they're not passed to the HuddleCanvas they won't be rendered.  Let's look at an example:
```html
<div id="huddle-canvas-container">
	<div id="layer1">
		...
	</div>
	<div id="layer2">
		...
	</div>
	<div id="layer3">
		...
	</div>
</div>
```
```javascript
var canvas = HuddleCanvas.create("huddle-orbiter.proxemicinteractions.org", 60000, "HuddleName", {
		layers: ["layer1"]
	});
```
Initially the canvas is only rendered with layer1 visible, to make layers 2 and 3 visible we simply do:
```javascript
canvas.addLayer("layer2");
canvas.addLayer("layer3");
```
and if we then wanted to hide layer 1 we simply do:
```javascript
canvas.removeLayer("layer1");
```

##Using HuddleCanvas - The Debug Box

As you don't have access to the JS console on mobile devices when testing with the Huddle, it's useful to be able to display debug information on screen.  That's why HuddleCanvas has this functionality built in.
To enable the Debug box, set the showDebugBox settings parameter to true when creating your canvas:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	showDebugBox: true
});
```

To add content to the debug box there are two methods, debugWrite() and debugAppend().  debugWrite overwrites the current content of the debug box with the string you pass it and debugAppend adds the string you pass to the current content in the debug box.  These functions automatically add new content as a new paragraph in the debug box.

Example: 
```javascript
canvas.debugWrite("currentPosition: "+ xPos);
canvas.debugAppend("This appears underneath");
```

##Using HuddleCanvas - Panning, Scaling and Rotating

HuddleCanvas has built in touch panning, rotating and scaling of the canvas. This is mirrored across all devices in the Huddle as if they were one large screen.  <b>This is all enabled by default.</b>  If you want to disable all this, just say so when creating your canvas:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	panningEnabled: false
});
```
You can also individually disable rotating and scaling:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	scalingEnabled: false,
	rotationEnabled: false
});
```
By default, scaling is limited to 4x zoom in and 0.4x zoom out, these parameters have been chosen as they provide best performance.  However, if you want to change them you can do so with the following settings:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	maxScale: 10,
	minScale: 0.5
});
```

Panning has been created so the canvas has some inertia (as users have come to expect from such applications).  If this is not suitable for your application, you can turn it off:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	disableFlickPan: true
});
```
The friction parameter is set to an optimal value already, however you can change it:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	friction: 0.06
});
```


##Using HuddleCanvas - Callbacks

You can pass two types of callback to HuddleCanvas, one that will be executed once when the canvas has completely loaded and one that will execute every time the canvas's position is updated.  They're simple to use as you just pass them to HuddleCanvas when you create a new instance:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
        onLoadCallback: function() {
            console.log("loaded canvas :)");
        },
        onMoveCallback: function() {
            console.log("moved canvas :)");
        }
});
```

##Settings

All the settings available to change when calling the create method are listed here along with their default values:

```javascript
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
        minScale: 0.4,
        friction: 0.05,
        disableFlickPan: false
    }
```

##Additional Functions

###Getters

####getOffsets()

Returns the current canvas offsets taking into account the panning position and device position in the huddle.

Returns an array [xOffset, yOffset]

Example of usage:
```javascript
offsets = canvas.getOffsets();
xOffset = offsets[0];
yOffset = offsets[1];
```
####getHuddleData()
Returns all data received from the Huddle API:
```javascript
var data = canvas.getHuddleData();
data.Location[0]; // x pos of device in huddle
data.Location[1]; // y pos of device in huddle
data.Orientation; //angle of device
data.RgbImageToDisplayRatio.X; //number of times device's screen fits in the huddle area horizontally
data.RgbImageToDisplayRatio.Y; //number of times device's screen fits in the huddle area vertically
```

####getFeedSize()
The size in CSS pixels of the camera feed from the HuddleCamera i.e how big the area of webpage viewable through the huddle is:
```javascript
var feedSize = canvas.getFeedSize();
feedSize[0]; //x size
feedSize[1]; //y size
```

####getTotalRotation()
Returns the current angle of the canvas rendered on the device:
```javascript
var angle = canvas.getTotalRotation();
```

###Panning

####panLock() and panUnlock()

These functions allow you to prevent touch panning of the canvas under certain conditions.  Simply lock panning to prevent touch panning then unlock panning to reenable. 

Example of usage:
```javascript
if([condition where touch panning disabled]){
	canvas.panLock();
}
else{
	canvas.panUnlock();
}
```

##License

This software is released under an MIT license

Copyright (c) 2014 Oscar Robinson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

