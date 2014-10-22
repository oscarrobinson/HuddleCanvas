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
}
