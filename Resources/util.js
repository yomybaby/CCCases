var util = {
	/**
	 * make plain text
	 * @param {string} iptStr
	 */
	removeTagAndURL : function (iptStr){
		var tagExp = /<[a-z|\/]+[^<>]*>/ig;
	    var plainText = iptStr.replace(tagExp, "");
	    plainText = plainText.replace(/&nbsp;/ig, "");
	    plainText = plainText.replace(/(((f|ht){1}tp:\/\/)[-a-zA-Z0-9@:%_\+.~#?&\/\/=]+)/ig,"");
	    plainText = plainText.replace(/<!--(.*?\s)*?-->/g,"");
	    plainText = plainText.replace(/\s/g,"");
		return plainText;
	},
	/**
	 * Pad a number with leading zeroes
	 * @param {number} number
	 * @param {number} length
	 */
	pad : function(number,length){
		if(typeof(length) == "number"){
			var str = '' + number;
		    while (str.length < length) {
		        str = '0' + str;
		    }
		    return str;
		}
		return "";
	},
	/**
	 * korean Date format
	 * @param {number} dateInt
	 */
	defaultFormater: function (dateInt){
		var date = new Date(Number(dateInt));
		var datestr=date.getFullYear()+'년 '+util.pad(date.getMonth()+1,2)+'월 '+util.pad(date.getDate(),2)+'일 ';
		if (date.getHours()>=12){
			datestr+=' 오후'+(date.getHours()==12 ? util.pad(date.getHours(),2) : util.pad(date.getHours()-12,2))+':'+util.pad(date.getMinutes(),2);
		} else {
			datestr+=' 오전'+date.getHours()+':'+date.getMinutes();
		}
		return datestr;
	}
}
