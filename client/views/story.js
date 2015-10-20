Template.story_read.viewmodel({
    currentPage: 0,
    preloadChapters: function (i) {
        var i = i || 3;
        var start = this.currentPage();
        var end = this.currentPage() + i;
        return this.chapters().slice(start, end);
    },
    story: function () {
        var storyId = FlowRouter.getParam('storyId');
        return Stories.findOne({storyId: storyId});
    },
    chapters: function () {
        var storyId = FlowRouter.getParam('storyId');
        var storyChapter = Chapters.findOne({storyId: storyId});
        return storyChapter.chapters;
    },
    autorun: function (c) {
        if (this.story())document.title = this.story().title;
    }
}, 'chapters')