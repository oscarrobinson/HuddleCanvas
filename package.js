Package.describe({
  name: "huddle:canvas",
  summary: "Create explorable layers for use with Huddle",
  version: "1.3.0_1",
  git: 'https://github.com/scarrobin/HuddleCanvas.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');

  // used external packages
  api.use('jquery@1.0.0', 'client');
  api.use('mongo@1.0.4');
  api.use('huddle:client@0.9.14', 'client');

  // allow to use referenced packages
  api.imply('jquery@1.0.0', 'client');

  // export objects
  api.export('panPositionSubscription', 'client');
  api.export('HuddleCanvasCollections', 'client');
  api.export('HuddleCanvas', 'client');

  // API files
  api.addFiles('lib/hammer.js', 'client');
  api.addFiles('api/huddle:canvas.js', 'client');
  api.addFiles('api/huddle:canvas-positioncollection.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('huddle:canvas');
  api.addFiles('test/huddle:canvas-tests.js');
});
