var cboe = require('./cboe.js');

//cboe.getCSVFile('aapl');
/* cboe.getRealTimeQuote('goog', function(quoteObj){
	console.log('QuoteObj = ' + JSON.stringify(quoteObj));
}); */
cboe.parseCSVFile(function(rows) {
	console.log("PARSED ROWS = " + JSON.stringify(rows, undefined, 2));
});
