var page = require('webpage').create();
var fs = require('fs');
var url = "http://www.zccw.info/index/page/";
var timeoutMillis = 3000;
var p = "1";
var filename = "foodinfo";
var isDebug=true;

var server = 'http://localhost:8080/foodinfo?dump';
var headers = {"Content-Type": "application/json"};

var dataset = [];

//check mandatory parameter
console.log('Usage: getFoodInfo.js [hotpot server] [page [timeout]]');
if (phantom.args.length === 0) {
	//use default settings
}else if (phantom.args.length === 1) {
	server = phantom.args[0];
	p = "1";
}else if (phantom.args.length === 2) {
	server = phantom.args[0];
	p = phantom.args[1];
}else if (phantom.args.length === 3) {
	server = phantom.args[0];
	p = phantom.args[1];
	timeoutMillis = phantom.args[2];
}
url = url + p;
console.log('Try to get info.[URL]'+url);

//prepare agent and proxy
//console.log('The default user agent is ' + page.settings.userAgent);
//page.settings.userAgent = 'SpecialAgent';

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

function handle_post(item){
	page.open(server,'POST',item, headers, function (status) {
		if (status !== 'success') {
			console.log('Unable to access network. [status]'+status);
		} else {
			//now try to parse response
			if(isDebug)console.log("start to wait server responding.\n[url]"+url+"\n[page.plainText]"+page.plainText);
			setTimeout(next_post,100);
		}
	});	
}

function next_post(){
//console.log("[dataset]\n"+JSON.stringify(dataset));
	if(dataset.length==0){console.log("no data to post.");phantom.exit(0);}
    var item = dataset.pop();
    if(!item){phantom.exit(0);}
	if(isDebug)console.log("posting data."+JSON.stringify(item));
    handle_post(JSON.stringify(item));
}

//wait for current page loading 
function waitFor(testFx, onReady, timeOutMillis) {
	console.log("waitFor start...[timeOutMillis]"+timeOutMillis);
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
		allitems="",
        interval = setInterval(function() {
			console.log("step into interval...");
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                var result = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
				condition = result;
				console.log("condition is "+condition);
            } else {
				console.log("timeout and the condition is:"+condition);
                if(!condition) {
					console.log("Time out but we cannot get geo info.");
                    // If condition still not fulfilled (timeout but condition is 'false')
                    //console.log("'waitFor()' timeout");
					//any way we have to get html once
					//typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    var items = (typeof(onReady) === "string" ? eval(onReady) : onReady()); //< Do what it's supposed to do once the condition is fulfilled
					//*
					var i=0;
					console.log("Here we get result.[total]"+items.length);
					for (var k in items) {
						//console.log(JSON.stringify(items[k])); 
						//postData(JSON.stringify(items[k])); 
						dataset[i++]=items[k];
					};
					//fs.write(filename+".json",JSON.stringify(items),'w');
					//*/
					//dataset = items;
					clearInterval(interval); //< Stop this interval
					next_post();
					//phantom.exit();
                }
            }
        }, 250); //< repeat check every 250ms
};


page.open(url, function (status) {
    if (status !== 'success') {
        console.log('Unable to access network');
		phantom.exit();
    } else {
		// here we inject jQuery
		console.log("start to wait server responding");
		//inject jQuery
		var injectStatus = page.injectJs('../3party/jquery-1.11.1.min.js');
		console.log("inject jquery finished.[result]"+injectStatus);
		//inject MD5
		var injectMD5 = page.injectJs('md5_plain.js');
        waitFor(function() {
            // Check in the page if a specific element is now visible
            return page.evaluate(function () {
				var isVisible = $("div[id^='post']").length==0?false:true;
				return isVisible;
			});
        }, function() {//now we get html document
			return page.evaluate(function () {
				var options = [];
				var cIndex = 0;
				$("div[id^='post']").each(function(){
					var item = {code:"",title:"",time:"",url:"",area:[],tag:[],food:[],source:[]};
					//title
					var titleEl = $(this).find("h2 a");
					if(titleEl){
						item.title = encodeURIComponent(titleEl.text());
						item.code = MD5(titleEl.attr("href"));
						item.url = encodeURIComponent(titleEl.attr("href"));
					}
					//time
					var timeEl = $(this).find("h2 span.time");
					if(timeEl)item.time = timeEl.text();
					//area
					var area = [],areaIndex=0;
					$(this).find("span.cat-links").each(function(){
						area[areaIndex++]= encodeURIComponent($(this).text());
					});
					item.area = area;
					//tags
					var tags=[],tagIndex=0;
					$(this).find("span[class='entry-utility-prep entry-utility-prep-tag-links'] a").each(function(){
						tags[tagIndex++]= encodeURIComponent($(this).text());
					});
					item.tag = tags;
					//food
					var food=[],foodIndex=0;
					$(this).find("span[class^='entry-utility-prep food'] a").each(function(){
						food[foodIndex++]= encodeURIComponent($(this).text());
					});
					item.food = food;					
					//source
					var source=[],sourceIndex=0;
					$(this).find("span[class^='entry-utility-prep source']").each(function(){
						source[sourceIndex++]= encodeURIComponent($(this).text());
					});
					item.source = source;					
					options[cIndex++]=item;
				});
				return options;
			});
        },timeoutMillis);  
    }
    //phantom.exit();
});

