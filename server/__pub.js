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
                var rs = Async.runSync(function (done) {
                    scraper.scrape(options)
                        .then(function (result) {
                            if (result.Error) {
                                done(error, null);
                            }
                            done(null, result[0].filename);
                            //return result;
                        })
                });

                if (rs.error) {
                    throw new Meteor.Error(rs.error);
                }
                if (rs.result) {
                    return {
                        directory: tmpdir,
                        filename: tmpdir + rs.result
                    };
                }
            } catch (ex) {
                console.log(ex);
            }
        },
        sortAndGetChaptersImages: function (storyDir) {
            try {
                var fs = Npm.require('fs'),
                    path = Npm.require('path');
                var chaptersDir = path.join(storyDir, 'images');
                var indexHtml = path.join(storyDir, 'index.html');
                var contentHtml = fs.readFileSync(indexHtml, {encoding: 'utf8'});
                var rs = Async.runSync(function (done) {
                    var Xray = Meteor.npmRequire('x-ray'),
                        x = Xray();
                    x(contentHtml, ['img@src'])
                    (function (err, data) {
                        if (err) done(err, null);
                        if (data)done(null, data);
                    })
                });
                if (rs.error) {
                    console.log(rs.error);
                }
                if (rs.result) {
                    return rs.result.map(function (img) {
                        return path.join(storyDir, img);
                    })
                }
                return [];
            } catch (ex) {
                console.log(ex);
            }
        },
        postStoryToTumblr: function (storyId, images) {
            try {
                var story = Stories.findOne({storyId: storyId});
                if (Meteor.settings && Meteor.settings.private && Meteor.settings.private.Tumblr && story) {
                    var cfg = Meteor.settings.private.Tumblr;
                    var request = Meteor.npmRequire('request');
                    var fs = Npm.require('fs');
                    var oauth = {
                        consumer_key: cfg.consumer_key,
                        consumer_secret: cfg.consumer_secret,
                        token: cfg.token,
                        token_secret: cfg.token_secret
                    }

                    var blogName = cfg.blog;
                    var urlTpl = _.template('http://api.tumblr.com/v2/blog/<%=blog%>/post'),
                        url = urlTpl({blog: blogName});
                    var keywords = cfg.keywords;
                    var tags = _.shuffle(_.union(story.tags, story.artists, keywords));
                    var params = {
                        state: 'published',
                        slug: story.storyId,
                        tags: tags.join(','),
                        caption: story.title,
                        type : 'photo'
                    }

                    var rs = Async.runSync(function (done) {
                        var r = request.post({
                            url: url,
                            headers: {
                                'User-Agent': 'tumblr.js/0.0.5'
                            }
                        }, function (err, response, body) {
                            try {
                                body = JSON.parse(body);
                            } catch (e) {
                                body = {error: 'Malformed Response: ' + body};
                            }
                            requestCallback(function (err, data) {
                                if (err){
                                    console.log(err);
                                    done(err, null)
                                };
                                if (data)done(null, data);
                            })(err, response, body);
                        })

                        // Sign it with the non-data parameters
                        r.form(params);
                        r.oauth(oauth);

                        delete r.headers['content-type'];
                        delete r.body;

                        var form = r.form();
                        for (var key in params) {
                            form.append(key, params[key]);
                        }
                        if (images) {
                            if (Array.isArray(images)) {
                                for (var i = 0; i < images.length; i++) {
                                    form.append('data[' + i.toString() + ']', fs.createReadStream(images[i]));
                                }
                            } else {
                                form.append('data', fs.createReadStream(images));
                            }
                        }

                        var headers = form.getHeaders();
                        for (key in headers) {
                            r.headers[key] = headers[key];
                        }

                    });
                    if (rs.error) {
                        console.log(rs.error);
                    }
                    return rs.result;
                }
                return 'FAILED'
            } catch (ex) {
                console.log(ex);
            }
        },
        editStoryOnTumblr: function (postId, images) {
            try {
                if (Meteor.settings && Meteor.settings.private && Meteor.settings.private.Tumblr && postId) {
                    var cfg = Meteor.settings.private.Tumblr;
                    var request = Meteor.npmRequire('request');
                    var fs = Npm.require('fs');
                    var oauth = {
                        consumer_key: cfg.consumer_key,
                        consumer_secret: cfg.consumer_secret,
                        token: cfg.token,
                        token_secret: cfg.token_secret
                    }

                    var blogName = cfg.blog;
                    var urlTpl = _.template('http://api.tumblr.com/v2/blog/<%=blog%>/post/edit'),
                        url = urlTpl({blog: blogName});

                    var params = {
                        id : postId
                    }

                    var rs = Async.runSync(function (done) {
                        var r = request.post({
                            url: url,
                            headers: {
                                'User-Agent': 'tumblr.js/0.0.5'
                            }
                        }, function (err, response, body) {
                            try {
                                body = JSON.parse(body);
                            } catch (e) {
                                body = {error: 'Malformed Response: ' + body};
                            }
                            requestCallback(function (err, data) {
                                if (err){
                                    console.log(err);
                                    done(err, null)
                                };
                                if (data)done(null, data);
                            })(err, response, body);
                        })

                        // Sign it with the non-data parameters
                        r.form(params);
                        r.oauth(oauth);

                        delete r.headers['content-type'];
                        delete r.body;

                        var form = r.form();
                        for (var key in params) {
                            form.append(key, params[key]);
                        }
                        if (images) {
                            if (Array.isArray(images)) {
                                for (var i = 0; i < images.length; i++) {
                                    form.append('data[' + i.toString() + ']', fs.createReadStream(images[i]));
                                }
                            } else {
                                form.append('data', fs.createReadStream(images));
                            }
                        }

                        var headers = form.getHeaders();
                        for (key in headers) {
                            r.headers[key] = headers[key];
                        }

                    });
                    if (rs.error) {
                        console.log(rs.error);
                    }
                    return rs.result;
                }
            } catch (ex) {
                console.log(ex);
            }
        },
        postStoryToMyTumblr : function(storyId){
            var story = Stories.findOne({storyId: storyId});
            var storyDetail = Chapters.findOne({storyId : story.storyId});
            if (Meteor.settings && Meteor.settings.private && Meteor.settings.private.Tumblr && story && storyDetail) {
                var cfg = Meteor.settings.private.Tumblr;
                var tumblr = Meteor.npmRequire('tumblr.js');
                var cover = storyDetail.chapters[0];
                var oauth = {
                    consumer_key: cfg.consumer_key,
                    consumer_secret: cfg.consumer_secret,
                    token: cfg.token,
                    token_secret: cfg.token_secret
                }

                var client = tumblr.createClient(oauth);

                var blogName = cfg.blog;

                var keywords = cfg.keywords;
                var tpl = Assets.getText('ebooks/templates/2.txt'),
                    bindTpl = _.template(tpl),
                    caption = bindTpl({
                        title : story.title,
                        chapters : _.without(storyDetail.chapters, cover)
                    });
                var tags = _.shuffle(_.union(story.tags, story.artists, keywords));
                var options = {
                    state: 'published',
                    slug: story.storyId,
                    tags: tags.join(','),
                    caption: caption,
                    source : cover.img
                }

                var rs = Async.runSync(function (done) {
                    client.photo(blogName, options, function(err, data){
                        if(err){
                            done(err, null);
                        }
                        if(data){
                            done(null, data);
                        }
                    })
                });
                if (rs.error) {
                    console.log(rs.error);
                }
                return rs.result;
            }
            return 'FAILED'
        }
    })

    function requestCallback(callback) {
        if (!callback) return undefined;
        return function (err, response, body) {
            if (err) return callback(err);
            if (response.statusCode >= 400) {
                var errString = body.meta ? body.meta.msg : body.error;
                return callback(new Error('API error: ' + response.statusCode + ' ' + errString));
            }
            if (body && body.response) {
                return callback(null, body.response);
            } else {
                return callback(new Error('API error (malformed API response): ' + body));
            }
        };
    }
}