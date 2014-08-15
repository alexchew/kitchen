var page = require('webpage').create();
var fs = require('fs');
var url = "http://127.0.0.1:8080/task";
var group = "NA";
var timeoutMillis = 3000;
var isDebug = false;


//check parameters
if (phantom.args.length === 0) {
	console.log('Usage: getTask.js group [url] ');
	phantom.exit();
}else if(phantom.args.length === 1){
	group = phantom.args[0];
	if(isDebug)console.log('Start get task info.\n[group]'+group+'\n[url]'+url);
}else if(phantom.args.length === 2){
	group = phantom.args[0];
	url = phantom.args[1];
	if(isDebug)console.log('Start get task info.\n[group]'+group+'\n[url]'+url);
}

var data={group:group,version:"1.0"};

//prepare agent and proxy
//console.log('The default user agent is ' + page.settings.userAgent);
//page.settings.userAgent = 'SpecialAgent';

page.open(url,'GET',data, function (status) {
    if (status !== 'success') {
        console.log('Unable to access network');
    } else {
        //now try to parse response
		if(isDebug)console.log("start to wait server responding.\n[url]"+url+"\n[page.plainText]"+page.plainText);
		var task = JSON.parse(page.plainText);
		console.log(""+task.command);
    }
    phantom.exit();
});
