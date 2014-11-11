<div class="navbar navbar-default">
	<div class="navbar-header">
		<a class="navbar-brand" href="#">SURVIVIA Assaut</a>
	</div>
	<div class="navbar-collapse collapse navbar-responsive-collapse">
		<ul class="nav navbar-nav">
		</ul>

		<ul class="nav navbar-nav navbar-right">
			<li><a href="#">Connecté sur Doelia</a></li>
			<li>
				<button type="button" class="btn btn-default navbar-btn">Quitter</button>
			</li>
		</ul>
	</div>
</div>



<div class="row">
	<div class="col-md-8">
		<h1>Créer un match en team 4vs4</h1>
		<p>Invitez 4 membres de votre équipe pour pouvoir lancer la partie</p>

		<table class="table table-striped">
			<thead>
				<tr>
					<th>#</th>
					<th>Pseudo</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><i class="fa fa-gears tip" title="Créateur de la partie"></i></td>
					<td>
						<img src="https://minotar.net/avatar/Doelia/15"> Doelia
					</td>
					<td></td>
				</tr>
				<tr>
					<td></td>
					<td>
						<img src="https://minotar.net/avatar/Slymp/15"> Slymp
					</td>
					<td><button class="btn btn-danger">Expulser</button></td>
				</tr>
				<tr>
					<td></td>
					<td><i>Place libre. Invitez un membre avec le menu de droite.</i></td>
					<td></td>
				</tr>
				<tr>
					<td></td>
					<td><i>Place libre. Invitez un membre avec le menu de droite.</i></td>
					<td></td>
				</tr>
			</tbody>
		</table>

		<p>
			<button type="button" class="btn btn-danger">Annuler</button>
			<button type="button" class="btn btn-success">Lancer la partie!</button>
		</p>
	</div>
	<div class="col-md-4">
		<h1>Team Staff</h1>
		<ul class="list-group">
			<li class="list-group-item">
				<span class="badge ">
				<i class="fa fa-dot-circle-o"></i>
				</span>
				<span class="badge alert-success tip" title="Envoyer une invitation pour cette partie">
				<i class="fa fa-plus-square"></i>
				</span>
				Doelia
			</li>
			<li class="list-group-item">
				<span class="badge alert-warning"><i class="fa fa-circle-o"></i></span>
				Slymp
			</li>
		</ul>
		
	</div>

</div>

<script type="text/javascript">
	$('.tip').tooltip({'placement': 'top'});
</script>
