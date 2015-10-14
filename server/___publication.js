if(Meteor.isServer){
    Meteor.publish('getStories',function(params, limit, offset){
        var params = params || {},
            limit = limit || 50,
            offset = offset || 0;
        return Stories.find(params, {limit : limit, skip : offset});
    });

    Meteor.publish('getStoryBysId', function(sId){
        return Stories.find({storyId : sId});
    })

    Meteor.publish('getChapters', function(storyId){
        return Chapters.find({storyId : storyId});
    })
}