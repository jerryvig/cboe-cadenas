var selenium = require('selenium-webdriver'),
	fs = require('fs'),
	http = require('http'),
	BASE_URL = 'http://www.cboe.com/DelayedQuote/QuoteTableDownload.aspx',
	DOWNLOAD_FILE = '/usr/local/google/home/vigilj/Downloads/QuoteData.dat',
	SLEEP_TIME = 5000;

exports.getCSVFile = function(ticker) {
	fs.exists(DOWNLOAD_FILE, function(exists){
		if (exists) {
			fs.unlinkSync(DOWNLOAD_FILE);
		}
	});
	
	var driver = new selenium.Builder().withCapabilities(selenium.Capabilities.chrome()).build();
	driver.get(BASE_URL);
	var input = driver.findElement(selenium.By.id('ctl00_ctl00_AllContent_ContentMain_QuoteTableDownloadCtl1_txtTicker'));
	input.sendKeys(ticker);
	var submit = driver.findElement(selenium.By.id('ctl00_ctl00_AllContent_ContentMain_QuoteTableDownloadCtl1_cmdSubmit'));
	submit.click();

	driver.sleep(SLEEP_TIME);
	driver.close();
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
				quote: parts[1].replace(/"/g, '').split('<b>')[1].split('</b>')[0]
			});
		});
	});
};

exports.parseCSVFile = function(callback) {
	fs.readFile(DOWNLOAD_FILE, function(err, data){
		var dataString = data + '';
		var rows = dataString.split('\n');
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
				var spaceParts = exchangeRows[i].split(' ');
				var year = spaceParts[0];
				var month = spaceParts[1];
				var strikePrice = spaceParts[2];
				var dataPart = spaceParts[3];
				var dataParts = dataPart.split(',');
				console.log('date = ' + dataParts[0]);
			}
		}
	});
};