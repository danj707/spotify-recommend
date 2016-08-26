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
    console.log("Got first API call");
    return emitter;
};

var getRelatedFromApi = function(id) {
    var emitter2 = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + '/related-artists')
           .end(function(response) {
                if (response.ok) {
                    emitter2.emit('end', response.body);
                }
                else {
                    emitter2.emit('error', response.code);
                }
            });
    console.log("Got second API call");
    return emitter2;
};

var id;
var artist;
var related;

//GET Route
var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        artist = item.artists.items[0];
        id = item.artists.items[0].id;
    });
    
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
    
    //2nd API call
    var relatedArtist = getRelatedFromApi(id);
    console.log(relatedArtist);

    relatedArtist.on('end', function(item) {
        related = item.artists[0].name;
        console.log(related);



        //return when 2nd api call is done
        res.json(artist);

    });
    
    relatedArtist.on('error', function(code) {
        res.sendStatus(code);
    });

});


//return this after everything has ended
//        res.json(artist);

//express http listener
app.listen(process.env.PORT || 8080);