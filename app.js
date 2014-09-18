var express = require('express'),
	app = express();

app.get('/hello', function(req, res) {
	res.send('Hello World!');
});

app.get('/annualizedYields', function(req, res) {

});

app.listen(8081, function(){
	console.log('Listening on port %d', this.address().port);
});
