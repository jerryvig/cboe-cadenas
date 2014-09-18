var cboe = require('./cboe.js');

//cboe.getCSVFile('aapl');
/* cboe.getRealTimeQuote('goog', function(quoteObj){
	console.log('QuoteObj = ' + JSON.stringify(quoteObj));
}); */
cboe.getCSVFile('aapl', function(){
	cboe.parseCSVFile(function(rows) {
		cboe.getRealTimeQuote('aapl', function(quoteObj) {
			console.log('QuoteObj = ' + JSON.stringify(quoteObj));

			for (var i=0; i<rows.length; i++) {
				if (rows[i].strikePrice >= quoteObj.quote) {
					rows[i].yield = rows[i].bid/quoteObj.quote;
				} else {
					rows[i].yield = (rows[i].bid-(quoteObj.quote-rows[i].strikePrice))/quoteObj.quote;
				}
			}

			rows.sort(function(a, b) {
				return (a.yield-b.yield);
			});
			console.log('rows = ' + JSON.stringify(rows, undefined, 2));
		});
	});
});
