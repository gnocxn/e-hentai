if(Meteor.isServer){
    Meteor.publish('getStories',function(params, limit, offset){
        var params = params || {},
            limit = limit || 50,
            offset = offset || 0;
        return Stories.find(params, {limit : limit, skip : offset});
    });

    Meteor.publish('getChapter', function(storyId){
        return Chapters.find({storyId : storyId});
    })
}