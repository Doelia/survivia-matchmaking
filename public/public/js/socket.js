var socket = io.connect('http://localhost:8080');


// On reçoit la page de résultat d'un sondage
socket.on('resultsondage', function (json, html) {
	$("#content").html(html);
});

// On reçoit la page d'un sondage (on peut voter dessus)
socket.on('sondagePage', function (sondage, html) {

	$("#content").html(html);

	$('#sortable').sortable();
	$('#sortable').disableSelection();

	$('#sendVote').click(function (event) {

		var list = '';
		$('li.option').each(function(index) {
			list += $(this).attr('val') + '-';
		});

		if (list != '') {
			list = list.substr(0, list.length-1);
		}

		console.log(list);

		socket.emit('send_vote', sondage.idSondage, list);

		$('#blockValid').show(200);
		$('#blockVoter').hide(200);

		event.preventDefault();
	});

	$('.viewResult').click(function (event) {
		event.preventDefault();
		socket.emit('get_resultsondage', sondage.idSondage);
	});
});

// On veut charger une page de sondage sur laquelle on peut voter
function loadPageSondage(idSondage) {
	console.log("Chargement du sondage "+idSondage);
	socket.emit('get_sondage', idSondage);
	$('.header li').removeClass('active');
	$('#page_sondages').parent().addClass('active');
}


// On reçoit une liste de sondage
// tableau : tableau de sondage
// Type : publics, privates ou groupes
socket.on('list_sondages', function (type, tableau) {

	for (var i=0; i < tableau.length; i++) {
		var s = tableau[i];

		$('#list-'+type+' tbody').append(
			'<tr>'+
				'<td><a href="#" num="'+s.idSondage+'">'+s.titre+'</a></td>'+
				'<td>'+s.dateDebut+'</td>'+
				'<td>'+s.createur+'</td>'+
				'<td>'+s.nbrVotes+'</td>'+
                (isConnected?('<td>'+(s.aVote?'OUI':'NON')+'</td>'):'')+
			'</tr>'
		);

		$('#list-'+type+' td a').last().click(function (event) {
			event.preventDefault();
			loadPageSondage($(this).attr('num'));
		});
	}
});

socket.on('inviteMembre_reponse', function (suc, idSondage) {
	console.log("retour:"+idSondage);
	if (suc) {
		$('.inviterMembre[num='+idSondage+']').hide(200);
		$('.blockValid[num='+idSondage+']').show(200);
		$('.blockInvalid[num='+idSondage+']').hide(200);
	} else {
		$('.inviterMembre[num='+idSondage+']').show(200);
		$('.blockValid[num='+idSondage+']').hide(200);
		$('.blockInvalid[num='+idSondage+']').show(200);
	}
});


