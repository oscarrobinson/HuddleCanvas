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
    summary: "Create explorable layers for use with Huddle",
    version: "0.6.7",
    name: "scarrobin:huddlecanvas",
    git: 'https://github.com/scarrobin/HuddleCanvas.git'
});