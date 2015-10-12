Template.home.viewmodel({
    currentPage : 1,
    offset : function(){
        return (this.currentPage() - 1) * 50;
    },
    stories : function(){
        var skip = this.offset();
        return Stories.find({},{limit : 50, skip : skip});
    },
    autorun : function (c) {
        this.templateInstance.subscribe('getStories', {}, 50, this.offset());
    }
},'stories');

Template.home.events({

})