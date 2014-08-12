HuddleCanvas
============

Huddle canvas abstracts away the complex code of canvas exploration using the [huddle meteor API](https://github.com/raedle/meteor-huddle).  This allows you to create explorable huddle canvases with multiple layers in minutes rather than hours.

##Getting Started
To use HuddleCanvas you need [Meteor](http://www.meteor.com)<br>
`$ curl https://install.meteor.com/ | sh`

Then install Meteor's package manager, Meteorite<br>
`$ [sudo] npm install -g meteorite`

To create a project using HuddleCanvas:<br>
`$ meteor create myhuddleproject`<br>
`$ cd myhuddleproject` <br>
`$ mrt add huddlecanvas`

<b>NOTE:</b> the huddlecanvas package is dependent on the 'huddle' and 'hammer' packages, these are supposed to install automatically when adding huddlecanvas but for some reason they don't work properly when this has happened.  Therefore, to ensure your project works also do:<br>
`$ mrt add huddle`<br>
`$ mrt add hammer`<br>

##Using HuddleCanvas - The Basics
HuddleCanvas adds its HTML code to a div with the tag `huddle-canvas-container`, so your main HTML document should look something like this:
```html
<body>
   <div id="huddle-canvas-container"></div>
</body>
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

##Using HuddleCanvas - Background Image

When you create a canvas, you can add a background image which the user will be able to explore.  The background image is scaled to fit the desktop area available to Huddle.  To add a background image, we pass the create() function a settings object as the last parameter:

```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	backgroundImage: "path/to/image.png"
});
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

##Using HuddleCanvas - Panning

HuddleCanvas has built in touch panning of the canvas. This is mirrored across all devices in the Huddle as if they were one large screen.  <b>This is enabled by default.</b>  If you want to disable this, just say so when creating your canvas:
```javascript
var canvas = HuddleCanvas.create([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", {
	panningEnabled: false
});
```

##Settings

All the settings available to change when calling the create method are listed here along with their default values:

```javascript
{
	panningEnabled: true,
	backgroundImage: "",
	showDebugBox: false,
	layers: []
}
```

##Additional Functions

###getOffsets()

Returns the current canvas offsets taking into account the panning position and device position in the huddle.

Returns an array [xOffset, yOffset]

Example of usage:
```javascript
offsets = canvas.getOffsets();
xOffset = offsets[0];
yOffset = offsets[1];

```

###panLock() and panUnlock()

These functions allow you to prevent touch panning of the canvas under certain conditions.  Simply lock panning to prevent touch panning then unlock panning to reenable. 

Example of usage:
```javascript
if([condition where touch panning disable]){
	canvas.panLock();
}
else{
	canvas.panUnlock();
}
```

