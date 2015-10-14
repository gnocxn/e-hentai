if(Meteor.isClient){
    BlazeLayout.setRoot('body');
}

FlowRouter.route('/',{
    name : 'home',
    action : function(){
        BlazeLayout.render('defaultLayout',{
            main : 'home'
        })
    }
});

FlowRouter.route('/if/:storyId',{
    name : 'iframe',
    subscriptions : function(p, q){
        this.register('myStory', Meteor.subscribe('getStoryBysId', p.storyId));
        this.register('myStoryChapters', Meteor.subscribe('getChapters', p.storyId));
    },
    action : function(){
        BlazeLayout.render('iframeLayout',{
            main : 'story_read'
        })
    }
})