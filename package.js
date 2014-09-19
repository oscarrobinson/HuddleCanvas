Package.onUse(function(api) {
    api.use('jquery@1.0.0', 'client');
    api.use('mongo@1.0.4', ['client', 'server']);
    api.imply('jquery@1.0.0', 'client');
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
    version: "1.3.0",
    name: "scarrobin:huddlecanvas",
    git: 'https://github.com/scarrobin/HuddleCanvas.git'
});