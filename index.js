var express = require('express')
var app = express()
var request = require('request')
var mongo = require('mongodb').MongoClient
var api_key = 'AIzaSyArCjETUEFzZ7NbRdzA84VaQYFvbm-_ZGw'
var search_id = '014889246654064834622:p2ic55-hajy'
var url = 'https://www.googleapis.com/customsearch/v1?key='+api_key+'&cx='+search_id+'&searchType=image'+'&q='
const port = process.env.PORT || 4000;
const db_url = 'mongodb://localhost:27017/image-search'

console.log('App running on '+port)

app.use(express.static('app'))

//handles searches
app.get('/search/*',function(req,res){
	var offset = ''
	var offset_start = req.url.indexOf('offset=')
	if (offset_start === -1) {
		offset = 1
	}
	else {
		var i = offset_start+7
		while (!isNaN(req.url[i]) && i<req.url.length) {
			offset += req.url[i]
			i++
		}
		offset = parseInt(offset)
	}
	var search_end = (req.url.indexOf('?') > -1) ? req.url.indexOf('?') : req.url.length-1 
	var search = req.url.substr(8,search_end-8)
	if (offset < 1) {
		res.json({'error': 'Offset needs to be a positive number'})
	}
	else {
		mongo.connect(db_url, (err, db) => {
			var collection = db.collection('documents');
			collection.insert({
				'search term': search,
				'time': new Date()
			})
			db.close()
		})
		request(url+search+'&start='+offset,function(error,response,body){

			// res.json(JSON.parse(body))
			var find = JSON.parse(body)['items']
			var results = []
			for (var j=0;j<10;j++){
				var obj = {
					image_url: find[j]['link'],
					snippet: find[j]['snippet'], 
					page_url: find[j]['displayLink']
				}
				results.push(obj)
			}
			res.json(results)
		})
	}

})

//show latest searches. Need to search
app.get('/latest',function(req,res){
	mongo.connect(db_url, (err,db) => {
		var collection = db.collection('documents')
		var findings = collection
			.find(
				{},
				{'_id': 0}
			)
			.sort({'time': -1})
			.toArray(function(err,result) {
				res.send(result)
			})
		db.close()
	})
}) 



app.listen(port); 