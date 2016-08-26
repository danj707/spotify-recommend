var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();
app.use(express.static('public'));

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
    console.log("Got second API call");
    return emitter;
};

//GET Route

// app.get('/search/:name', function(req, res) {
//     var searchReq = getFromApi('search', {
//         q: req.params.name,
//         limit: 1,
//         type: 'artist'
//     });

//     searchReq.on('end', function(item) {
//         var artist = item.artists.items[0];
//         res.json(artist);
//     });

//     searchReq.on('error', function(code) {
//         res.sendStatus(code);
//     });
// });

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0]; // current artist

        //when the event ends, get the artist ID and name to log
        var id = item.artists.items[0].id;
        var name = item.artists.items[0].name;
        console.log(name + " = " + id);
        
        //make get related artists API call using ID from prior API call
        var artists = getRelatedFromApi(id);
        console.log(artists);

        res.json(artist);
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

//express http listener
app.listen(process.env.PORT || 8080);