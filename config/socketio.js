module.exports = (socket,io,knex) => {
	var onlineUser = "";
	io.on('connection', function(socket){
		
		socket.on('pilih user',(obj)=>{
			knex('conversation').where({'to_id':obj.idPengirim,'from_id':obj.idPenerima}).orWhere({'to_id':obj.idPenerima,'from_id':obj.idPengirim}).update('unread',0).then(()=>{
				knex('conversation').where({'to_id':obj.idPenerima,'from_id':obj.idPengirim}).orWhere({'to_id':obj.idPengirim,'from_id':obj.idPenerima}).then((row)=>{
					var msg = row;
					// console.log(row)
					msg.push({userPengirim:obj.userPengirim,userPenerima:obj.userPenerima})
					socket.emit('update chat',msg);
				})
			})
		})
		socket.on('updateRead',(user)=>{
			knex('conversation').where({'from_id':user.idPengirim,'to_id':user.idPenerima}).orWhere({'from_id':user.idPenerima,'to_id':user.idPengirim}).update('unread',0).then(()=>{
				console.log('diupdate')
			})
		})
		socket.on('send message',(obj)=>{
			// console.log(obj)
			var data = {
				chat : obj.msg,
				from_id : obj.idPengirim,
				to_id : obj.idPenerima,
				unread : 1,
			}
			// socket.emit('pesan baru',{username : obj.username, chat:obj.msg});
			knex.insert(data).into('conversation').then(()=>{
				// console.log('ditambah',username)
				knex('conversation').where({'to_id':data.to_id,'from_id':data.from_id}).orWhere({'to_id':data.from_id,'from_id':data.to_id}).then((row)=>{
					var msg = row;
					msg.push({userPenerima:obj.userPenerima,userPengirim:obj.userPengirim,unread:1})
					// console.log(msg)
					socket.broadcast.emit('update chat',msg);
				})
			})
		})
	});
}