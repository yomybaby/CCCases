Ti.include('joli.js');
Ti.include('util.js');
Ti.include('config.js');

joli.connection = new joli.Connection('ccArticleDB');
var models = (function(){
	var m = {};
	m.readArticle = new joli.model({
		table: 'readArticle',
		columns:{
			id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
			url: 'TEXT'
		},
		methods:{
			isRead: function(url){
				var article = joli.models.get('readArticle').findOneBy('url',url);
				return (article)?true:false;
			}
		}
	});
	m.favoriteArticle = new joli.model({
		table : 'favoriteArticle',
		columns:{
			id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
			link : 'TEXT', 
			title : 'TEXT',
			creater : 'TEXT',
			plainText : 'TEXT',
			description : 'TEXT',
			pubdt : 'TEXT',
			imageURL : 'TEXT',
		},
		methods: {
			deleteByUrl: function(url){
				var article = joli.models.get('favoriteArticle').findOneBy('link',url);
				if(article) article.destroy();
			},
			isFavorite: function(url){
				var article = joli.models.get('favoriteArticle').findOneBy('link',url);
				return (article)?true:false;
			}
		}
		
	})
	return m;
})();
joli.models.initialize();

/**
 * RSS TableView
 */
var XeRssTableView = function(params){
	//default
	this.updating = false;
	this.moreRowTitle_ =L('moreArticle');
	this.moreRowTitleWhileLoading_ = L('loading'); //loading
	this.rssUrl_ = params.rssUrl;
	this.tableView_ = Ti.UI.createTableView({
		className: params.className || 'caseTable',
	});
	this.data_ = [];
	this.webViewWindow_ = null;

	this.openTargetTab_ = params.openTarget;
	
	this.favoriteMode = params.favoriteMode || false;
	if(params.favoriteMode){
		var that = this;
		this.tableView_.rowHeight = 70;
		Ti.App.addEventListener('favoriteChange',function(){
			that.tableView_.show();
			that.readRssFromDB();
		});
		Ti.App.fireEvent('favoriteChange');
	}else{
		this.readRss({readType:"more"});
		this.setDynamicScroll();
		this.setPullToRefresh();
	}
	this.setViewArticleOnWebView();
	
	var rowExistMap = {};
	this.existThisUrl = function(url){
		if(rowExistMap[ this.getDocumentIdFromUrl(url) ]){
			return true;
		}else{
			return false;
		}
	}
	
	this.registDocumentUrl = function(url){
		rowExistMap[this.getDocumentIdFromUrl(url) ] = true;
	};
	return this.tableView_;
};

