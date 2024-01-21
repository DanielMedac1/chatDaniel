const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



//Registro de todos los usuarios
let usuarios = {};

// Registro de usuarios conectados
let usuariosConectados = {};
let usuariosPorSocket = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Añadir el nuevo usuario al registro

    socket.on('nuevo usuario', (datos, callback) => {
        const usuarioRegistrado = usuarios[datos.nombre];
        if (usuarioRegistrado && usuarioRegistrado === datos.pass) {
            // Si usuario y contraseña son correctos
            usuariosConectados[datos.nombre] = { 'nombre': datos.nombre, 'id': datos.id };
            usuariosPorSocket[datos.id] = { 'nombre': datos.nombre, 'id': datos.id };
            console.log('----------Listado de usuarios conectados----------');
            console.log(usuariosConectados);
            // Emitir solo la lista de usuarios conectados
            io.emit('usuarios conectados', Object.keys(usuariosConectados));
            callback({ mensaje: 'Nombre usuario: ' + datos.nombre + ' ID Usuario: ' + datos.id });
        } else {
            // El usuario o la contraseña son incorrectos
            callback({ mensaje: 'Error: Usuario o contraseña incorrectos' });
        }
    });

    // Emitir la lista actualizada de usuarios conectados, incluyendo el ID del socket propio
    // Emitir solo la lista de usuarios conectados
    io.emit('usuarios conectados', Object.keys(usuariosConectados));
    socket.on('chat message', (msg) => {
        Object.keys(usuariosConectados).forEach(function (nombreUsuario) {
            var usuario = usuariosConectados[nombreUsuario];
            console.log("NOMBRE DE USUARIO" + usuario.nombre);
            if (socket.id === usuario.id) {
                io.emit('chat message', { msg: msg, from: usuario.nombre, to: null });
            }

        });


    });
    socket.on('private message', (data) => {
        let destinatario = data.to;
        console.log("Destinatario:" + destinatario);
        let mensaje = data.msg;
        let socketRemitente = socket.id;
        console.log("-------------------------------------------------");
        console.log("Socket del remitente: " + socketRemitente);
        console.log("-------------------------------------------------");
        let socketDestinatario = '';
        let remitenteNombre = '';
        let remitenteID = '';
        let destinarioNombre = '';
        /* Object.keys(usuariosConectados).forEach(function (nombreUsuario) {
           console.log("Nombre de usuario: "+nombreUsuario);
           console.log("Destinatario: "+destinatario);  */
        //SACAR DATOS REMITENTE
        if (usuariosPorSocket.hasOwnProperty(socketRemitente)) {
            let usuarioRemitente = usuariosPorSocket[socketRemitente];
            console.log("-------------------------------------------------");
            console.log("Nombre del remitente: " + usuarioRemitente.nombre);
            console.log("ID del remitente: " + usuarioRemitente.id);
            console.log("-------------------------------------------------");
            console.log("Colección de usuario remitente: " + usuarioRemitente);
            remitenteNombre = usuarioRemitente.nombre;
            remitenteID = usuarioRemitente.id;
        }

        //SACAR DATOS DESTINATARIO
        if (usuariosConectados.hasOwnProperty(destinatario)) {
            let usuarioDestinatario = usuariosConectados[destinatario];
            console.log("-------------------------------------------------");
            console.log('Nombre destinatario:', usuarioDestinatario.nombre);
            console.log('ID destinatario:', usuarioDestinatario.id);
            console.log("-------------------------------------------------");
            socketDestinatario = usuarioDestinatario.id;
            destinarioNombre = usuarioDestinatario.nombre;
            console.log("Sockets Destinatario:" + socketDestinatario);
            if (usuarioDestinatario.nombre === destinatario) {
                //Enviar copia a uno mismo
                socket.to(socketDestinatario).emit('private message', {
                    msg: mensaje,
                    from: socketDestinatario,
                    to: socket.id,
                    nombre: remitenteNombre
                });
                //Enviar copia al destinatario
                console.log("Nombre del remitente: " + remitenteNombre);
                socket.emit('private message', {
                    msg: data.msg,
                    from: socket.id,
                    to: socketDestinatario,
                    nombre: remitenteNombre
                });
            } else {
                console.log("No existe ese usario");
            }
        }
    });

    socket.on('disconnect', () => {
        // Eliminar al usuario del registro cuando se desconecte
        console.log(usuariosConectados);
    
        // Buscar el usuario correspondiente al socket.id en usuariosPorSocket
        var usuarioDesconectado = usuariosPorSocket[socket.id];
    
        if (usuarioDesconectado) {
            // Eliminar al usuario del objeto usuariosConectados
            delete usuariosConectados[usuarioDesconectado.nombre];
    
            console.log('Usuario desconectado:', usuarioDesconectado.nombre);
            console.log('Usuarios conectados:', usuariosConectados);
    
            // Emitir la lista actualizada de usuarios conectados a todos los clientes
            io.emit('usuarios conectados', Object.keys(usuariosConectados));
        }

        console.log(`Usuario desconectado: ${socket.id}`);
        // Notificar a todos los usuarios sobre el cambio en la lista de conectados
        io.emit('usuarios conectados', Object.keys(usuariosConectados));

    });

});

// Manejar el registro de usuarios
app.post('/registro', (req, res) => {
    try {
        console.log(req.body);
        // Acceder a los datos enviados en el cuerpo de la solicitud
        const usuario = req.body.usuario;
        const pass = req.body.pass;
        console.log(usuario, pass);
        usuarios[usuario] = pass;

        console.log("Usuarios registrados: ", usuarios);

        res.send('Registro exitoso');

        // Enviar respuesta al cliente (puede ser un mensaje de éxito o error)
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).send('Error interno del servidor');
    }

});

http.listen(3000, () => {
    console.log('Escuchando en el puerto 3000');
});

