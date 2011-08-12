/** ****************************************
 * Author : JongEun Lee (http://yomybaby.wordpress.com)
 * Some Right Reserved
 * under Creative Commons License ( BY )
 ****************************************** */
Ti.include('oauth_adapter.js');
Ti.include('../config.js');
var curWin = Titanium.UI.currentWindow;
var oAuthAdapter = null;

var label = Titanium.UI.createButton({
	title:curWin.title,
	color:'#fff',
	style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
});

var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

var close = Titanium.UI.createButton({
	title:L('close'),
	style:Titanium.UI.iPhone.SystemButtonStyle.DONE
});
var sendBtn = Titanium.UI.createButton({
	title:L('send'),
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
	enabled:false
});

var onWindowClose = function(){
	Ti.API.info('IN HERE');
	curWin.close();
};

close.addEventListener('click', onWindowClose);

sendBtn.addEventListener('click', function(){
	send2Twitter();
	sendBtn.enabled=false;
});

// create and add toolbar
var toolbar = Titanium.UI.createToolbar({
	items:[close,flexSpace,label, flexSpace,sendBtn],
	top:0,
	borderTop:false,
	borderBottom:true
});
curWin.add(toolbar);


curWin.addEventListener('open', function(){
	
	ta1.focus();
	countBtn.title = String(140 - ta1.value.length); 
	oAuthAdapter = new OAuthAdapter(
		config.twitter.pConsumerSecret,
		config.twitter.pConsumerKey,
		config.twitter.pSignatureMethod
	);
	 
	 // load the access token for the service (if previously saved)
 	oAuthAdapter.loadAccessToken('twitter');
	
	if (oAuthAdapter.isAuthorized() == false)
	{
		 // this function will be called as soon as the application is authorized
		 var receivePin = function() {
			 // get the access token with the provided pin/oauth_verifier
		     oAuthAdapter.getAccessToken('https://api.twitter.com/oauth/access_token');
			 // save the access token
		     oAuthAdapter.saveAccessToken('twitter');
			 sendBtn.enabled=true;
			 ta1.enabled=true;
		 };
		
		 // show the authorization UI and call back the receive PIN function
		 oAuthAdapter.showAuthorizeUI('https://api.twitter.com/oauth/authorize?' + oAuthAdapter.getRequestToken('https://api.twitter.com/oauth/request_token'), receivePin, onWindowClose);
	}else{
		sendBtn.enabled=true;
		ta1.enabled=true;
	}
	setTimeout(function() { ta1.focus(); }, 10);
});


var ta1 = Titanium.UI.createTextArea({
	value:curWin.defaultText,
	height:200,
	width:320,
	top:44,
	left:0,
	font:{fontSize:20},
	color:'#000',
	textAlign:'left',
	appearance:Titanium.UI.KEYBOARD_APPEARANCE_ALERT,	
	keyboardType:Titanium.UI.KEYBOARD_DEFAULT,
	returnKeyType:Titanium.UI.RETURNKEY_DEFAULT,
	borderWidth:1,
	borderColor:'#bbb',
	borderRadius:0,
	suppressReturn:false,
	enabled:false
});

ta1.addEventListener('change',function(e)
{
	sendBtn.enabled = (e.value.length==0)?false:true;
	countBtn.title = String(140 - e.value.length); 
});

curWin.add(ta1);

var countBtn = Titanium.UI.createButton({
	title: "140",
	top: 220,
	left: 280,
	width: 30,
	height: 20,
	font:{fontSize:12}
});

curWin.add(countBtn);

function send2Twitter(){
	oAuthAdapter.send('https://api.twitter.com/1/statuses/update.json', [['status',ta1.value]],'Twitter',onSendTwitt,onSendTwittFail);
}

function onSendTwitt(){
	alert(L('twitterSendComplete'));
	curWin.close();
}

function onSendTwittFail(){
	alert(L('twitterSendFail'));
	sendBtn.enabled=true;
}