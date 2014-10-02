var selenium = require('selenium-webdriver'),
	fs = require('fs'),
	http = require('http'),
	BASE_URL = 'http://www.cboe.com/DelayedQuote/QuoteTableDownload.aspx',
	DOWNLOAD_FILE = '/usr/local/google/home/vigilj/Downloads/QuoteData.dat',
	SLEEP_TIME = 5000,
	ONE_SWEET_DAY = 1000*60*60*24;

exports.getCSVFile = function(ticker, callback) {
	if (fs.existsSync(DOWNLOAD_FILE)) {
		fs.unlinkSync(DOWNLOAD_FILE);
	}
	
	var driver = new selenium.Builder().withCapabilities(selenium.Capabilities.chrome()).build();
	driver.get(BASE_URL);
	var input = driver.findElement(selenium.By.id('ctl00_ctl00_AllContent_ContentMain_QuoteTableDownloadCtl1_txtTicker'));
	input.sendKeys(ticker);
	var submit = driver.findElement(selenium.By.id('ctl00_ctl00_AllContent_ContentMain_QuoteTableDownloadCtl1_cmdSubmit'));
	submit.click();

	driver.sleep(SLEEP_TIME);
	driver.close().then(function(){
		callback();
	});
};

exports.getRealTimeQuote = function(ticker, callback) {
	http.get('http://download.finance.yahoo.com/d/quotes.csv?s=' + ticker + '&f=sk1', function(res){
		res.setEncoding('utf8');
		var data = '';
		res.on('data', function(chunk){
			data = data + chunk;
		});
		res.on('end', function(){
			var parts = data.split(',');
			callback({
				ticker: parts[0].replace(/"/g, ''),
				quote: new Number(parts[1].replace(/"/g, '').split('<b>')[1].split('</b>')[0])
			});
		});
	});
};

exports.parseCSVFile = function(callback) {
	fs.readFile(DOWNLOAD_FILE, function(err, data){
		var dataString = data + '';
		var rows = dataString.split('\n');
		var parsedRows = [];
		if (rows.length > 3) {
			var exchangeRows = [];
			for (var i=3; i<rows.length; i++) {
				if (rows[i].indexOf('-E)') !== -1) {
					exchangeRows.push(rows[i]);
				}
			}

			//Parse the exchangeRows to get the info that you care about.
			//console.log('exchangeRows = ' + JSON.stringify(exchangeRows, undefined, 2));
			for (var i=0; i<exchangeRows.length; i++) {
				var rowData = {};
				var spaceParts = exchangeRows[i].split(' ');
				rowData.year = spaceParts[0];
				rowData.month = spaceParts[1];
				rowData.strikePrice = new Number(spaceParts[2]);
				var dataPart = spaceParts[3];
				var dataParts = dataPart.split(',');
				var date = dataParts[0].replace('(', '').replace(')', '');
				var dateChars = date.split('');
				var numberString = '';
				for (var j=0; j<dateChars.length; j++) {
					if (/^\d+$/.test(dateChars[j])) {
						numberString += dateChars[j];
					}
				}
				rowData.date = numberString.substr(2, 2);
				rowData.bid = new Number(dataParts[3]);
				rowData.ask = new Number(dataParts[4]);
				rowData.dateObj = new Date(rowData.date + ' ' + rowData.month + ' ' + rowData.year);
				parsedRows.push(rowData);
			}
		}

		callback(parsedRows);
	});
};

exports.computeYields = function(rows, quoteObj, callback) {
	for (var i=0; i<rows.length; i++) {
		rows[i].yield = (rows[i].strikePrice >= quoteObj.quote) ? rows[i].yield = rows[i].bid/quoteObj.quote : (rows[i].bid-(quoteObj.quote-rows[i].strikePrice))/quoteObj.quote;
	}

	rows.sort(function(a, b) {
		return (a.yield-b.yield);
	});

	callback(rows);
};

exports.annualizeYields = function(rows, callback) {
	var today = new Date();
	for (var i=0; i<rows.length; i++) {
		var diff = rows[i].dateObj - today;
		var diffDays = diff/ONE_SWEET_DAY;
		rows[i].daysToExpiration = Math.ceil(diffDays);
		rows[i].annualizedYield = (365/rows[i].daysToExpiration)*rows[i].yield;
	}

	rows.sort(function(a, b) {
		return (a.annualizedYield-b.annualizedYield);
	});

	callback(rows);
};

exports.getATMByExpiration = function(rows, quoteObj, callback) {
	var atmByExpiry = {};
	for (var i=0; i<rows.length; i++) {
		if (rows[i].strikePrice > quoteObj.quote) {
			if (atmByExpiry[rows[i].dateObj.toString()] !== undefined) {
				if (rows[i].strikePrice < atmByExpiry[rows[i].dateObj.toString()]) {
					atmByExpiry[rows[i].dateObj.toString()] = rows[i].strikePrice;
				}
			} else {
				atmByExpiry[rows[i].dateObj.toString()] = rows[i].strikePrice;
			}
		}
	}

	var atmByExpiryArray = [];
	for (var expiry in atmByExpiry) {
		atmByExpiryArray.push({
			date: expiry,
			strike: atmByExpiry[expiry]
		});
	}

	atmByExpiryArray.sort(function(a, b) {
		return (new Date(a.date) - new Date(b.date));
	});

	callback(atmByExpiryArray);
};

exports.getFITMByExpiration = function(rows, quoteObj, callback) {
	var fitmByExpiry = {};
	for (var i=0; i<rows.length; i++) {
		if (rows[i].strikePrice <= quoteObj.quote) {
			if (fitmByExpiry[rows[i].dateObj.toString()] !== undefined) {
				if (rows[i].strikePrice > fitmByExpiry[rows[i].dateObj.toString()]) {
					fitmByExpiry[rows[i].dateObj.toString()] = rows[i].strikePrice;
				}
			} else {
				fitmByExpiry[rows[i].dateObj.toString()] = rows[i].strikePrice;
			}
		}
	}

	var fitmByExpiryArray = [];
	for (var expiry in fitmByExpiry) {
		fitmByExpiryArray.push({
			date: expiry,
			strike: fitmByExpiry[expiry]
		});
	}

	fitmByExpiryArray.sort(function(a, b) {
		return (new Date(a.date) - new Date(b.date));
	});

	callback(fitmByExpiryArray);
};

exports.getATMView = function(ticker, callback) {
	exports.getCSVFile(ticker, function(){
		exports.parseCSVFile(function(rows) {
			exports.getRealTimeQuote(ticker, function(quoteObj) {
				exports.computeYields(rows, quoteObj, function(rows){
					exports.annualizeYields(rows, function(rows){
						exports.getATMByExpiration(rows, quoteObj, function(atmByExpiry){
							//console.log('atmByExpiry = ' + JSON.stringify(atmByExpiry, undefined, 2));
							
							for (var i=0; i<atmByExpiry.length; i++) {
								for (var j=0; j<rows.length; j++) {
									if (rows[j].dateObj === new Date(atmByExpiry[i].date)) {
										console.log("THE DATES MATCHED");
									}
								}
							}
						});
					});
				});
			});
		});
	});
};
