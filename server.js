var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();
app.use(express.static('public'));
var waterfall = require('async-waterfall');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var getRelatedFromApi = function(id) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + '/related-artists')
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var getTopTracks = function(relID) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + relID + '/top-tracks?country=us')
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var srch_id;
var artist;
var related;

//GET Route
var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    //first API call
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

        //first .on.end handler///////////////////////////////
        searchReq.on('end', function(item) {
            
        //get the artists and ID for use in next call    
        artist = item.artists.items[0];
        srch_id = item.artists.items[0].id;
        
            //second API call ///////////////////////////////
            var relatedArtist = getRelatedFromApi(srch_id);
            
            //second .on.end handler
            relatedArtist.on('end', function(item) {
                
                //set the related artists to make the html work
                artist.related = item.artists;

                //set a counter to know when to stop and output the json 'artist' object
                var count = 0;
                var length = artist.related.length;
                
                artist.related.forEach(function(currentArtist) {
                    var topTracks = getTopTracks(currentArtist.id);
                    
                    topTracks.on('end',function(item) {
                        currentArtist.tracks = item.tracks;
                        console.log(count);
                        count++;
                        if(count === length) {
                            
                           res.json(artist);
                        }
    
                    });
                    topTracks.on('error',function(code) {
                        res.sendStatus(code);
                    });
                });
            });
            
            relatedArtist.on('error', function(code) {
                res.sendStatus(code);
            });
   
    });
    
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
    
});

//express http listener
app.listen(process.env.PORT || 8080);