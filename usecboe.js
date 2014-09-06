var cboe = require('./cboe.js');

//cboe.getCSVFile('aapl');
cboe.getRealTimeQuote('goog', function(quoteObj){
	console.log('QuoteObj = ' + JSON.stringify(quoteObj));
});
