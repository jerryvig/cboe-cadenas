var express = require('express'),
	app = express(),
	cboe = require('./cboe.js');

app.get('/hello', function(req, res) {
	res.send('Hello World!');
});

app.get('/atmView', function(req, res) {
	if (req.query.ticker !== undefined) {
		cboe.getATMView(req.query.ticker, function(atmViewData) {
			res.send(atmViewData);
		});
	} else {
		res.send('ERROR: Query parameter "ticker" is undefined.');	
	}
});

//Mount the static files directory.
app.use(express.static(__dirname + '/static'));

app.listen(8081, function(){
	console.log('Listening on port %d', this.address().port);
});
