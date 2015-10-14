myJobs = JobCollection('myJobQueue');

Stories = new Meteor.Collection('stories');
Chapters = new Meteor.Collection('chapters');
Tags = new Meteor.Collection('tags');
Tokens = new Meteor.Collection('tokens');

Stories.helpers({
    getChapters : function(){
        return Chapters.findOne({storyId: this.storyId});
    }
})