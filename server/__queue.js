if(Meteor.isServer){
    myJobs.processJobs('fetch_hitomi_by_language',function(job,cb){
        var url = job.data.url,
            isForce = job.data.isForce || false;
        var stories = Meteor.call('fetch_hitomi_by_language', url);
        _.each(stories, function(story){
            var updatedAt = new Date(),
                story = _.extend(story, {updatedAt : updatedAt}),
                newJob = null;
            if(isForce){
                Stories.upsert({storyId : story.storyId},{
                    $set : story
                });
                newJob = new Job(myJobs, 'fetch_hitomi_story_chapters', {storyId : story.storyId});
            }else{
                var isExists = Stories.findOne({storyId : story.storyId});
                if(!isExists){
                    Stories.insert(story);
                    var artists = _.map(story.artists, function(a){
                        return {
                            name : a,
                            isArtist : true
                        }
                    });
                    var tags = _.map(story.tags, function(t){
                        return {
                            name : t,
                            isArtist : false
                        }
                    });
                    tags = _.uniq(_.union(artists, tags));
                    _.each(tags, function (tag) {
                        var j = Tags.findOne({name : tag.name});
                        if(!j){
                            tag = _.extend(tag, {count : 1});
                            Tags.insert(tag)
                        }else{
                            Tags.update({_id :j._id},{
                                $inc : {count : 1}
                            })
                        }
                    });
                    newJob = new Job(myJobs, 'fetch_hitomi_story_chapters', {storyId : story.storyId});
                }
            }
            if(newJob){
                var second = _.random(60, 300); // 1 - 5 minutes;
                newJob.delay(second * 1000).save();
            }
        });
        console.log(url, ' fetch done.');
        job.done();
        cb();
    });
    myJobs.processJobs('fetch_hitomi_story_chapters',function(job,cb){
        var storyId = job.data.storyId;
        var chapters = Meteor.call('fetch_hitomi_story_chapters', storyId);
        var updatedAt = new Date();
        Chapters.upsert({storyId : storyId},{
            $set : {
                storyId : storyId,
                chapters : chapters,
                updatedAt : updatedAt
            }
        });
        console.log(storyId, 'fetch chapters done.');
        job.done();
        cb();
    })
}