var selenium = require('selenium-webdriver'),
	fs = require('fs'),
	http = require('http'),
	BASE_URL = 'http://www.cboe.com/DelayedQuote/QuoteTableDownload.aspx',
	DOWNLOAD_FILE = '/usr/local/google/home/vigilj/Downloads/QuoteData.dat',
	SLEEP_TIME = 5000;

exports.getCSVFile = function(ticker, callback) {
	/* fs.exists(DOWNLOAD_FILE, function(exists){
		if (exists) {
			fs.unlinkSync(DOWNLOAD_FILE);
		}
	}); */
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