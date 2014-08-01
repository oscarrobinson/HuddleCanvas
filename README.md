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
    $(document).ready(function() {
        var canvas = new HuddleCanvas([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", [ENABLE DEBUG?],[PATH TO YOUR CANVAS IMAGE]);
    });
}

```

This creates an explorable canvas with the image you linked to as the background.

Enable debug is a boolean, inserting true shows a debug box on screen.

So as an example using the Huddle-Orbiter

```javascript
var canvas = new HuddleCanvas("huddle-orbiter.proxemicinteractions.org", 60000, "HuddleName", false, "../../images/map_small.png");
```

For instructions on setting up the Huddle-Orbiter (a simulator for Huddle), go [here](https://github.com/raedle/meteor-huddle/blob/master/README.md)

##Using HuddleCanvas - Adding Layers

An explorable image is cool but what if you want to add some information to be overlaid on the image.  Well this is where HuddleCanvas layers come in.  Adding a layer to your canvas is as simple as adding a div inside the huddle-canvas-container div:

```html
	  <div id="huddle-canvas-container">
	  	<div id="testlayer">
	  		<div id="someLayerContent">Some Text</div>
	  	</div>
	  </div>
```

The testLayer div will be automatically resized by the API to fit the canvas (but bear in mind depending on its aspect ratio, your background image may not cover the whole canvas).

You can style and position any children of testLayer as you would any other element.  You can also style testLayer's appearance in any way you want (except for variables like width and height, if you change these it could cause problems).

You can add as many layers as you want to your canvas and as they're simply HTML elements, you can add scripts to these elements as you normally would.  Want to make a layer with D3 visualisations? It's easy with HuddleCanvas.

##Using HuddleCanvas - Background Image

In The Basics, we saw how you can create a canvas with a background image.  However, this is completely optional.  If you just want your own hardcoded layers, simply omit a background image source when creating the canvas:

```javascript
        var canvas = new HuddleCanvas([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", false);
```

##Using HuddleCanvas - The Debug Box

As you don't have access to the JS console on mobile devices when testing with the Huddle, it's useful to be able to display debug information on screen.  That's why HuddleCanvas has this functionality built in.

To enable the Debug box, set the showDebug parameter to true when initialising your HuddleCanvas:
```javascript
        var canvas = new HuddleCanvas([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", true,
        [PATH TO YOUR CANVAS IMAGE]);
```

To add content to the debug box there are two methods, debugWrite() and debugAppend().  debugWrite overwrites the current content of the debug box with the string you pass it and debugAppend adds the string you pass to the current content in the debug box.  These functions automatically add new content as a new paragraph in the debug box.

Example: 
```javascript
canvas.debugWrite("currentPosition: "+ xPos);
canvas.debugAppend("This appears underneath");
```
