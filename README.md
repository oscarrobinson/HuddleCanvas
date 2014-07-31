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

##Using HuddleCanvas
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
        var canvas = new HuddleCanvas([PATH TO YOUR HUDDLE SERVER], [PORT FOR YOUR HUDDLE SERVER], "HuddleName", [PATH TO YOUR CANVAS IMAGE]);
    });
}

```

So as an example using the Huddle-Orbiter

```javascript
var canvas = new HuddleCanvas("huddle-orbiter.proxemicinteractions.org", 60000, "HuddleName", "../../images/map_small.png");
```

For instructions on setting up the Huddle-Orbiter (a simulator for Huddle), go [here](https://github.com/raedle/meteor-huddle/blob/master/README.md)
