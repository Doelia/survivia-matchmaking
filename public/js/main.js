var socket = null;
var delay_fake = 0;

function setCookie(cname,cvalue,exdays) {
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) 
	{
		var c = ca[i].trim();
		if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
	return "";
}

function run_app() {
	load_template();
}

function stopAll() {
	socket = null;
		$('body').html('Force disconnect');
}

function processElements() {
$('.tip').tooltip({'placement': 'top', 'container': 'body'});
}

function inArray(tab, value) {
	for (var i in tab) {
		if (tab[i] == value)
			return true;
	}
	return false;
}

function removeOfArray(tab, value) {
	for (var i in tab) {
		if (tab[i] == value)
			delete tab[i];
	}
}

var inCreatePartie = false;
var isCreator = false;
var username = '';
var invitationsPending = new Array();
var presentsDansLaPartie = new Array();

function load_template() {
	$.get("base.html", function (data) {
		$("#content").html(data);

		socket.on('refresh_connected', function(list) {
			$('#team_list').html('');
			for (var i in list) {
				var m = list[i];
				var badges = '';
				if (m.isConnected) {
					badges += '<span class="badge tip" title="Connecté sur l\'interface"><i class="fa fa-dot-circle-o"></i></span>';
					if (inCreatePartie && isCreator && m.username != username) {
						if (inArray(invitationsPending, m.username)) {
							badges += '<span class="badge alert-warning tip invitePlayer" username="'+m.username+'" title="Invitation envoyée"><i class="fa fa-spinner fa-spin"></i></span>';
						} else {
							badges += '<span style="cursor: pointer;" class="badge alert-success tip invitePlayer" username="'+m.username+'" title="Envoyer une invitation pour cette partie"><i class="fa fa-reply"></i></span>';
						}
						
					}
				} else {
					badges += '<span class="badge alert-gray tip" title="Déconnecté"><i class="fa fa-circle-o"></i></span>';
				}
				$('#team_list').append('<li class="list-group-item">'+badges+' '+m.username+'</li>');
			}
			processElements();

			$('.invitePlayer').click(function() {
				var namePlayer = $(this).attr('username');
				if (!inArray(invitationsPending, namePlayer)) {
					invitationsPending.push(namePlayer);
					socket.emit('invite-player', namePlayer);
				}
			});
		});

		socket.on('requestStateContentLeft', function(val) {
			if (val == 'ready') { // Pret pour créer/rejoindre une partie
				$.get("left_ready.html", function (data) {
					$('#left-part').html(data);
					$('#create_partie').click(function() {
						socket.emit('create-partie');
					});
				});
			}
			setTimeout(function() {
				$('#progress_loading').width('100%');
				setTimeout(function() {
					$('#modal_loading').modal('hide');
				}, 300);
			}, delay_fake/3);
		});

		socket.on('partie-preparation', function(json) {
			presentsDansLaPartie = new Array();
			inCreatePartie = true;
			isCreator = json.isCreator;
			$.get("left_preparation.html", function (data) {
				$('#left-part').html(data);
				socket.emit('requestConnectedList');
			});
		});

		socket.on('participants-update', function(json) {
			console.log(json);
		});

		socket.on('invitation', function(inviteur) {
			$('#nameplayerInvite').html(inviteur);
			$('#modal_invitation').modal({show: 'true',
					keyboard: 'false',
					backdrop: 'static'});
			//$('#modal_invitation').attr('inviteur', inviteur);
			$('#accepteInvitation').click(function() {
				socket.emit('reponse-rejoin', inviteur, true);		
				$('#modal_invitation').modal('hide');		
			});
			$('#refuserInvitation').click(function() {
				socket.emit('reponse-rejoin', inviteur, false);		
				$('#modal_invitation').modal('hide');	
			});
		});

		socket.on('reponse-rejoin', function(usernameInvite, reponse) {
			console.log("réponse de requete");
			socket.emit('requestConnectedList');
			removeOfArray(invitationsPending, usernameInvite);
		});


		socket.emit('requestConnectedList');
		socket.emit('requestStateContentLeft');

	});
}

function start_loading(login) {
	$('#modal_loading').modal({show: 'true',
						keyboard: 'false',
						backdrop: 'static'});
	$('#progress_loading').width(0);
	setTimeout(function() {
		$('#progress_loading').width('5%');
	}, delay_fake/3);
	setTimeout(function() {
		$('#loading_msg').html('Connexion au web-socket...');
		$('#progress_loading').width('30%');
		socket = io.connect('http://localhost:8080');
		socket.on('connexion_ok', function() {
			setTimeout(function() {
			$('#loading_msg').html('Authentification...');
			$('#progress_loading').width('60%');

			username = login;
			socket.emit('auth_1', {username: username, key: '4654654'});
			socket.on('auth_reponse', function(json, key) {
				setTimeout(function() {
					if (json == 'ok') {
						setCookie('sessionkey', key, 365);
						$('#loading_msg').html('Chargement du contenu de l\'interface...');
						$('#progress_loading').width('90%');
						setTimeout(function() {
							run_app();
						}, delay_fake/3);
					} else {
						$('#loading_body').html('<div class="alert alert-danger" role="alert">Erreur lors de l\'autentification. Veuillez retourner sur le site, vous déconnecter/reconnexion à votre compte puis réésayer.</div>');
					}
				}, delay_fake*2);
			});
		}, delay_fake);
		});
		socket.on('force_disconnect', function() {
			stopAll();
		});
	}, delay_fake);
}

$(document).ready(function() {

	//start_loading('Doelia');
	processElements();
});




