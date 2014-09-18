var cboe = require('./cboe.js');

//cboe.getCSVFile('aapl');
/* cboe.getRealTimeQuote('goog', function(quoteObj){
	console.log('QuoteObj = ' + JSON.stringify(quoteObj));
}); */
cboe.getCSVFile('aapl', function(){
	cboe.parseCSVFile(function(rows) {
		cboe.getRealTimeQuote('aapl', function(quoteObj) {
			cboe.computeYields(rows, quoteObj, function(){
				console.log('DONE');
			});
		});
	});
});
