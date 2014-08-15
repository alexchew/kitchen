var page = require('webpage').create();
var fs = require('fs');
var url = "http://127.0.0.1:8080/task";
var file = "NA";
var timeoutMillis = 3000;
var isEncodeURI = true;
var isDebug = false;


//check parameters
if (phantom.args.length < 2) {
	console.log('Usage: postData.js file url [encodeURI] ');
	phantom.exit();
}else if(phantom.args.length === 1){
	file = phantom.args[0];
	if(isDebug)console.log('Start get task info.\n[file]'+file+'\n[url]'+url);
}else if(phantom.args.length === 2){
	file = phantom.args[0];
	url = phantom.args[1];
	if(isDebug)console.log('Start get task info.\n[file]'+file+'\n[url]'+url);
}else if(phantom.args.length === 3){
	file = phantom.args[0];
	url = phantom.args[1];
	if("false"==phantom.args[2])
		isEncodeURI = false;
	if(isDebug)console.log('Start get task info.\n[file]'+file+'\n[url]'+url+'\n[isEncodeURI]'+isEncodeURI);
}

//prepare agent and proxy
//console.log('The default user agent is ' + page.settings.userAgent);
//page.settings.userAgent = 'SpecialAgent';

// This is how you set other header variables
//page.customHeaders = {"Content-Type":"application/json"};

//load data from local file
var content = JSON.stringify({data:[]}); 
try{
	content = fs.read(file);
	if(isDebug)console.log('read data:\n', content);
}catch(err){
	console.log("error while reading file.[file]"+file+"\n[error]"+err);
	phantom.exit();
}
var items = JSON.parse(content);

//check while starting a request
page.onResourceRequested = function (request) {
    if(isDebug)console.log('Request ' + JSON.stringify(request, undefined, 4));
};

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

function handle_post(item){
	page.open(url,'POST',item, function (status) {
		if (status !== 'success') {
			console.log('Unable to access network. [status]'+status);
		} else {
			//now try to parse response
			if(isDebug)console.log("start to wait server responding.\n[url]"+url+"\n[page.plainText]"+page.plainText);
			setTimeout(next_post,100);
		}
		//phantom.exit();
	});	
}

function next_post(){
    var item = items.data.pop();
    if(!item){phantom.exit(0);}
	var str = encode_query(item);
	if(isDebug)console.log("query\n"+str);
	console.log("posting data."+JSON.stringify(item));
    handle_post(str);//NOTICE here we cannot post JSON directly but encode query string first
}

next_post();

