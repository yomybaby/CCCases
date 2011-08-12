var webViewWindow = {
	win_:null,
	webView_:null,
	create : function(){
		if(!win_){
			win_ = Ti.UI.createWindow();
		}
		if(!webView_){
			webView_ = Ti.UI.createWebView();
		}
		win_.add(webView_);
	},
	setControlToolbar : function(){
		if(!win_) {
			return;
		};
		
	}
}
