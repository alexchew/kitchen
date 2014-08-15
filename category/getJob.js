var page = require('webpage').create();
var fs = require('fs');
var url = "http://127.0.0.1:8080/job";
var executor = "";
var category = "meta";// task group
var type = "fetch"; // operating type
var timeoutMillis = 3000;
var isEncodeURI = true;
var isDebug = false;


//check parameters
if (phantom.args.length < 2 ) {
	console.log('Usage: getJob.js category executor [type [url]] ');
	phantom.exit();
}else if(phantom.args.length === 2){
	category = phantom.args[0];
	executor = phantom.args[1];
}else if(phantom.args.length === 3){
	category = phantom.args[0];
	executor = phantom.args[1];
	type = phantom.args[2];
}else if(phantom.args.length === 4){
	category = phantom.args[0];
	executor = phantom.args[1];
	type = phantom.args[2];
	url = phantom.args[3];
}
	if(isDebug)console.log('Start get task info.\n[group]'+category+'\n[executro]'+executor+"\n[operation]"+type+'\n[url]'+url);
//here we don't send category
var data={executor:executor,type:type,category:category};

//prepare agent and proxy
//console.log('The default user agent is ' + page.settings.userAgent);
//page.settings.userAgent = 'SpecialAgent';

//check while starting a request
page.onResourceRequested = function (request) {
    if(isDebug)console.log('Request ' + JSON.stringify(request, undefined, 4));
};

page.open(url,'post',encode_query(data), function (status) {
    if (status !== 'success') {
        console.log('Unable to access network');
    } else {
        //now try to parse response
		if(isDebug)console.log("start to wait server responding.\n[url]"+url+"\n[page.plainText]"+page.plainText);
		var task = "";
		try{
			var resp =JSON.parse(""+page.plainText);
			task = resp.command;
		}catch(err){
			task = "cannot get a job.";
		}
		console.log(task);
    }
    phantom.exit();
});

//convert data into query string
function encode_query(json) {  
	if (!json) {  
		return '';  
	}  
	var tmps = [];  
	for (var key in json) {  
		if(isEncodeURI)
			tmps.push(key + '=' + encodeURIComponent(json[key])); 
		else	
			tmps.push(key + '=' + json[key]); 
	}  
	return tmps.join('&');  
}  