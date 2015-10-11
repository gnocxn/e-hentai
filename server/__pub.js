if (Meteor.isServer) {
    Picker.route('/html/:storyId', function (params, req, res, next) {
        var html = Meteor.call('generateHTML', params.storyId);
        res.end(html);
    });
    Meteor.methods({
        generateHTML: function (storyId) {
            var tpl = Assets.getText('ebooks/templates/1.txt'),
                bindTpl = _.template(tpl);
            var story = Stories.findOne({storyId: storyId}),
                storyChapters = Chapters.findOne({storyId: storyId});
            if (story && storyChapters) {
                var obj = {
                    title: story.title,
                    chapters: storyChapters.chapters
                }

                var output = bindTpl(obj);
                return output;
            }
            return 'not found';
        },
        saveCompleteStory: function (storyId) {
            try {
                var storyUrl = Meteor.absoluteUrl('html/' + storyId);
                var scraper = Meteor.npmRequire('website-scraper');
                var tmp = Meteor.npmRequire('tmp');
                var tmpobj = tmp.dirSync({mode: 0750, prefix: 'story_'});
                var tmpdir = tmpobj.name + '/' + storyId + '/';
                var options = {
                    urls: [{url: storyUrl, filename: 'index.html'}],
                    directory: tmpdir
                }
                var rs = Async.runSync(function(done){
                    scraper.scrape(options)
                        .then(function (result) {
                            if(result.Error){
                                done(error, null);
                            }
                            done(null, result[0].filename);
                            //return result;
                        })
                });

                if(rs.error){
                    throw new Meteor.Error(rs.error);
                }
                if(rs.result){
                    return {
                        directory : tmpdir,
                        filename : tmpdir+rs.result
                    };
                }
            } catch (ex) {
                console.log(ex);
            }
        },
        convertToPdf : function(fileObj){
            try{

            }catch(ex){
                console.log(ex);
            }
        }
    })
}