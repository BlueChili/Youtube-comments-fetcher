var google = require('googleapis'),
		youtube = google.youtube('v3'),
		fs = require('fs');

var fetcher = {
	initParams: {
		auth: 'AIzaSyBEOcZdXu5Sz33uD2MzUgsbcnxOyRIlQt4',
		part: 'snippet,replies',
		videoId: process.argv[4] || 'wtLJPvx7-ys',
		pageToken: '',
		maxResults: process.argv[2] || 1,
		order: 'relevance'},
	repliesParams: {
		auth: 'AIzaSyBEOcZdXu5Sz33uD2MzUgsbcnxOyRIlQt4',
		part: 'snippet',
		maxResults: 80,
		pageToken: '',
		parentId: ''	},

	results: [],
	saveFile: process.argv[5] || 'results.json',
	topCommentsCeiling: parseInt(process.argv[3]),
	topCommentsCounter: 0,

	init: function (){
		youtube.commentThreads.list(fetcher.initParams, function(err, response){
			fetcher.initParams.pageToken = response.nextPageToken;
			response.items.forEach(function(item){
				fetcher.topCommentHandler(item);
			});
			if(fetcher.topCommentsCounter < fetcher.topCommentsCeiling) fetcher.init();
		});
	},

	notifier: function(){
		console.log('Total top comments fetched: ' + fetcher.topCommentsCounter);
		console.log('Length of results array: ' + fetcher.results.length);
		fetcher.fileSave();
	},

	topCommentHandler: function(item){
		fetcher.topCommentsCounter +=1;
		var topComment;
		if (item.snippet.totalReplyCount > 0 ) {
			if (item.hasOwnProperty('replies')) {
				topComment = {
					id: item.id,
					kind: item.kind,
					authorChannelUrl: item.snippet.topLevelComment.snippet.authorChannelUrl,
					authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
					authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
					likeCount: item.snippet.topLevelComment.snippet.likeCount,
					publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
					updatedAt: item.snippet.topLevelComment.snippet.updatedAt,
					textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
					totalReplyCount: item.snippet.totalReplyCount,
					replies: []};
					fetcher.results.push(topComment);
			}
		}
		else {
			topComment = {
				id: item.id,
				kind: item.kind,
				authorChannelUrl: item.snippet.topLevelComment.snippet.authorChannelUrl,
				authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
				authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
				likeCount: item.snippet.topLevelComment.snippet.likeCount,
				publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
				updatedAt: item.snippet.topLevelComment.snippet.updatedAt,
				textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
				totalReplyCount: item.snippet.totalReplyCount};
			fetcher.results.push(topComment);
		}
		if (fetcher.results.length == fetcher.topCommentsCeiling) {
			return fetcher.notifier();
		}
	},

	
	fileSave: function(){
		var data = JSON.stringify(fetcher.results);
		fs.appendFile(fetcher.saveFile, data, function(err){
			if (err) console.log(err.message);
			console.log('Saving file: ' + process.argv[5]);
		});
	}
};

fetcher.init();