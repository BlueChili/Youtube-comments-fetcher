var { google } = require('googleapis'),
  youtube = google.youtube({
    auth: 'AIzaSyD6FQi95R1A0Z-AkHYMniekeWAi0FiEpU4',
    version: 'v3'
    }),
		fs = require('fs');

var initParams = {
  part: 'snippet,replies',
  videoId: process.argv[4] || 'wtLJPvx7-ys',
  pageToken: '',
  maxResults: process.argv[2] || 10,
  order: 'relevance'}

var repliesParams = {
  part: 'snippet',
  maxResults: 80,
  pageToken: '',
  parentId: ''	}

function notifier(){
  console.log(`Total top comments fetched: ${fetcher.topCommentsCounter}`);
  console.log(`Length of results array: ${fetcher.results.length}`);
  fetcher.repliesVerifier();
}

var fetcher = {
	results: [],
	saveFile: process.argv[5] || 'results.json',
	topCommentsCeiling: parseInt(process.argv[3]),
	topCommentsCounter: 0,
	repliedComments: [],

	init: async function (){
		const response = await youtube.commentThreads.list(initParams);
    initParams.pageToken = response.nextPageToken;
    response.data.items.forEach(function(item){
      fetcher.topCommentHandler(item);
    });
    if (fetcher.topCommentsCounter < fetcher.topCommentsCeiling) fetcher.init();
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
		if (fetcher.results.length === fetcher.topCommentsCeiling) {
			return notifier();
		}
	},

	repliesVerifier: function(){
		console.log('Beginning the replies fetch process');
		fetcher.results.forEach(function(item, index){
			if(item.hasOwnProperty('replies')) {
				repliesParams.parentId = item.id;
				fetcher.repliedComments.push(index);
				fetcher.repliesInit(index);
			}
		});
	},

	repliesInit: function(index){
		youtube.comments.list(repliesParams, function(err, response){
			if (response.hasOwnProperty('nextPageToken')){
				repliesParams.pageToken = response.nextPageToken;
				response.items.forEach(function(item){
					fetcher.replyHandler(item, index);
				});
				fetcher.repliesInit(index);
			}	else {
				response.data.items.forEach(function(item){
					fetcher.replyHandler(item, index);
				});
			}
		});
	},

	replyHandler: function(item, index){
		var reply = {
			id: item.id,
			kind: item.kind,
			authorChannelUrl: item.snippet.authorChannelUrl,
			authorDisplayName: item.snippet.authorDisplayName,
			authorProfileImageUrl: item.snippet.authorProfileImageUrl,
			likeCount: item.snippet.likeCount,
			parentId: item.snippet.parentId,
			publishedAt: item.snippet.publishedAt,
			updatedAt: item.snippet.updatedAt,
			textDisplay: item.snippet.textDisplay
		};
		fetcher.results[index].replies.push(reply);
	},

	fileSave: function(){
		console.log('slicing');
		var data = JSON.stringify(fetcher.results.slice(0, fetcher.topCommentsCeiling));
		console.log('slicing done');
		// fs.writeFile(fetcher.saveFile, data, function(err){
		// 	if (err) console.log(err.message);
		// 	console.log('Saving file: ' + process.argv[5]);
		// });
		fs.writeFileSync(fetcher.saveFile, data);
	}
};

console.log('Initializing fetch operation');
fetcher.init().catch( console.error );
process.on('beforeExit', function(){
	console.log('beginning file save');
	fetcher.fileSave();
	console.log('file saved');
});
