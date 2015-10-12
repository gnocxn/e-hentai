if (Meteor.isServer) {
    myJobs.allow({
        // Grant full permission to any authenticated user
        admin: function (userId, method, params) {
            return (userId ? true : false);
        }
    });
    Meteor.startup(function () {
        Stories._ensureIndex({href: 1, storyId: 1});
        Chapters._ensureIndex({"chapters.no": 1, storyId: 1});
        Tags._ensureIndex({name: 1});

        var webToken = (Meteor.settings && Meteor.settings.private.google.web) ? Meteor.settings.private.google.web : null;
        if (Tokens.find().count() === 0 && webToken) {
            webToken = _.extend(webToken, {updatedAt : new Date});
            Tokens.upsert({client_id : webToken.client_id},{
                $set : webToken
            });
        }

        return myJobs.startJobServer();
    })

    Meteor.publish('allJobs', function () {
        return myJobs.find({});
    });
}

