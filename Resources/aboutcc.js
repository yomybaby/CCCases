var curWin = Titanium.UI.currentWindow;
curWin.borderColor="#aaa";
var curTab = Titanium.UI.currentTab;
curWin.backgroundImage = '../images/list_bg.jpg';

curWin.addEventListener('focus',function(){
	curWin.showTabBar();
});

var imageView = Titanium.UI.createImageView({
 	image:'images/aboutCCImage1.png',
	width:180,
	height:130,
	top:0
});
curWin.add(imageView);
var data = [];

data.push({title:L('gotoCCKoreaSite'), hasChild:false, header:'Creative Commons Korea', url:'http://cckorea.org',height:40});
data.push({title:L('registCCKoreaMembership'), hasChild:false, url:'http://cckorea.org/xe/?mid=join_members',height:40});
data.push({title:L('logoutTwitter'), hasChild:false, header:L('preferenece'), height:40});

// create table view
var tableview = Titanium.UI.createTableView({
	borderColor:'#aaa',
	style: Ti.UI.iPhone.TableViewStyle.GROUPED,
	data:data,
	height:290,
	top:130
});


tableview.addEventListener('click', function(e)
{
	var event = new Object();
	event.title = e.row.title;
	event.url = e.row.url;
	event.hidTabBar = true;
	
	if(e.row.url){
		//openWebviewWindowOnCurTab(event);
		Ti.App.fireEvent('openBrowser',{"URL":e.row.url});
	} else {
		var dialog = Titanium.UI.createOptionDialog({
			options:[L('logoutTwitter'), L('cancel')],
			destructive:0,
			cancel:1,
			title:L('logoutTwitter')
		});
		
		// add event listener
		dialog.addEventListener('click',function(event)
		{
			switch(event.index){
				case 0:
				var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'twitter.config');
				if (file.exists) { file.deleteFile(); }
				(Titanium.UI.createAlertDialog({
				    message: L('logoutTwitterMessage')
				})).show();
				break;
			}
		});
		dialog.show();
	}
});

curWin.add(tableview);