$(document).ready(function() {
	// console.log(allfoto);
	$('.modal').modal();
	$('.dropdown-button').dropdown({
          belowOrigin: true, // Displays dropdown below the button
          alignment: 'left', // Displays dropdown with edge aligned to the left of button
        }
    );
	var fotoDefault = "this.src='/fotoprofil/noavatar.png'";


	// var notif = {};
	for(let i=0;i<unread.length;i++){
		username = alluser.find((el) => unread[i].from_id == el.id);
		banyak = unread.map((el)=>{ el.from_id == username.id })
		// console.log(username)
		$('.'+username.username).html('<span class="custom white-text badge teal" style="min-width:1px;">'+banyak.length+'</span>');
	}
	// console.log(alluser,unread)

	$(document).on('click','.clickable',function(event) { //jika menambahkan html setelah dokumen dimuat maka onclick nya seperti ini
		// alert(idUser);
		username = $(this).children('span.title').html();
		$('.chatHead').html(username);
		pilih = true;
		terpilih = username;
		$('.'+terpilih).html('');
		idPenerima = alluser.find((el) => el.username == terpilih).id;

		socket.emit('pilih user',{userPengirim:user,userPenerima:terpilih,idPengirim:idUser,idPenerima:idPenerima}); //belum siap
	});


	// $('#scroll').scroll(function(event) {
	// 	console.log($(this).scrollTop())
	// });
	

	$(document).on('click','.msgSend',function(event) {
		if($('#text').val().trim() != '' && pilih){
			idPenerima = alluser.find((el) => el.username == terpilih).id;

			socket.emit('send message',{idPengirim:idUser, userPengirim:user, idPenerima:idPenerima, userPenerima:terpilih, msg : $('#text').val().trim()})
			
			var li = '<li><div class="row"><div class="col s7 offset-s5 light" style="display:flex;justify-content:flex-end"><p class="teal lighten-2 white-text" style="border-radius:10px;padding:10px;max-width:100%">';
				li+=$('#text').val().trim();
				li+='</p><img src="/fotoprofil/';

				li+=alluser.find((el) => el.username == user).fotoProfile+'"';
				li+=' class="chatProfil" style="margin-left:10px" onerror="'+fotoDefault+'"></div></div></li>';
			
			$('#msg').append(li)	
			$('#text').val('').focus();
		} else if(!pilih) {
			swal('Gagal !','Siapa yang mau anda chat, pilih dulu !','error')
		} else {
			swal('Gagal !','Pesan kosong, tidak dapat mengirim !','error')
		}
		var x = $('div#scroll').scrollTop()
		$('div#scroll').scrollTop(x+1000)
	});

	socket.on('update chat',(chat)=>{
		// alert('message?: DOMString')
		if(chat[chat.length-1].userPenerima == user && terpilih != chat[chat.length-1].userPengirim ){
			username = alluser.find((el) => chat[chat.length-1].userPengirim.toString() == el.username)
			
			x = {
				from_id:username.id,
				to_id:idUser
			}
			unread.push(x)
			banyak = unread.map((el)=>{ el.from_id == username.id })
			
			$('.'+chat[chat.length-1].userPengirim).html('<span class="custom white-text badge teal" style="min-width:1px;">'+banyak.length+'</span>');
		}

		// alert('message?: DOMString')

		if((chat[chat.length-1].userPenerima == terpilih && chat[chat.length-1].userPengirim == user)  || (chat[chat.length-1].userPenerima == user && chat[chat.length-1].userPengirim == terpilih)){
			$('#msg').html('');
			// alert('message?: DOMString')
			for(let i=0;i<chat.length;i++){
				if(chat[i].chat !== undefined){
					if(chat[i].from_id == idUser){
						var li = '<li><div class="row"><div class="col s7 offset-s5 light" style="display:flex;justify-content:flex-end"><p class="teal lighten-2 white-text" style="border-radius:10px;padding:10px;max-width:100%">';
						li+=chat[i].chat;
						li+='</p><img src="/fotoprofil/';
						li+=alluser.find((el)=>el.username == user).fotoProfile+'"';
						li+=' class="chatProfil" style="margin-left:10px" onerror="'+fotoDefault+'"></div></div></li>';
						$('#msg').append(li)
					} else {
						var li = '<li><div class="row"><div class="col s7 light" style="display:flex;"><img src="/fotoprofil/';
						li+=alluser.find((el)=>el.username == terpilih).fotoProfile; 
						li+='" class="chatProfil" style="margin-right:10px" onerror="'+fotoDefault+'"><p class="white" style="border-radius:10px;padding:10px;max-width:100%">';
						li+=chat[i].chat;
						li+='</p></div></div></li>';
						$('#msg').append(li)
					}
				}
			}
		}
		$('div#scroll').scrollTop(1000*1000);

		if(chat[chat.length-1].userPenerima == user && terpilih == chat[chat.length-1].userPengirim){
			idPengirim = alluser.find((el) => el.username == chat[chat.length-1].userPengirim).id
			socket.emit('updateRead', {idPenerima:idUser,idPengirim:idPengirim});
		}
	})

	socket.on('updateAlluser',(users)=>{
		// alert('hi')
		alluser = users;
		$('#alluser').html('');
		for(let i=0;i<users.length;i++){
			if(users[i].username != user){
				var li = `
					<li class="collection-item avatar clickable" style="cursor:pointer !important;">
				      <img src="/fotoprofil/`+users[i].fotoProfile+`" onerror="this.src='/fotoprofil/noavatar.png'" style="object-fit:cover;object-position:left" class="circle">
				      <span class="title">`+users[i].username+`</span>
				      <p>
				         `+users[i].deskripsi+` <br>`;

				    if(users[i].online == 1){
				    	li+= '<span class="light blue white-text" style="padding:0 10px">online</span>';
				    } else {
				    	li+= '<span class="light red white-text" style="padding:0 10px">offline</span>'
				    }

				    li += `</p><a href="#!" class="secondary-content `+users[i].username+`"></a></li>`;
				$('#alluser').append(li);
			}
		}
		for(let i=0;i<unread.length;i++){
			username = alluser.find((el) => unread[i].from_id == el.id);
			banyak = unread.map((el)=>{ el.from_id == username.id })
			$('.'+username.username).html('<span class="custom white-text badge teal" style="min-width:1px;">'+banyak.length+'</span>');
		}
		// console.log(unread)
	})
});