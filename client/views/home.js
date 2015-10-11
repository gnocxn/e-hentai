Template.home.viewmodel({

});

Template.home.events({
    'click #btnFetch' : function(e,t){
        e.preventDefault();
        var urlTpl = _.template('http://hitomi.la/index-english-<%=page%>.html');
        for(var i = 102; i <= 202; i++){
            var url = urlTpl({page : i});
            var second = _.random(60, 300);
            var newJob = new Job(myJobs, 'fetch_hitomi_by_language', {url : url});
            newJob.delay(second * 1000).save();
            console.log(newJob._id, second);
        }
    }
})