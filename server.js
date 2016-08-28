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

var id;
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
        id = item.artists.items[0].id;

        
            //second API call ///////////////////////////////
            var relatedArtist = getRelatedFromApi(id);
            
            //second .on.end handler
            relatedArtist.on('end', function(item) {
                
                //set the related artists to make the html work
                artist.related = item.artists;

                //set a counter to know when to stop and output the json 'artist' object
                var count = 0;
        
                //for loop, make multiple API calls to the 'top tracks' endpoint
                for(var i=0;i<artist.related.length;i++) {

                    //get the id# for the related artists
                    var relID = item.artists[i].id;
                    
                    //console.log("Related artists are: " + item.artists[i].name + " = " + relID);

                    //make a call to the 3rd API
                    var topTracks = getTopTracks(relID);
                    
                    //third .on.end handler
                    topTracks.on('end', function(reltracks) {
                        
                        /////////////////
                        ////LOGGING ONLY
                        ////////////////
                        //special for testing loop to log the result of the api call for each related artist
                        //for some reason, the api calls are returning in a random order, not as they are called
                        //check the node.js logs, the artist name != the track band name.  wtf, crazy.
                        for(var len=0;len<reltracks.tracks.length;len++) {
                            console.log(artist.related[count].name + ": " + count + " = " + ": " + reltracks.tracks[len].artists[0].name);    
                        }
                        //////LOGGING ONLY

                        //set the related tracks to the 
                        artist.related[count].tracks = reltracks.tracks;
                        
                        //increment the counter.  If it's the end of the 'related artists', then output the json object
                        count++;
                            if(count == artist.related.length) {
                                res.json(artist);
                            }
                    });
                }
                
                    topTracks.on('error', function(code) {
                        res.sendStatus(code);
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