/*
*/


var isConnected = false;

function setCookie(cname,cvalue,exdays)
{
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname)
{
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) 
	{
		var c = ca[i].trim();
		if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
	return "";
}


$(document).ready(function() {

	socket.on('connexion_ok', function(membre, key) {
		isConnected = true;

		setCookie('sessionkey', key, 365);

		console.log("Connexion OK sur "+getCookie('sessionkey'));

		$('.header ul').append('<li><a href="#" id="page_compte" class="link" style="display: none;">' +
            ' <span class="fa fa-lock"></span>Mon compte</a></li>');

		$('#page_compte').show(200);
		$('#page_compte').click(function(event) {
			getPage('compte');
		});

		getPage('compte');
	});


	socket.on('connexion_fail', function() {
		$('#connexion_fail').show(500);
	});

});

