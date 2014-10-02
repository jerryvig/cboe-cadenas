var express = require('express'),
	app = express(),
	cboe = require('./cboe.js');

app.get('/hello', function(req, res) {
	res.send('Hello World!');
});

app.get('/atmView', function(req, res) {
	console.log("req.query = " + JSON.stringify(req.query, undefined, 2));

	if (req.query.ticker !== undefined) {
		cboe.getATMView(req.query.ticker, function(atmViewData) {
			res.send(atmViewData);
		});
	} else {
		res.send('ERROR');	
	}
});
	
app.listen(8081, function(){
	console.log('Listening on port %d', this.address().port);
});