XeRssTableView.prototype.readRss = function(event){
	//event : readTpye = "more" or "new"
	event = event || {};
	Titanium.API.info('readRss call..........');
	var xhr = Ti.Network.createHTTPClient();
	xhr.timeout = 30000;
	if(this.tableView_.data[0]){
		var rowLength =this.tableView_.data[0]["rows"]["length"] ;
	}else{
		var rowLength = 0;
	}
	Ti.API.info("type:"+event.readType +", rowLength :"+rowLength);
	var readPage = ((event.readType == "more")? (rowLength/10+1) :1 );
    xhr.open("GET",this.rssUrl_+'&page='+ readPage );
    var that = this;
    var tableview = this.tableView_;
    var addFrontMode = (event.readType == "update")?true:false;
    xhr.onerror = function(e){
    	Ti.UI.createAlertDialog({title:L('alert'),message:L('requestFail')});
    	tableview.fireEvent("endUpdate");
    }
    xhr.onload = function (){
		try
		{
			var doc = this.responseXML.documentElement;
			this.responseXML.documenetElement;
			var items = doc.getElementsByTagName("item");
			var newDataArr = [];
			for (var c=0;c<items.length;c++)
			{
				var item = items.item(c);
				
				//FIXME: ocasionally occur error
				try{
				var title = item.getElementsByTagName("title").item(0).text;
	            var description = item.getElementsByTagName("description").item(0).text;
				var creater = item.getElementsByTagName("dc:creator").item(0).text;
	            var link =  item.getElementsByTagName("link").item(0).text;
				var pubDate = Date.parse(item.getElementsByTagName("pubDate").item(0).text);
	           	} catch(err) {
	           		continue;
	           	}
				var imgTagReg = /<img(.*?)src=(["'])(.*?)\2(.*?)\/?>/i;
				var arr = imgTagReg.exec(description);
				var imgUrl = null;
				if (arr) {
					imgUrl = arr[3];
				}
				
				var plainText = util.removeTagAndURL(description);
				
				if(!that.existThisUrl(link)){
						newDataArr.push(that.createCaseTableRow(title, creater, plainText, description, pubDate, imgUrl, link, true, false));
					that.registDocumentUrl(link);
				}
			}
			if(addFrontMode){
				that.data_ = newDataArr.concat(that.data_);
			}else{
				that.data_ = that.data_.concat(newDataArr);
			}
			
			tableview.data = that.data_;
			if(newDataArr.length==0 && !addFrontMode){
				tableview.fireEvent("endUpdate",{isLastPage:true});
			}else{
				tableview.fireEvent("endUpdate");
			}
		}
		catch(E)
		{
			alert(E);
		}
	};  // end of "xhr.onload" function
    xhr.send();
};

XeRssTableView.prototype.readRssFromDB = function(event){
	//event : readTpye = "more" or "new"
	event = event || {};
	Titanium.API.info('readRssFromDB call..........');
	var favs = models.favoriteArticle.all({order: ['id desc']});
	var newData = this.data_ = [];
	for(var i=0,l=favs.length;i<l;i++){
		var item = favs[i];
		newData.push(this.createCaseTableRow(item.title,item.creater, item.plainText,item.description,item.pubdt,item.imageURL,item.link));
	}
	this.tableView_.data = newData;
	if(newData.length==0){
		this.tableView_.hide();
	}else{
		this.tableView_.show();
	}
};


XeRssTableView.prototype.createCaseTableRow = function createCaseTableRow(title,creater, plainText,description,pubdt,imageURL,link, read, favorite){
	var isRead = models.readArticle.isRead(link);
	var row = Ti.UI.createTableViewRow({
		height:70,
     	selectedBackgroundColor:'#ddd',
     	isRead : isRead
    	});
	var textLeftMargin = (imageURL && imageURL != 'null')?80:10;
	var label = Ti.UI.createLabel({
		text:title,
		className:"rowTitleLabel",
		left:textLeftMargin,
		color : (isRead)?'#888':'#222'
	});
	//plain text
	var plainLabel = Ti.UI.createLabel({
	    className:"plainLabel",
		text:plainText,
		left:textLeftMargin,
	});
	row.add(label);
	row.add(plainLabel);
	
	// make Thumnail URL (ONLY for XE)
	var reg = /(.*)?document_srl=(\d.*)/;
	var thumImglink = link.replace(reg,function(){
		var num =parseInt(arguments[2]);
		var articleNum = num%1000;
		var bbsNum = Math.floor(num/1000);
	    return 'http://cckorea.org/xe/files/cache/thumbnails/'+util.pad(articleNum,3)+'/'+util.pad(bbsNum,3)+'/100x100.crop.jpg';
	});
	
	
	if(imageURL){
		var imgView = Ti.UI.createImageView({
			left:10,
			height:60,
			width:60,
			borderColor:'#ccc',
			backgroundColor: 'white',
			borderWidth:1,
			borderRadius:0,
			image : (thumImglink)?thumImglink:imageURL,
			defaultImage :'images/defaultImage.png'
		});
		row.add(imgView);
	}
	
	var innerHtml = description.replace(/style\s*=\s*(["|']).*?\1/ig,"");
	innerHtml = innerHtml.replace(/class\s*=\s*(["|']).*?\1/ig,"");
	innerHtml = innerHtml.replace(/<\/?font[^<>]*>/ig,"");
	
	// save data to row	
	row.url = link;
	row.filter = title+plainText;
	row.hiddenTitle=title;
	row.creater = creater;
	row.innerHTML = innerHtml;
	row.pubdt=pubdt;
	row.read = read;
	row.favorite=favorite;
	row.titleLabel = label;
	row.imageURL = imageURL;
	row.plainText = plainText;
	
	return row;
}

// TODO: Refactoring (setDynamicScroll)
XeRssTableView.prototype.setDynamicScroll = function(){
	var that = this;
	var tableView = this.tableView_;
	var updating = this.updating;
	var navActInd = Titanium.UI.createActivityIndicator({style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK , width:90, left:10 ,message:this.moreRowTitleWhileLoading_,color:'#666', font:{fontSize:15}});
	var loadingRow = Ti.UI.createTableViewRow({backgroundColor:"#e2e7ed", color:'#666',invalid:true});
	var loadingLabel = Ti.UI.createLabel({text:"",font:{fontSize:15},textAlign:'left',left:10,color:'#666'});
	loadingRow.add(loadingLabel)
	loadingRowClickHandler = function(){
		if(!updating){
			//loadingLabel.text = that.moreRowTitleWhileLoading_;
			loadingLabel.text = "";
			beginUpdate();
		}
	};
	loadingRow.addEventListener('click',loadingRowClickHandler);
	loadingRow.add(navActInd);
	navActInd.show();
	tableView.appendRow(loadingRow);
	
	function beginUpdate()
	{
		updating = true;
		navActInd.show();
		that.readRss({readType:"more"});
	}
	
	function endUpdate(e)
	{
		navActInd.hide();
		tableView.appendRow(loadingRow);
		updating = false;
		
		if(e.isLastPage){
			loadingRow.removeEventListener('click',loadingRowClickHandler);
			loadingLabel.text = L('nomoreArticle');
			tableView.scrollToIndex(tableView.data[0].rows.length-1);
		}else{
			loadingLabel.text = that.moreRowTitle_;
		}
		Ti.API.info("endUpdate .... ");
	}
	
	tableView.addEventListener("endUpdate" ,endUpdate);
	
	var lastDistance = 0; // calculate location to determine direction
}


//TODO: change to makerHashcodeFromUrl
XeRssTableView.prototype.getDocumentIdFromUrl = function(url){
	var reg = /document_srl=([\d]*)/i;
	var arr = reg.exec(url);
	
	//TODO: exception handle
	return 'd'+arr[1];
};


// TODO: Refactoring (setPuulToRefresh)
XeRssTableView.prototype.setPullToRefresh = function(){
	var tableView = this.tableView_;
	var that = this;
	var reloading = this.updating;
	var pulling = false;
	
	function formatDate()
	{
		var date = new Date;
		var datestr = date.getMonth()+'/'+date.getDate()+'/'+date.getFullYear();
		if (date.getHours()>=12)
		{
			datestr+=' '+(date.getHours()==12 ? date.getHours() : date.getHours()-12)+':'+date.getMinutes()+' PM';
		}
		else
		{
			datestr+=' '+date.getHours()+':'+date.getMinutes()+' AM';
		}
		return datestr;
	}
	 	
	var tableHeader = Ti.UI.createView({
		backgroundColor:"#e2e7ed",
		width:320,
		height:60
	});
	var border = Ti.UI.createView({
		backgroundColor:"#576c89",
		height:2,
		bottom:0
	});
	tableHeader.add(border);
	
	var arrow = Ti.UI.createView({
		backgroundImage:"images/whiteArrow.png",
		width:23,
		height:60,
		bottom:10,
		left:20
	});
	
	var statusLabel = Ti.UI.createLabel({
		text:L('pullToRefresh'),
		left:55,
		width:220,
		bottom:30,
		height:"auto",
		color:"#576c89",
		textAlign:"center",
		font:{fontSize:13,fontWeight:"bold"},
		shadowColor:"#999",
		shadowOffset:{x:0,y:1}
	});
	
	var lastUpdatedLabel = Ti.UI.createLabel({
		text:L('recentUpdate')+": "+formatDate(),
		left:55,
		width:220,
		bottom:15,
		height:"auto",
		color:"#576c89",
		textAlign:"center",
		font:{fontSize:12},
		shadowColor:"#999",
		shadowOffset:{x:0,y:1}
	});
	
	var actInd = Titanium.UI.createActivityIndicator({
		left:20,
		bottom:13,
		width:30,
		height:30
	});
	
	tableHeader.add(arrow);
	tableHeader.add(statusLabel);
	tableHeader.add(lastUpdatedLabel);
	tableHeader.add(actInd);
	
	tableView.headerPullView = tableHeader;
	
	function beginReloading()
	{
		that.readRss({readType:"update"});
	}
	
	function endReloading()
	{
		// when you're done, just reset
		tableView.setContentInsets({top:0},{animated:true});
		reloading = false;
		lastUpdatedLabel.text = L('recentUpdate')+": "+formatDate();
		statusLabel.text = L('pullToRefresh');
		actInd.hide();
		arrow.show();
	}
	
	tableView.addEventListener("endUpdate" ,function(){
		if(reloading){
			endReloading();	
		}
	});
	
	tableView.addEventListener('scroll',function(e)
	{
		var offset = e.contentOffset.y;
		if (offset <= -65.0 && !pulling)
		{
			var t = Ti.UI.create2DMatrix();
			t = t.rotate(-180);
			pulling = true;
			arrow.animate({transform:t,duration:180});
			statusLabel.text = L('releaseToRefresh');
		}
		else if (pulling && offset > -65.0 && offset < 0)
		{
			pulling = false;
			var t = Ti.UI.create2DMatrix();
			arrow.animate({transform:t,duration:180});
			statusLabel.text = L('pullToRefresh');;
		}
	});
	
	tableView.addEventListener('scrollEnd',function(e)
	{
		if (pulling && !reloading && e.contentOffset.y <= -65.0)
		{
			reloading = true;
			pulling = false;
			arrow.hide();
			actInd.show();
			statusLabel.text = L('loading');
			tableView.setContentInsets({top:60},{animated:true});
			arrow.transform=Ti.UI.create2DMatrix();
			beginReloading();
		}
	});
};

//TODO: refactoring
XeRssTableView.prototype.setViewArticleOnWebView = function(){
	var that = this;
	var tableview = this.tableView_;
	this.tableView_.addEventListener('click',function(e){
		//title = (e.index+1)+"/"+data.length;
		if(e.row.invalid) return;
		var win = that.createContentWebViewByRow(e.row,{
			closeHandler:function(index){
				tableview.scrollToIndex(index);
				//tableview.selectRow(index);
			},
			rowIndex: e.index
		});
		var curTab = that.openTargetTab_.activeTab;//Titanium.UI.currentTab;
		curTab.open(win);
	});
}

XeRssTableView.prototype.createContentWebViewByRow = function(curRow,params){
	var globalWebViewWin = this.webViewWindow_;
	var tableview = this.tableView_;
	var title=curRow.hiddenTitle;
	var author=curRow.authour;
	var content=curRow.content;
	var date = curRow.pubDate;
	var showNavBtnBar =true;
	var newIdx = params.rowIndex;
	var rowLengthGap = (this.favoriteMode)?0:1;
	var winTitle = (newIdx+1)+"/"+(tableview.data[0].rows.length-rowLengthGap) ;
	if(globalWebViewWin){
		globalWebViewWin.title = winTitle;
		globalWebViewWin.curIndex = newIdx;
		globalWebViewWin.toolbar[2].title = (curRow.favorite=='true')?'★':'☆';
		(globalWebViewWin.children[0]).html =  makeHTMLbyRow("curWin.dbCategory", tableview.data[0].rows[newIdx]);
		return globalWebViewWin;
	}
	
	globalWebViewWin = Titanium.UI.createWindow({
		title:winTitle,
		barImage : '../images/nav/m_bg.jpg',
		backgroundImage : '../images/list_bg.jpg',
		curIndex:newIdx,
		backgroundColor:'#ffffff',
		tabBarHidden:true
	});
	
	/*
	 * Web View
	 */
	var wb = Titanium.UI.createWebView({
		html: makeHTMLbyRow("curWin.dbCategory", tableview.data[0].rows[newIdx]),
		backgroundColor:'#ffffff',
		top:0
	});
	var toolActInd = Titanium.UI.createActivityIndicator({
		width:30,
		height:30
	});
	toolActInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.DARK;
	wb.add(toolActInd);
	wb.addEventListener('load',function(e)
	{
		toolActInd.hide();
	});
	wb.addEventListener('beforeload',function(e)
	{
		toolActInd.show();
	});
	globalWebViewWin.add(wb);
	globalWebViewWin.addEventListener('close',function(){
		if (params.closeHandler && (typeof(params.closeHandler) == 'function')) {
			params.closeHandler(globalWebViewWin.curIndex);
		}
	});
	
	var articleUrl = curRow.url;
	var dialog = Titanium.UI.createOptionDialog({
		options:[L('sendToTwitter'), L('sendEmail'), L('openInSafari'),L('cancel')],
		cancel:3
	});
	dialog.addEventListener('click',function(event)
	{
		var curRow = tableview.data[0].rows[globalWebViewWin.curIndex] 
		switch(dialog.options[event.index]){
			case L('sendToTwitter'):
				onClickTwitterButton(curRow.url, curRow.hiddenTitle);
			break;
			case L('sendEmail'):
				var emailDialog = Titanium.UI.createEmailDialog();
				
		        if (Ti.Platform.name == 'iPhone OS') {
		            emailDialog.setMessageBody('<b><h1>'+curRow.hiddenTitle+'</h1></b><br/><a href="'+curRow.url+'">'+curRow.url+'</a><br/><br/>'+curRow.innerHTML);
		            emailDialog.setHtml(true);
		            emailDialog.setBarColor('#336699');
		        }
		        
		        emailDialog.addEventListener('complete',function(e)
		        {
		            if (e.result == emailDialog.SENT)
		            {
		                if (Ti.Platform.osname != 'android') {
		                    // android doesn't give us useful result codes.
		                    // it anyway shows a toast.
		                    alert(L());
		                }
		            }
		            else
		            {
		                if(e.result && e.result!=1) alert(L('emailSendFail')+" result = " + e.result);
		            }
		        });
		        emailDialog.open();
			break;
			case L('openInSafari'):
				Ti.App.fireEvent("openBrowser",{"URL":curRow.url});
			break;
		}
	});
	
	var action = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.ACTION
	});
	
	action.addEventListener('click', function()
	{
		dialog.show();
	});
	
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	
	var dummyBtn = Titanium.UI.createButton({
		title:' ',
		width:24,
		enabled:false
	});
	
	var fontSizeBtn  = Ti.UI.createButton({
		image:'images/fontSize.png',
		width:24
	});
	
	wb.addEventListener('changeFontSize',function(e){
		var fontSize = Ti.App.Properties.getDouble("fontSizeEm",0.9)+e.sizeDelta;
		if(fontSize < 0.9) {
			fontSize = 1.4;
		}else if(fontSize>1.4){
			fontSize = 0.9;
		}
		Ti.App.Properties.setDouble("fontSizeEm",fontSize)
		Ti.API.info("fontSizeEm : " +fontSize);
		wb.evalJS('if (document.body.style.fontSize == "") {document.body.style.fontSize = "1.0em";}'
		  +'document.body.style.fontSize = "'+ fontSize + 'em";'
		);
	});
	fontSizeBtn.addEventListener('click',function(e){
		wb.fireEvent('changeFontSize',{sizeDelta:0.1});
	});
	
	var favoriteBtn = Ti.UI.createButton({
		title: (models.favoriteArticle.isFavorite(curRow.url))?'★':'☆'
	});
	favoriteBtn.addEventListener('click',function(e){
		if(e.source.title == '☆'){
			e.source.title='★';
			var newFavorite = models.favoriteArticle.newRecord({
				link : curRow.url, 
				title : curRow.hiddenTitle,
				creater : curRow.creater,
				plainText : curRow.plainText,
				description : curRow.innerHTML,
				pubdt : curRow.pubdt,
				imageURL : curRow.imageURL
			});
			newFavorite.save();
		}else{
			e.source.title='☆';
			models.favoriteArticle.deleteByUrl(curRow.url);
		}
		Ti.App.fireEvent('favoriteChange');
	});
	
	/*
	 * move Article navi Button Bar (right Nav)
	 */
	var moveArticleBtnBar = Titanium.UI.createButtonBar({
		labels:[' ▲ ', ' ▼'],
		backgroundColor:'#2A2623'
	});
	moveArticleBtnBar.addEventListener('click', function(event)
	{
		var curIdx = globalWebViewWin.curIndex;
		var rowLength =tableview.data[0].rows.length -rowLengthGap;
		switch(event.index) {
			case 0:
				newIdx=globalWebViewWin.curIndex-1;
				break;
			case 1:
				newIdx=globalWebViewWin.curIndex+1;
				break;
		}
		
		if(newIdx>=0 && newIdx<rowLength){
			var rowWillDisplay = tableview.data[0].rows[newIdx];
			wb.html = makeHTMLbyRow("curWin.dbCategory", rowWillDisplay);
			globalWebViewWin.title = (newIdx+1) +"/" + rowLength;
			tableview.scrollToIndex(newIdx);
			favoriteBtn.title= (models.favoriteArticle.isFavorite(rowWillDisplay.url))?'★':'☆';
			Ti.API.info(rowWillDisplay.url + favoriteBtn.title+models.favoriteArticle.isFavorite(rowWillDisplay.url));
			globalWebViewWin.curIndex = newIdx;
			curRow = tableview.data[0].rows[newIdx];
		}
		
		
	});
	globalWebViewWin.setRightNavButton(moveArticleBtnBar);	
	
	globalWebViewWin.setToolbar([flexSpace,favoriteBtn,flexSpace,action,flexSpace,fontSizeBtn,flexSpace]);
	
	return globalWebViewWin;
}

//TODO: refactoring or apply template module.
function makeHTMLbyRow(dbCategory,row){
	// first time to read? save read record.
	if(!row.isRead){
		var atc = models.readArticle.newRecord({
			url:row.url
		});
		atc.save();
		row.titleLabel.color = '#888';
	}
	var rtnHTML = '<html>'
	+'<head>'
	+'<script src="../tools/jquery-1.3.2.js"></script>'
	+'<script src="../tools/jquery.ae.image.resize.min.js"></script>'
	+'<script>$(function() { $("img").aeImageResize({height: 1000, width: 300});});'
	+'var clickFlag=false;'
	+'function onClickHeader(){'
		+'if(!clickFlag){'
			+'clickFlag=true;'
			+'Titanium.App.fireEvent("articleheadclick'+dbCategory+'",{"url":"'+row.url+'","title":"'+row.hiddenTitle+'"});'
			+'setTimeout(function(){clickFlag=false},3000);'
		+'}'
	+'}'
	+'</script>'
	+'<meta name="viewport" content="user-scalable=yes, initial-scale=1.0, maximum-scale=3.0, minimum-scale=1.0, width=device-width" />'
	+'<style>'
	+'body, div, dl, dt, dd, ul, ol, li, h1, h2, h3, h4, form, fieldset, p, button, blockquote { margin: 0; padding: 0; }'
	+'body{padding:10px;font-size:'+Ti.App.Properties.getDouble("fontSizeEm",0.9)+'em;color:#333;}'
	+'div.top_wrap {padding:5px 0 10px 0;position:relative;}'
	+'div.top_wrap h1{font-size:1.5em;font-weight:bold;color:#1e140c;}'
	+'div.top_wrap span{display:block;font-size:1.em; padding-top:3px; color:#888;}'
	+'div.top_wrap span.number{display:inline; letter-spacing:0;}'
	+'div.pub_info_wrap{height:1.45em; border-bottom:1px solid #888; padding:0 0 5px 5px; width:100%; margin:5px 0 0 -3px;}'
	+'</style>'
	+'</head>'
	+'<body>'
	+'<div class="top_wrap">'
		+'<h1 id="articleHead" onclick="//onClickHeader()">'+row.hiddenTitle+'</h1>'
		+'<div class="pub_info_wrap">'
			+'<span>'+((row.creater)?row.creater:"")+((row.pubdt)?'&nbsp;|&nbsp; <span class="number">'+util.defaultFormater(row.pubdt)+'</span>':"")+'</span>'
		+'</div>'
	+'</div>'
	+ row.innerHTML
	+'<script>'
	+'$(document).ready(function(){'
		+'$("a").each(function(){'
			+'$(this).bind("click",function(){'
				+'var theURL=this.getAttribute("href");'
			  	+'var eventObject = new Object;'
			  	+'var a = "URL";'
			  	+'eventObject[a] = theURL;'
			  	+'Ti.App.fireEvent("openBrowser",eventObject);'
			 	+'return false;'
			+'})'                         
		+'})'                 
	+'});'
	+'</script>'
	+'</body></html>';
	
	// this is only for XE RSS ( make absolute path )
	rtnHTML = rtnHTML.replace(/href="\?mid=(.*?)"/g, 'href="http://www.cckorea.org/xe/?mid=$1"');
	
	return rtnHTML;
}    

function onClickTwitterButton(articleUrl,addText){
	getShortenUrl(articleUrl,addText,function(responseText){
		var queryResultJSON = eval('('+responseText+')');
	  	var defaultText = "#cckorea "+ addText +" "+queryResultJSON.data.url;
		var w = Titanium.UI.createWindow({
			title:L('sendToTwitter'),
			url:'twitter/twitterWindow.js',
			backgroundColor:'#336699',
			defaultText:defaultText
		});
		w.open();
	});
	return;
}

function getShortenUrl(longUrl,addText,callback){
	var xhr = Ti.Network.createHTTPClient();
	xhr.open("POST",'http://api.bit.ly/v3/shorten');
    xhr.onload = function(){
	  callback(this.responseText);
	};
    xhr.send({
		"format":"json",
		"longUrl":longUrl,
		"login":config.bitly.login,
		"apiKey":config.bitly.apiKey
	});
}