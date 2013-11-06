/*
 *   Copyright 2013,      Uwe L. Korn <uwelk@xhochy.com>
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 */

var DeezerMetadataResolver = Tomahawk.extend(TomahawkResolver, {
    settings: {
        name: 'Deezer Metadata',
        icon: 'deezer-metadata.png',
        weight: 0, // We cannot resolve, so use minimum weight
        timeout: 15
    },

	init: function() {
        Tomahawk.reportCapabilities(TomahawkResolverCapability.UrlLookup);
	},


    resolve: function (qid, artist, album, title) {
        Tomahawk.addTrackResults({ results: [], qid: qid });
    },

	search: function (qid, searchString) {
        Tomahawk.addTrackResults({ results: [], qid: qid });
	},

    canParseUrl: function (url, type) {
        switch (type) {
        case TomahawkUrlType.Album:
            return /https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)album\//.test(url);
        case TomahawkUrlType.Artist:
            return /https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)artist\//.test(url);
        case TomahawkUrlType.Playlist:
            return /https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)playlist\//.test(url);
        case TomahawkUrlType.Track:
            return /https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)track\//.test(url);
        // case TomahawkUrlType.Any:
        default:
            return /https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)/.test(url);
        }
    },

    lookupUrl: function (url) {
		var that = this;
        var urlParts = url.split('/').filter(function (item) { return item.length != 0; }).map(decodeURIComponent);
        if (/https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)artist\//.test(url)) {
            // We have to deal with an artist
            var query = 'https://api.deezer.com/2.0/artist/' + urlParts[urlParts.length - 1];
            Tomahawk.asyncRequest(query, function (xhr) {
                var res = JSON.parse(xhr.responseText);
                Tomahawk.addUrlResult(url, {
                    type: "artist",
                    name: res.name
                });
            });
        } else if (/https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)playlist\//.test(url)) {
            // We have to deal with an album.
            var query = 'https://api.deezer.com/2.0/playlist/' + urlParts[urlParts.length - 1];
            Tomahawk.log(query);
            Tomahawk.asyncRequest(query, function (xhr) {
                var res = JSON.parse(xhr.responseText);
                var query2 = 'https://api.deezer.com/2.0/playlist/' + res.creator.id;
                Tomahawk.log(query2);
                Tomahawk.asyncRequest(query2, function (xhr2) {
                    var res2 = JSON.parse(xhr2.responseText);
                    var result = {
                        type: "playlist",
                        title: res.title,
                        guid: "deezer-playlist-" + res.id.toString(),
                        info: "A playlist by " + res2.name + " on Deezer.",
                        creator: res2.name,
                        url: res.link,
                        tracks: []
                    };
                    result.tracks = res.tracks.data.map(function (item) { return { type: "track", title: item.title, artist: item.artist.name }; });
                    Tomahawk.addUrlResult(url, result);
                });
            });
        } else if (/https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)track\//.test(url)) {
            // We have to deal with an album.
            var query = 'https://api.deezer.com/2.0/track/' + urlParts[urlParts.length - 1];
            Tomahawk.asyncRequest(query, function (xhr) {
                var res = JSON.parse(xhr.responseText);
                Tomahawk.addUrlResult(url, {
                    type: "track",
                    title: res.title,
                    artist: res.artist.name,
                });
            });
        } else if (/https?:\/\/(www\.)?deezer.com\/([^\/]*\/|)album\//.test(url)) {
            // We have to deal with an album.
            var query = 'https://api.deezer.com/2.0/album/' + urlParts[urlParts.length - 1];
            Tomahawk.asyncRequest(query, function (xhr) {
                var res = JSON.parse(xhr.responseText);
                Tomahawk.addUrlResult(url, {
                    type: "album",
                    name: res.title,
                    artist: res.artist.name,
                });
            });
        }
    }
});

Tomahawk.resolver.instance = DeezerMetadataResolver;

