var HuddleCanvasCollections = (function() {
    PanPositionCollection = new Mongo.Collection('panPosition');

    var getPanPositionCollection = function() {
        return PanPositionCollection;
    }

    return {
        getPanPositions: getPanPositionCollection
    };
})();

if (Meteor.isClient) {
    window.panPositionSubscription = Meteor.subscribe('panPosition');
    window.HuddleCanvasCollections = HuddleCanvasCollections;
}

if (Meteor.isServer) {
    Meteor.publish('panPosition', function() {
        return PanPositionCollection.find();
    });
}