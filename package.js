Package.on_use(function(api) {
    api.use('jquery', 'client');
    api.imply('jquery', 'client');
    api.add_files([
        'hammer.js',
        'huddlecanvas.js'
    ], 'client');
    api.add_files([
        'positioncollection.js'
    ], ['server', 'client']);
});

Package.describe({
    summary: "allows easy use of the meteorite Huddle module to create explorable images and add layers of information",
    version: "0.6.7",
    name: "scarrobin:huddlecanvas",
    git: 'https://github.com/scarrobin/HuddleCanvas.git'
});