function getPage(page) {

	// Page d'accueil
	if (page == 'index') {
		$.get("templates/index", function(data) {
			$("#content").html(data);

			$('.boutonConnexion').click(function (event) {
				getPage('connexion');
				event.preventDefault();
			});

			$('.boutonInscription').click(function (event) {
				getPage('inscription');
				event.preventDefault();
			});
			
		});
		$('.header li').removeClass('active');
		$('#page_index').parent().addClass('active');

	}

	else if (page == 'groupes') {
		$.get( "groupes", function(data) {
			$('.header li').removeClass('active');
			$('#page_groupes').parent().addClass('active');
			$("#content").html(data);


            $('#form_createGroupe').submit(function(event) {
                event.preventDefault();
                socket.emit('create_groupe', ($('#type').val() == 'private'), $('#nameGroupe').val());
                getPage(page); // Refresh
            });

            $('.quitGroupe').click(function() {
               socket.emit("leaveGroup", $(this).attr('num'));
                getPage(page); // Refresh
            });

            $('.rmGroup').click(function() {
                socket.emit("rmGroup", $(this).attr('num'));
                getPage(page); // Refresh
            });

            $('.joinGroup').click(function() {
                socket.emit("inviteInGroup", $(this).attr('num'), $(this).attr('idMembre'));
                getPage(page); // Refresh
            });


            $('.invitInGroup').click(function() {
                var saisie = prompt("E-mail du membre à inviter :", "")
                if (saisie != null) {
                   socket.emit("inviteInGroup", $(this).attr('num'), saisie);
                    getPage(page);
                }
            });

            $('.boutonConnexion').click(function (event) {
                getPage('connexion');
                event.preventDefault();
            });
		});

	}

	// Page de la liste des sondages
	else if (page == 'sondages') {

		if (isConnected) {
			$.get( "templates/sondage_connect", function (data) {
				$("#content").html(data);
				socket.emit('list_sondages', 'publics');
				socket.emit('list_sondages', 'privates');
				socket.emit('list_sondages', 'groupes');

				$('.boutonCreer').click(function(event) {
					getPage('creersondage');
					event.preventDefault();
				});

			});
		} else {

			$.get("templates/sondage_noconnect", function(data) {
				$("#content").html(data);
				socket.emit('list_sondages', 'publics');

				$('.boutonConnexion').click(function (event) {
					getPage('connexion');
					event.preventDefault();
				});

			});
		}
		$('.header li').removeClass('active');
		$('#page_sondages').parent().addClass('active');

	}

	// Page de connexion
	else if (page == 'connexion') {
		$.get( "templates/connexion", function(data) {
			$("#content").html(data);

			$('#form_connexion').submit(function (event) {
				event.preventDefault();
				var packet = {
					mail: $('#mail').val(),
					mdp: $('#mdp').val()
				}
				socket.emit('connexion', packet);
			});

			$('.header li').removeClass('active');
		});
	}

	// Page d'inscription
	else if (page == 'inscription') {
		$.get( "templates/inscription", function(data) {
			$("#content").html(data);

			$('#form_inscription').submit(function (event) {

				event.preventDefault();

				var packet = {
					password: $('#mdp').val(),
					nom: $('#nom').val(),
					prenom: $('#prenom').val(),
					mail: $('#mail').val()
				}

				// On envoi le paquet pour l'inscription
				socket.emit('inscription', packet);



				// On se connecte juste après
				socket.on('inscription_ok', function() {
					var packetConnexion = {
						mail: $('#mail').val(),
						mdp: $('#mdp').val()
					}
					socket.emit('connexion', packetConnexion);
				});

			});

		});
	}

	// Page "Mon compte"
	else if (page == 'compte') {
		$.get( "compte", function(data) {
			$('.header li').removeClass('active');
			$('#page_compte').parent().addClass('active');
			$("#content").html(data);

			$('.btnshowinvit').click(function() {
				$('.inviterMembre[num='+$(this).attr('num')+']').show(200);
				$('.membreInvite[num='+$(this).attr('num')+']').val('');
				$('.blockValid[num='+$(this).attr('num')+']').hide(200);
			});

			$('.sendInvit').click(function() {
				socket.emit('invite_membre', $('.membreInvite[num='+$(this).attr('num')+']').val(), $(this).attr('num'));
			});

			$('.viewResult').click(function() {
				socket.emit('get_resultsondage', $(this).attr('num'));
			});

			$('.viewSondage').click(function() {
				loadPageSondage($(this).attr('num'));
			});

			$('.removeSondage').click(function() {
				socket.emit('remove_sondage', $(this).attr('num'));
				getPage('compte');
			})
		});
	}

	// Page de création de sondage
	else if (page == 'creersondage') {
		$.get( "templates/sondage_creer", function(data) {
			$("#content").html(data);

            socket.emit('getMyGroups');

            socket.on('myGroups', function(list) {
                for (var i=0; i < list.length; i++) {
                    var g = list[i];
                    $('#idGroupe').append('<option value="'+g.idGroupe+'">'+g.titre+'</option>');
                }
            });

            $('#type').change(function() {
                if ($(this).val() == 'groupe') {
                    $('.listGroups').show(200);
                } else {
                    $('.listGroups').hide(200);
                }
            });

			$( "#dateFin" ).datepicker({
			 	 dateFormat: "yy-mm-dd",
			});

			$('.ajouterOption').click(function(event) {

				var next = parseInt($('#listOptions .optionBlock:last').attr('num'));

				$('#listOptions').append(
					$('#listOptions .modele').html()
				);

				next++;
				
				$('#listOptions .optionBlock:last').attr('num', next);
				$('#listOptions .optionBlock:last .options_input').attr('num', next);
				$('#listOptions .optionBlock:last .control-label').html('Option '+next);

				event.preventDefault();
			});

			$('#form_creerSondage').submit(function (event) {
				console.log('creer');	
				event.preventDefault();

				var tableauOptions = new Array();
				$('.options_input').each(function (index) {
					tableauOptions.push($(this).val());
				});

				var json = {
					titre: $('#titre').val(),
					description: $('#description').val(),
					dateFin: new Date($('#dateFin').val()),
					type: $('#type').val(),
                    idGroupe: $('#idGroupe').val(),
					optionsList: tableauOptions
				}
				
				socket.emit('create_sondage', json);

				$('#form_creerSondage').hide(200);

				$('.row').append('<p class="bg-success" style="display: none">Sondage créé avec succès !</p>');
				$('.bg-success').show(200);

			});

		});
	}

}

$(document).ready(function() {

	// Click sur le bouton "Index"
	$('#page_index').click(function (event) {
		getPage('index');
		event.preventDefault();
	});

	// Click sur le bouton "Sondages"
	$('#page_sondages').click(function (event) {
		getPage('sondages');
		event.preventDefault();
	});

	// Click sur le bouton "Sondages"
	$('#page_groupes').click(function (event) {
		getPage('groupes');
		event.preventDefault();
	});



	// JEU DE TEST //
	var packet = {};

	packet = {
		mail: 'a@a.a',
		mdp: 'b'
	};

	packet = {
		mail: 'doelia@free.fr',
		mdp: 'wugaxu'
	};

	//socket.emit('connexion', packet);
	getPage('index');

	//loadPageSondage(1);

});




