var page = require('webpage').create();
var fs = require('fs');
var url = "http://api.taobao.com/apitools/apiPropTools.htm";
var timeoutMillis = 3000;
var depth = 0;
var path=["0"];
var cid="0";
var clicks = 0;//how many clicks
var isDebug = true;

var output_filename = "NA_";


//check parameters
if (phantom.args.length === 0) {
	if(isDebug)console.log('Usage: getCategory.js filename [level0 [level1 [level2 [level3]]]] ');
	if(isDebug)console.log('Start get top category');
}else if(phantom.args.length === 1){
	output_filename = phantom.args[0];
}else if(phantom.args.length > 1){
	depth = phantom.args.length-1;
	var paras = [];
	for(var i in phantom.args)//notice phantom.ars is read-only we cannot try shift/pop against it
		paras[i] = phantom.args[i];
	if(isDebug)console.log("[command line arguments]"+JSON.stringify(paras));
	output_filename = paras.shift();
	path = paras;
	cid = path[depth-1];
	if(isDebug)console.log('Start get category.\n[depth]'+depth+"\n[file]"+output_filename+"\n[path]"+path);
}

for(var k in phantom.args){
	if(isDebug)console.log("args["+k+"]\t"+phantom.args[k]);
}

var breadcrumb = "";
for(var i in path){
	if(isDebug)console.log("path["+i+"]\t"+path[i]);
	breadcrumb += path[i]+" ";
}

//prepare agent and proxy
//console.log('The default user agent is ' + page.settings.userAgent);
//page.settings.userAgent = 'SpecialAgent';

//wait for current page loading 
function waitFor(testFx, onReady, timeOutMillis) {
	if(isDebug)console.log("waitFor start...[timeOutMillis]"+timeOutMillis+"\t[root timeoutMillis]"+timeoutMillis);
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
		allitems="",
        interval = setInterval(function() {
			if(isDebug)console.log("step into interval...");
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                var result = (typeof(testFx) === "string" ? eval(testFx) : testFx(depth,path,cid,clicks)); //< defensive code
				var lastElement = "NULL";
				if(result){
					condition = result.visible;
					clicks = result.clicks;
					lastElement=result.lastElement;
				}
				if(isDebug)console.log("we got check result.[visible]"+condition+"\t[clicks]"+clicks+"\t[lastElement]"+lastElement);
            } else {
				if(isDebug)console.log("timeout and the condition is:"+condition);
                if(!condition) {
					if(isDebug)console.log("Time out but we cannot get all categorys. Try to get props and propvalues...");
                    // If condition still not fulfilled (timeout but condition is 'false')
                    //console.log("'waitFor()' timeout");
					//any way we have to get html once
					var result = (typeof(onReady) === "string" ? eval(onReady) : onReady(cid,breadcrumb)); //< Do what it's supposed to do once the condition is fulfilled
                    var props = result.props&&result.props.itemprops_get_response&&result.props.itemprops_get_response.item_props?result.props.itemprops_get_response.item_props.item_prop:[];
					var values = result.values&&result.values.itempropvalues_get_response&&result.values.itempropvalues_get_response.prop_values?result.values.itempropvalues_get_response.prop_values.prop_value:[];
					//console.log("props:\n"+JSON.stringify(props)+"\nvalues:\n"+JSON.stringify(values));
					//var json = {props:props,values:values};
					//console.log(JSON.stringify(json));
					//here we must complete full fields for later processing
					/*
					{
						"child_template":"",
						"is_color_prop":false,
						"is_enum_prop":true,
						"is_input_prop":false,
						"is_item_prop":true,
						"is_key_prop":false,
						"is_sale_prop":false,
						"multi":false,
						"must":true,
						"name":"裤长",
						"parent_pid":0,
						"parent_vid":0,
						"pid":122276111,
						"sort_order":0,
						"status":"normal"
					}	
					//*/	
					var fullprops=[];
					var pIndex=0;
					for(var i in props){
						var fullprop = {name:"",pid:"",parent_pid:"0",parent_vid:"0",is_color_prop:false,is_enum_prop:true,is_input_prop:false,is_item_prop:true,is_key_prop:false,is_sale_prop:false,multi:false};
						if(props[i].name)fullprop.name=encodeURIComponent(props[i].name);
						if(props[i].pid)fullprop.pid=props[i].pid;
						if(props[i].parent_pid)fullprop.parent_pid=props[i].parent_pid;
						if(props[i].parent_vid)fullprop.parent_vid=props[i].parent_vid;
						if(props[i].is_color_prop)fullprop.is_color_prop=props[i].is_color_prop;
						if(props[i].is_enum_prop)fullprop.is_enum_prop=props[i].is_enum_prop;
						if(props[i].is_input_prop)fullprop.is_input_prop=props[i].is_input_prop;
						if(props[i].is_item_prop)fullprop.is_item_prop=props[i].is_item_prop;
						if(props[i].is_key_prop)fullprop.is_key_prop=props[i].is_key_prop;
						if(props[i].is_sale_prop)fullprop.is_sale_prop=props[i].is_sale_prop;
						if(props[i].multi)fullprop.multi=props[i].multi;
						fullprops[i]=fullprop;
					}
					/*
					{
						"cid":50011127,
						"name":"29（2尺2）",
						"name_alias":"29（2.23尺）",
						"pid":20518,
						"prop_name":"裤尺寸",
						"sort_order":27,
						"status":"normal",
						"vid":3217382
					}	
					//*/					
					var fullvalues = [];
					var vIndex=0;
					for(var j in values){
						//console.log("value"+j+"\t"+values[j].vid+"\t"+values[j].prop_name+"\t"+values[j].name+"\t"+values[j].pid+"\t"+values[j].cid);
						var fullvalue = {vid:"",pid:"",cid:"",name:"",name_alias:"",prop_name:""};
						if(values[j].vid)fullvalue.vid=values[j].vid;
						if(values[j].pid)fullvalue.pid=values[j].pid;
						if(values[j].cid)fullvalue.cid=values[j].cid;
						if(values[j].name)fullvalue.name=encodeURIComponent(values[j].name);
						if(values[j].name_alias)fullvalue.name_alias=encodeURIComponent(values[j].name_alias);
						if(values[j].prop_name)fullvalue.prop_name=encodeURIComponent(values[j].prop_name);
						fullvalues[j]=fullvalue;
					}
					
					var fulljson={props:fullprops,values:fullvalues};
					console.log(JSON.stringify(fulljson));
					
					var propJson = {data:fullprops};
					fs.write(output_filename+"_property.json",JSON.stringify(propJson),'w');
					
					var valueJson = {data:fullvalues};
					fs.write(output_filename+"_propvalue.json",JSON.stringify(valueJson),'w');
					
					phantom.exit(1);
                } else {
					if(isDebug)console.log("Here we get all categorys.[depth]"+depth+"\t[dir]"+cid);
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    var result = (typeof(onReady) === "string" ? eval(onReady) : onReady(cid,breadcrumb)); //< Do what it's supposed to do once the condition is fulfilled
					var options = result.options;
					
					var categorys = [];
					var cIndex = 0;
					for (var k in options) {
						//console.log(k+"\t"+options[k].parent+"\t"+options[k].key+"\t"+options[k].value); 
						if(options[k].key !== "")categorys[cIndex++]={"parent":options[k].parent,"cid":options[k].key,"name":options[k].value,"path":options[k].path};
					};
					
					var json = {data:categorys};
					console.log(JSON.stringify(json));
					fs.write(output_filename+"_category.json",JSON.stringify(json),'w');
					
					clearInterval(interval); //< Stop this interval
					phantom.exit();
                }
            }
        }, 250); //< repeat check every 250ms
};

