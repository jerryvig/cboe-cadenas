var selenium = require('selenium-webdriver'),
	fs = require('fs'),
	BASE_URL = 'http://www.cboe.com/DelayedQuote/QuoteTableDownload.aspx',
	SLEEP_TIME = 5000;

exports.getCSVFile = function(ticker) {
	fs.unlinkSync('/usr/local/google/home/vigilj/Downloads/QuoteData.dat');
	
	var driver = new selenium.Builder().withCapabilities(selenium.Capabilities.chrome()).build();
	driver.get(BASE_URL);
	var input = driver.findElement(selenium.By.id('ctl00_ctl00_AllContent_ContentMain_QuoteTableDownloadCtl1_txtTicker'));
	input.sendKeys(ticker);
	var submit = driver.findElement(selenium.By.id('ctl00_ctl00_AllContent_ContentMain_QuoteTableDownloadCtl1_cmdSubmit'));
	submit.click();

	driver.sleep(SLEEP_TIME);
	driver.close();
};
