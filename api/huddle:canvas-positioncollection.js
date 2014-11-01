PanPositionCollection = new Mongo.Collection('huddle-pan-position');

HuddleCanvasCollections = (function() {

  var getPanPositionCollection = function() {
    return PanPositionCollection;
  }

  return {
    getPanPositions: getPanPositionCollection
  };
})();

if (Meteor.isClient) {
  HuddlePanPositionSubscription = Meteor.subscribe('huddle-pan-position');
}

if (Meteor.isServer) {
  Meteor.publish('huddle-pan-position', function() {
    return PanPositionCollection.find();
  });

  PanPositionCollection.allow({
    insert: function (userId, post) {
      return true;
    },
    update: function(userId, document, fieldNames, modifier) {
      return true;
    },
    remove: function (userId, post) {
      return true;
    }
  });
}

// Meteor.methods({
//   updatePosition: function() {
//
//   },
// });
