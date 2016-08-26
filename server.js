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

var id;

app.get('/search/:name', function(req, res) {
        var searchReq = getFromApi('search', {
            q: req.params.name,
            limit: 1,
            type: 'artist'
        });
    
        //end listener for first call
        searchReq.on('end', function(item) {
            var artist = item.artists.items[0];
            id = item.artists.items[0].id;
            res.json(artist);
        });

        //error listener for first call
        searchReq.on('error', function(code) {
             res.sendStatus(code);
        });
        
        //second API call request
        var artists = getRelatedFromApi(id);
        console.log(artists);

        //end listener for second call
        artists.on('end', function(item) {
             var artist = item.artists.items[0];
             artist.related = item.related;
             res.json(artist);
        });
        
        //error listener for second call
        artists.on('error', function(code) {
             res.sendStatus(code);
        });
    });

//express http listener
app.listen(process.env.PORT || 8080);