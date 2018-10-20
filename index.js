const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const request = require('request');
var AWS = require('aws-sdk');	

// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = 'a6469f84705a4b6d9d9feff67b4ca8c6';

// You must use the same location in your REST call as you used to get your
// subscription keys. For example, if you got your subscription keys from
// westus, replace "westcentralus" in the URL below with "westus".
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';

// Request parameters.
const params = {
    'returnFaceId': 'true',
    'returnFaceLandmarks': 'false',
    'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,' +
        'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
};

var app = express();

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'));

app.use(express.json({limit: '5mb'}));
app.post('/image', (req, res) => {

	AWS.config.loadFromPath('./s3_config.json');
	var s3Bucket = new AWS.S3( { params: {Bucket: 'face-detect-testingtime'} } );

	buf = new Buffer(req.body.base64.replace(/^data:image\/png;base64,/, ""),'base64')
	var filename = "image-" + Math.random() + ".png";
	var data = {
		Key: filename, 
		Body: buf,
		ContentEncoding: 'base64',
		ContentType: 'image/png',
  		ACL: 'public-read'
	};
	s3Bucket.putObject(data, function(err, data){
	  if (err) { 
	    console.log(err);
	    console.log('Error uploading data: ', data); 
	  } else {
	  	var absoluteFileName = "https://s3.eu-central-1.amazonaws.com/face-detect-testingtime/" + filename;
		console.log('succesfully uploaded the image! ' + absoluteFileName);

		const options = {
		    uri: uriBase,
		    qs: params,
		    body: '{"url": ' + '"' + absoluteFileName + '"}',
		    headers: {
		        'Content-Type': 'application/json',
		        'Ocp-Apim-Subscription-Key' : subscriptionKey
		    }
		};

		request.post(options, (error, response, body) => {
		  if (error) {
		    console.log('Error: ', error);
		    return;
		  }
		  let responseAzure = JSON.parse(body);
		  let jsonResponse = JSON.stringify(responseAzure, null, '  ');
		  console.log('JSON Response\n');
		  console.log(jsonResponse);
		  res.send(responseAzure);
		});
	  }
	});

  });

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
