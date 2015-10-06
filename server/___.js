if (Meteor.isServer) {
    myJobs.allow({
        // Grant full permission to any authenticated user
        admin: function (userId, method, params) {
            return (userId ? true : false);
        }
    });
    Meteor.startup(function () {
        Stories._ensureIndex({href: 1});
        Chapters._ensureIndex({href: 1});

        return myJobs.startJobServer();
    })

    Meteor.publish('allJobs', function () {
        return myJobs.find({});
    });

    Meteor.methods({
        fetch_list_galleries: function (pages) {
            try {
                check(pages, [Number]);
                var galleryBaseUrl = _.template('http://g.e-hentai.org/?page=<%=page%>');
                var Xray = Meteor.npmRequire('x-ray'),
                    x = Xray();
                var rs = Async.runSync(function (DONE) {
                    async.concat(pages, function (p, cb1) {
                        var url = galleryBaseUrl({page: p});
                        x(url, 'table.itg', {
                            items: x('tr', [{
                                type: 'td img.ic@alt',
                                title: 'div.it5 a@text',
                                href: 'div.it5 a@href'
                            }])
                        })(function (err, data) {
                            if (err)console.log(err);
                            if (data && data.items) {
                                var items = [];
                                var isPass = function (i) {
                                    return Match.test(i, {
                                        type: String,
                                        title: String,
                                        href: String
                                    })
                                }
                                _.each(data.items, function (i) {
                                    if (isPass(i)) {
                                        items.push(_.extend(i, {page: p}));
                                    }
                                })
                                cb1(null, items);
                            } else {
                                cb1(null, []);
                            }
                        })
                    }, function (err, result) {
                        DONE(err, result);
                    })
                });
                return _.sortBy(rs.result, 'page');
            } catch (ex) {
                console.log(ex);
            }
        },
        fetch_story_tags: function (storyUrl) {
            try {
                check(storyUrl, String);
                var Xray = Meteor.npmRequire('x-ray'),
                    x = Xray();
                var rs = Async.runSync(function (DONE) {
                    x(storyUrl, {
                        tags: ['#taglist a@text']
                    })
                    (function (err, data) {
                        DONE(err, data);
                    })
                });
                return rs.result;
            } catch (ex) {
                console.log(ex);
            }
        },
        fetch_story_totalPages: function (storyUrl) {
            try {
                check(storyUrl, String);
                storyUrl += '?nw=always';
                var Xray = Meteor.npmRequire('x-ray'),
                    x = Xray();
                var rs = Async.runSync(function (DONE) {
                    x(storyUrl, '#gdd')
                    (function (err, data) {
                        if (err) console.log(err);
                        DONE(err, data);
                    })
                });
                if (rs && rs.result) {
                    var testRg = rs.result.match('Length:(.*)pages');
                    if (testRg) return testRg[1];
                }
                return ''
            } catch (ex) {
                console.log(ex);
            }
        },
        fetch_story_chapters: function (storyUrl) {
            try {
                check(storyUrl, String);
                var Xray = Meteor.npmRequire('x-ray'),
                    x = Xray();
                var rs = Async.runSync(function (DONE) {
                    async.waterfall([
                        function (cbChapters) {
                            x(storyUrl, ['.gdtm a@href'])
                                .paginate('table.ptt td:last-child a@href')
                            (function (err, data) {
                                if (err) console.log(err);
                                if (data) {
                                    cbChapters(null, data);
                                }
                            })
                        },
                        function (chapters, cbChapters) {
                            if (chapters) {
                                async.concat(chapters, function (chapter, cbChapter) {
                                    x(chapter, '#img@src')
                                    (function (err, data) {
                                        if (err) console.log(err);
                                        if (data) {
                                            cbChapter(null, {
                                                href: chapter,
                                                image: data
                                            });
                                        }
                                    })
                                }, function (err, result) {
                                    if (err) console.log(err);
                                    cbChapters(null, result);
                                })
                            } else {
                                cbChapters(null, []);
                            }
                        }
                    ], function (err, result) {
                        DONE(err, result);
                    })
                });
                if (rs && rs.result) {
                    return _.map(rs.result, function (i) {
                        var chapter = i.href.substr(i.href.lastIndexOf('-') + 1) || 0;
                        return _.extend(i, {chapter: chapter});
                    })
                }
                return [];
            } catch (ex) {
                console.log(ex)
            }
        },
        fetch_story_chapters2: function (storyUrl) {
            try {
                check(storyUrl, String);
                var Xray = Meteor.npmRequire('x-ray'),
                    x = Xray();
                var rs = Async.runSync(function (DONE) {
                    x(storyUrl, ['.gdtm a@href'])
                        .paginate('table.ptt td:last-child a@href')
                    (function (err, data) {
                        if (err) console.log(err);
                        if (data) {
                            DONE(null, data);
                        }
                    })
                });
                if (rs && rs.result) {
                    return _.map(rs.result, function (i) {
                        var chapter = i.substr(i.lastIndexOf('-') + 1) || 0;
                        return {
                            chapter: parseInt(chapter),
                            url: i
                        }
                    })
                }
                return [];
            } catch (ex) {
                console.log(ex)
            }
        },
        init_story: function (story) {
            var result = false;
            try {
                check(story, {
                    type: String,
                    title: String,
                    href: String
                });

                story = _.extend(story, {updatedAt: new Date});
                Stories.upsert({href: story.href}, {
                    $set: story
                });
                result = true;
            } catch (ex) {
                console.log(ex);
            }
            return result;
        },
        fetch_hitomi_by_tags: function () {
            try {
                var baseUrl = 'https://hitomi.la/';
                var rs = Async.runSync(function (DONE) {

                })
            } catch (ex) {
                console.log(ex);
            }
        },
        fetch_hitomi_by_language: function (urlLanguage) {
            try {
                var urlLanguage = urlLanguage || 'http://hitomi.la/index-english-1.html';
                var Xray = Meteor.npmRequire('x-ray'),
                    x = Xray();
                var rs = Async.runSync(function (DONE) {
                    x(urlLanguage, {
                        stories: x('.gallery-content > div', [
                            {
                                title: 'h1 a@text',
                                href: 'h1 a@href',
                                artists: x('.artist-list ul li', ['a@text']),
                                type: 'table.dj-desc tr:nth-child(2) td:nth-child(2) a@text',
                                tags: x('.relatedtags ul li', ['a@text'])
                            }
                        ])
                    })
                    (function (err, data) {
                        DONE(err, data);
                    })
                });
                if (rs.result && rs.result.stories) {
                    var stories = _.map(rs.result.stories, function (story) {
                        var tags = _.map(story.tags, function (t) {
                                return t.replaceArray(['♀', '♂'], ['', '']).trim()
                            }),
                            title = s.capitalize(story.title, true),
                            testRex = story.href.match('galleries/(.*).html'),
                            storyId = (testRex) ? testRex[1] : '';
                        return _.extend(story, {storyId: storyId, title: title, tags: _.uniq(tags)});
                    });
                    return stories;
                }
                return rs.result;
            } catch (ex) {
                console.log(ex);
            }
        },
        fetch_hitomi_story_chapters : function(url){
            try{
                var rs = Async.runSync(function(DONE){
                    var Xray = Meteor.npmRequire('x-ray'),
                        x = Xray();
                    x(url,'body',['div.img-url'])
                    (function(err, data){
                        DONE(err, data);
                    })
                });
                if(rs && rs.result){
                    var chapters = _.map(rs.result, function(c){
                        var test = c.match('galleries/(.*)/(.*).jpg');
                        return {
                            img : 'http:'+c,
                            chapter : (test) ? test[2] : ''
                        }
                    });
                    return chapters;
                }
                return rs.result;
            }catch(ex){
                console.log(ex);
            }
        }
    })
}