page.open(url, function (status) {
    if (status !== 'success') {
        console.log('Unable to access network');
		phantom.exit();
    } else {
        // Wait for 'signin-dropdown' to be visible
		if(isDebug)console.log("start to wait server responding[depth]"+depth);
        waitFor(function(depth,path,dir,clicks) {
			if(isDebug)console.log("checking if parent category exists.[depth]"+depth+"\t[dir]"+dir+"\t[clicks]"+clicks);
            // Check in the page if a specific element is now visible
            return page.evaluate(function (depth,path,dir,clicks) {
				if(clicks==0){
					apiUrl(false); //try to change mode by calling remote function
					//check the radio box to change mode
					$('input:radio[onclick="javascript:apiUrl(false);"]').attr('checked',"checked").end().change();
					clicks++;
				}
				//check if the mode is correct
				
				//walk through depth to get target dir
				var lastVisibleElement = "";
				for(var i=0;i<depth-1;i++){
					if($("#cid_"+path[i]).length>0)
						lastVisibleElement = "#cid_"+path[i];
					if($("#cid_"+path[i]).length>0 && i>clicks-2){
						//$("#cid_"+path[i]).val(path[i+1]).end().change();
						$("#cid_"+path[i]).find("option[value='"+path[i+1]+"']").attr('selected', "selected").end().change();
						clicks++;
					}
				}
				//check if the target element exists
				var isVisible = $("#cid_"+dir).length==0?false:true;
				return {"visible":isVisible,"clicks":clicks,"lastElement":lastVisibleElement};
			},depth,path,dir,clicks);
        }, function(dir,fullpath) {//now we get html document
			if(isDebug)console.log("parsing target categorys.[parent]"+dir+"[full path]"+fullpath);
			return page.evaluate(function (target,fullpath) {
				var options = [];
				var cIndex = 0;
				$("#cid_"+target).each(function(){
					$(this).children("option").each(function(){
						var fpath = fullpath+$(this).val();
						options[cIndex++]={"key":$(this).val(),"value":encodeURIComponent($(this).text()),"parent":target,"path":fpath};
					});
				});
				var sprops = null,svalues=null;
				if(typeof props !== "undefined")sprops = props;
				if(typeof propvalues !== "undefined")svalues = propvalues;
				return {"options":options,"props":sprops,"values":svalues};//we get from remote JS parameters directly
			},dir,fullpath);
        },timeoutMillis);  
    }
    //phantom.exit();
});
