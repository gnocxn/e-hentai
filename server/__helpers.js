if (Meteor.isServer) {
    Meteor.methods({
        getTotalChapters: function (storyId) {
            //console.log(storyId);
            var story = Chapters.findOne({storyId: storyId});
            return (story) ? story.chapters.length : 0;
        },
        checkAuthorizeGoogleApi: function (isGetNew) {
            var client_id = (Meteor.settings && Meteor.settings.private.google.web) ? Meteor.settings.private.google.web.client_id : null;
            try {
                check(client_id, String);
                var token = Tokens.findOne({client_id: client_id});
                var isNew = isGetNew || true;
                if (token) {
                    var rs = Async.runSync(function(done){
                        var google = Meteor.npmRequire('googleapis');
                        var OAuth2 = google.auth.OAuth2;
                        var oauth2Client = new OAuth2(token.client_id, token.client_secret, token.redirect_uris[0]);
                        if(isNew){
                            var SCOPES = (Meteor.settings && Meteor.settings.private.google.scopes) ? Meteor.settings.private.google.scopes : null;
                            var authUrl = oauth2Client.generateAuthUrl({
                                access_type: 'offline',
                                scope: SCOPES
                            });
                            console.log(authUrl);
                            done(null, authUrl);
                        }else{
                            var queryCode = (Meteor.settings && Meteor.settings.private.google.code) ? Meteor.settings.private.google.code : undefined;
                            oauth2Client.getToken(queryCode, function(err, tokens) {
                                // Now tokens contains an access_token and an optional refresh_token. Save them.
                                if(err) console.log(err);
                                if(!err) {
                                    done(null, tokens);
                                }
                            });
                        }
                    })
                    if(rs.result){
                        Tokens.update({_id : token._id},{
                            $set : {
                                tokens : rs.result
                            }
                        });
                        return true;
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
        },
        getNewOauth2Token: function (oauth2Client) {
            try {
                var SCOPES = (Meteor.settings && Meteor.settings.private.google.scopes) ? Meteor.settings.private.google.scopes : null;
                var authUrl = oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES
                });
                return authUrl;
            } catch (ex) {
                console.log(ex);
            }
        }
    });
}