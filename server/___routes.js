if(Meteor.isServer){
    Picker.route('/html/:storyId', function (params, req, res, next) {
        var html = Meteor.call('generateHTML', params.storyId);
        res.end(html);
    });

    Picker.route('/oauth2callback', function(params, req, res, next){
        if(params.query && params.query.code){
            res.end(params.query.code);
        }else{
            res.end('')
        }
    })
}