var page = require('webpage').create();
var md5 = require('./md5');
var fs = require('fs');
var timeoutMillis = 5000;
var dir = "C:/git/cabinets/food/";
var isDebug=false;

//1,get food information with no image: post
//2,query image: get
//3,click first item in the result page: click
//4,get target image url:parse
//5,post image url: put

var server = 'http://localhost:8080/foodinfo';
var headers = {"Content-Type": "application/json"};

var foodInfo = {};
var code = "0";
var imgServer = "http://pic.sogou.com/pics";
var imgQuery = "query="+encodeURIComponent("有毒食品");
var targetImageURL = "http://www.zhuqingchun.com/kill.jpg";

var dataset = [];

//check mandatory parameter
if (phantom.args.length === 0) {
	console.log('Usage: getBaiduImage.js [hotpot server] [dir [timeout]]');
}else if (phantom.args.length === 1) {
	server = phantom.args[0];
}else if (phantom.args.length === 2) {
	server = phantom.args[0];
	dir = phantom.args[1];
}else if (phantom.args.length === 3) {
	server = phantom.args[0];
	dir = phantom.args[1];
	timeoutMillis = phantom.args[2];
}

//prepare agent and proxy
//console.log('The default user agent is ' + page.settings.userAgent);
//page.settings.userAgent = 'SpecialAgent';

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.onLoadFinished = function(status) {
	if(isDebug){
	  var currentURL = page.url;
	  console.log("Status:  " + status);
	  console.log("Loaded:  " + currentURL);
	  if(status=='success' && currentURL.indexOf("pic.sogou.com")>0){
		  page.clipRect={top:0,left:0,width:600,height:800};
		  page.render(dir+"/"+md5.MD5(currentURL)+".png");
	  }else{
		  console.log("Load error! cannot access network.");
	  }
  }
}

//check while starting a request
page.onResourceRequested = function (request) {
    if(isDebug)console.log('Request ' + JSON.stringify(request, undefined, 4));
};

/*
*Update FoodInfo with image url
*/
function postImageInfo(){
	var query = {cond:{code:code},obj:{image:targetImageURL}};//we get a doc with no image info
	console.log("try to post image info.[info]"+JSON.stringify(query));
	page.open(server,'PUT',JSON.stringify(query), headers, function (status) {
		if (status !== 'success') {
			console.log('Unable to access network. [status]'+status);
			phantom.exit();
		} else {//posted
			console.log(page.plainText);
			phantom.exit();
		}
	});	
}

page.onResourceReceived = function (res) {
    if(isDebug)console.log('received: ' + JSON.stringify(res, undefined, 4));
};

function encode_query(json) {  
	if (!json) {  
		return '';  
	}  
	var tmps = [];  
	for (var key in json) {  
		tmps.push(key + '=' + encodeURIComponent(json[key])); 
	}  
	return tmps.join('&');  
} 


function decodeJSON(item){
	var encodeItem = {title:"",time:"",url:"",area:[],tag:[],food:[],source:[]};
	encodeItem.title = decodeURIComponent(item.title);
	encodeItem.url = item.url;
	encodeItem.code = item.code;
	encodeItem.time = item.time;
	var areas=[];
	for(var i in item.area){
		areas[i]=decodeURIComponent(item.area[i]);
	}
	encodeItem.area = areas;
	
	var foods=[];
	for(var i in item.food){
		foods[i]=decodeURIComponent(item.food[i]);
	}
	encodeItem.food = foods;
	
	var sources=[];
	for(var i in item.source){
		sources[i]=decodeURIComponent(item.source[i]);
	}
	encodeItem.source = sources;
	
	var tags=[];
	for(var i in item.tag){
		tags[i]=decodeURIComponent(item.tag[i]);
	}
	encodeItem.tag = tags;
	console.log("[old]"+JSON.stringify(item));
	console.log("[new]"+JSON.stringify(encodeItem));
	return encodeItem;
}

/*
*get a FoodInfo with no image url
*/
function nextTask(){
	var query = "image=";//we get a doc with no image info
	var q = {image:""};
	var url = server;
	var qstr = encode_query(q);
	if(qstr.length>0)
		url = server +"?"+qstr;
	page.open(url,'GET', function (status) {
		if (status !== 'success') {
			console.log('Unable to access network. [status]'+status);
			phantom.exit();
		} else {
			//now we got a single image collect task
			console.log("[got task]\n"+page.plainText);
			var result = JSON.parse(page.plainText);
			if(result.items ==0){
				console.log("no more tasks.");
				phantom.exit();
			}
			foodInfo = decodeJSON(result);
			console.log("got food info.\n"+JSON.stringify(foodInfo));
			code = foodInfo.code;
			var word="有毒食品";
			//if(foodInfo.food.length==1)word=foodInfo.food[0];
			if(foodInfo.food.length>0)word=foodInfo.food.join(" ");
			imgQuery = "query="+encodeURIComponent(word);
			console.log("rest query string.[query]"+decodeURIComponent(imgQuery));
			//if(isDebug)console.log("start to wait server responding.\n[url]"+url+"\n[page.plainText]"+page.plainText);
			//now start request to get images
			setTimeout(searchImage,100);
		}
	});	
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
					//console.log("Here we get result.[total]"+items.length);
					for (var k in items) {
						if(isDebug)console.log(JSON.stringify(items[k])); 
						//here we can try some filtering but the first version only use item 0
						if(k==0)targetImageURL = items[k].thumbnail;
					};
					//fs.write(filename+".json",JSON.stringify(items),'w');
					//*/
					//dataset = items;
					clearInterval(interval); //< Stop this interval
					setTimeout(postImageInfo,100);
					//phantom.exit();
                }
            }
        }, 250); //< repeat check every 250ms
};

/*
*search baidu for image results
*/
function searchImage(){
	console.log("start baidu search.[server]"+imgServer+" [query]"+imgQuery);
	page.open(imgServer+"?"+imgQuery, function (status) {
		if (status !== 'success') {
			console.log('Unable to access network');
			phantom.exit();
		} else {
			// here we inject jQuery
			console.log("start to wait server responding");
			//var injectStatus = page.injectJs('../3party/jquery-1.11.1.min.js');
			//console.log("inject jquery finished.[result]"+injectStatus);
			waitFor(function() {
				// Check in the page if a specific element is now visible
				return page.evaluate(function () {
					var isVisible = (imgTempData && imgTempData.items.length>0)?true:false;
					return isVisible;
				});
			}, function() {//now we get html document
				return page.evaluate(function () {
					var imgs = [];
					var cIndex = 0;
					for(var i=0;i<imgTempData.items.length;i++){
						var item = {thumbnail:"",image:"",width:0,height:0};
						item.image = imgTempData.items[i].pic_url;
						item.thumbnail = imgTempData.items[i].thumbUrl;
						item.width = imgTempData.items[i].width;
						item.height = imgTempData.items[i].height;
						imgs[cIndex++]= item;
					}
					return imgs;
				});
			},timeoutMillis);  
		}
		//phantom.exit();
	});
}

nextTask();

