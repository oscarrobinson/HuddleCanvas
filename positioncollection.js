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
    window.HuddleCanvasCollections = HuddleCanvasCollections;
}