if(Meteor.isServer){
    Meteor.methods({
        getTotalStories : function(){
            return Stories.find().count();
        }
    })
}