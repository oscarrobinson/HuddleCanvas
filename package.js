Package.describe({
    summary: "HuddleCanvas - allows easy use of the meteorite Huddle module to create explorable images and add layers of information"
});

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
    git: 'https://github.com/scarrobin/HuddleCanvas.git'
});