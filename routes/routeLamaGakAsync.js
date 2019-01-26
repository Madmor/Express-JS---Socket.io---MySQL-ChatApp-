var bcrypt = require('bcrypt-nodejs'),
	async = require('async');
module.exports = (app,knex,upload) => {

	app.get('/',(req,res)=>{
		res.render('login',{mess:req.flash('mess')});
	})
	app.get('/home',auth,(req,res)=>{
		knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((rows)=>{
			var user = rows;
			knex('conversation').where({'to_id':req.session.user.id,unread:1}).then((row)=>{
				var obj = {
					mess:req.flash('mess'),
					error:req.flash('err'),
					alluser:user,
					users:JSON.stringify(user),
					read:JSON.stringify(row),
				}
				res.render('index',obj);
			})
		})
	})
	app.get('/logout',(req,res)=>{
		var io = req.io;
		knex('user').where('username',req.session.user.username).update('online',0).then(()=>{
			knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((rows)=>{
				io.emit('updateAlluser',rows);
				console.log(req.session.user.username,'meninggalkan chat')
				req.session.destroy((err)=>{
					if(!err) {
						res.redirect('/')
					}
				})
			})
		})
	})

	app.post('/upload',upload.single('avatar'), (req,res) => {
		console.log(req.file.path);
		var path = (req.file.path).split('\\');
		var namaFoto = path[path.length - 1];
		var io = req.io;
		knex('user').where('username',req.session.user.username).update({fotoProfile : namaFoto}).then( (rows) => {
			req.flash('mess','Berhasil upload foto profil !');
			req.flash('err','false');
			// console.log(rows[0]);
			req.session.user.fotoProfile = namaFoto;
			knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((users)=>{
				io.emit('updateAlluser',users);
				res.redirect('/home');
			})
		},(err)=>{
			console.log(err);
		})
	})
	app.post('/update',(req,res)=>{
		var body = req.body;
		var io = req.io;
		knex('user').where('username',req.session.user.username).update({username:body.username,deskripsi:body.deskripsi}).then((rows)=>{
			req.flash('mess','Berhasil Update profil mu !');
			req.flash('err','false');

			req.session.user.username = body.username;
			req.session.user.deskripsi = body.deskripsi;
			knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((users)=>{
				io.emit('updateAlluser',users);
				res.redirect('/home');
			})
		})
	})

	app.post('/register',(req,res)=>{
		var body = req.body;
        // console.log(body);
        knex('user').where('username',body.username).orWhere('email',body.email).then( (rows) => {
            if(rows.length){
                req.flash('mess', 'USERNAME atau EMAIL sudah digunakan')
                res.redirect('/')
            } else {
                var newUserMysql = {
                    username: body.username,
                    password: bcrypt.hashSync(body.password, null, null),
                    email:body.email,
                    deskripsi:body.deskripsi
                };
                knex.insert(newUserMysql).into('user').then( (rows) => {
                	knex('user').where('username',body.username).then( (user) => {
	                    req.session.user = user[0];
	                    res.redirect('/home');
                	})
                })
            }
        }, (err) => {
            return err
    	})
	})
	app.post('/login',(req,res)=>{
		// console.log('disini',req.body);
		var io = req.io;
		knex('user').where('username',req.body.username).then( (rows) => {
                if(!rows.length){
                	req.flash('mess','user belum terdaftar')
                    res.redirect('/')
                }
                if (!bcrypt.compareSync(req.body.password, rows[0].password)){
                    req.flash('mess','Oops! Password anda salah.')
                	res.redirect('/')
                }
                global.user = rows[0];
                req.session.user = rows[0];
                knex('user').where('username',req.session.user.username).update('online',1).then(()=>{
                	knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((onlineuser)=>{
						io.emit('updateAlluser',onlineuser);

		                res.redirect('/home')
					})
                })
        }, (err) => { return err })
	})
}

var auth = (req,res,next) => {
	if(!req.session.user){
		req.flash('mess','Login dulu bro!');
		res.redirect('/')
	} else {
		next();
	}
}