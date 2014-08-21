var HuddleCanvasCollections = (function() {
    PanPositionCollection = new Meteor.Collection('panPosition');

    var getPanPositionCollection = function() {
        return PanPositionCollection;
    }

    return {
        getPanPositions: getPanPositionCollection
    };
})();

if (Meteor.isClient) {
    Meteor.subscribe('panPosition');
    window.HuddleCanvasCollections = HuddleCanvasCollections;
}

if (Meteor.isServer) {
    Meteor.publish('panPosition', function() {
        return PanPositionCollection.find();
    });
}