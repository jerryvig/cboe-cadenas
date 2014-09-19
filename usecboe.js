var cboe = require('./cboe.js');

//cboe.getCSVFile('aapl');
/* cboe.getRealTimeQuote('goog', function(quoteObj){
	console.log('QuoteObj = ' + JSON.stringify(quoteObj));
}); */
cboe.getCSVFile('goog', function(){
	cboe.parseCSVFile(function(rows) {
		cboe.getRealTimeQuote('goog', function(quoteObj) {
			cboe.computeYields(rows, quoteObj, function(rows){
				cboe.annualizeYields(rows, function(rows){
					//console.log('rows = ' + JSON.stringify(rows, undefined, 2));
					cboe.getATMByExpiration(rows, quoteObj, function(atmByExpiry){
						console.log('atmByExpiry = ' + JSON.stringify(atmByExpiry, undefined, 2));
						console.log('quoteObj = ' + JSON.stringify(quoteObj, undefined, 2));
					});
				});
			});
		});
	});
});
