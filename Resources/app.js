/** ****************************************
 * Author : JongEun Lee (http://yomybaby.wordpress.com)
 * Some Right Reserved
 * under Creative Commons License ( BY )
 ****************************************** */

Titanium.include('XeRssTableView.js');



var tabGroup = Ti.UI.createTabGroup();

//CC 소식
var ccNewsWin = Ti.UI.createWindow({ title:L('ccNewsTab'), backgroundColor:'#fff'});
ccNewsWin.add(
	new XeRssTableView({rssUrl:"http://www.cckorea.org/xe/?mid=news&act=rss",openTarget:tabGroup})
);
var ccNewsTab = Ti.UI.createTab({  
    icon:'images/ccNews.png',
    title:L('ccNewsTab'),
    window:ccNewsWin
    //badge:Ti.App.Properties.getInt("ccNews")
});

//국내 사례
var caseWin = Ti.UI.createWindow({ title:L('koreaCase'), backgroundColor:'#fff'});
var tb1 = Titanium.UI.createTabbedBar({
	labels:[L('koreaCase'), L('globalCase'),L('meshupCase')],
	className:"caseTabbedBar",
	index:0,
	borderRadius:0,
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
});

var caseViews = [
	new XeRssTableView({rssUrl:"http://creative.cckorea.org/xe/?mid=domestic&act=rss",openTarget:tabGroup,className:"caseTable2"}),
	new XeRssTableView({rssUrl:"http://creative.cckorea.org/xe/?mid=international&act=rss",openTarget:tabGroup,className:"caseTable2"}),
	new XeRssTableView({rssUrl:"http://creative.cckorea.org/xe/?mid=mashup&act=rss",openTarget:tabGroup,className:"caseTable2"})
];

tb1.addEventListener('click', function(e)
{
	var idx=e.index;
	caseWin.title = tb1.labels[idx];
	for(var i=0,l=caseViews.length;i<l;i++){
		caseViews[i].zIndex = 1;
	}
	caseViews[idx].zIndex = 10;
});
caseWin.add(tb1);
caseWin.add( caseViews[2] );
caseWin.add( caseViews[1] );
caseWin.add( caseViews[0] );

var caseTab = Ti.UI.createTab({  
    icon:'images/aboutCC.png',
    title:L('ccCaseTab'),
    window:caseWin
});

//Favorite
var favoriteWin = Ti.UI.createWindow({
	title:L('favoriteTab'),
	backgroundColor:'white'
});
favoriteWin.add(Ti.UI.createLabel({text:L('favoriteMessage'), font:{fontSize:15},color:'#666',left:17,right:17}));
favoriteWin.add (new XeRssTableView({favoriteMode:true,openTarget:tabGroup}));
var favoriteTab = Ti.UI.createTab({
	icon:'images/light_star.png',
	title: L('favoriteTab'),
	window:favoriteWin
});

// About CC
var aboutCCWin = Titanium.UI.createWindow({  
    title:'About CC',
	url:'aboutcc.js',
    backgroundColor:'#fff'
});
var aboutCCTab = Titanium.UI.createTab({  
    icon:'images/light_info.png',
    title:'About CC',
    window:aboutCCWin
});

tabGroup.addTab(ccNewsTab);
tabGroup.addTab(caseTab);
tabGroup.addTab(favoriteTab);
tabGroup.addTab(aboutCCTab);
//open tab group
tabGroup.open();

Ti.App.addEventListener('openBrowser',function(e){
	Ti.Platform.openURL(e.URL);
});