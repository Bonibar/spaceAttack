var http = require('http');
var fs = require('fs');

var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

var io = require('socket.io').listen(server);

var clients = [];
var teams = [];

function add_team(teamName) {
    var res = true;
    for (i = 0; i < teams.length; ++i) {
        if (teams[i] == teamName) {
            res = false;
            break;
        }
    }
    if (res == true) {
        teams.push(teamName);
    }
}

io.sockets.on('connection', function (socket, pseudo) {
    socket.isReady = false;
    socket.team = "Any";
    socket.role = "Any";
    socket.nick = "Anonymous";
    clients.push(socket);
    
    socket.on('setTeam', function(teamName) {
        socket.team = teamName;;
        add_team(socket.team);
        
    });
    socket.on('setRole', function(roleName) {
        socket.role = roleName;
    });
    socket.on('setNick', function(nickName) {
        socket.nick = nickName;
    });

    // Dès qu'on reçoit un "message" (clic sur le bouton), on le note dans la console
    socket.on('message', function (message) {
        // On récupère le pseudo de celui qui a cliqué dans les variables de session
        console.log(socket.pseudo + ' me parle ! Il me dit : ' + message);
    });
    
    socket.on('disconnect', function () {
        var deleteTeam = true;
        for (i = 0; i < clients.length; ++i) {
            if (clients[i] == socket) {
                clients.splice(i, 1);
                --i;
            }
            else if (clients[i].team == socket.team)
                deleteTeam = false;
        }
        if (deleteTeam == true) {
            for (i = 0; i < teams.length; ++i) {
                if (teams[i] == socket.team) {
                    teams.splice(i, 1);
                    --i;
                }
            }
        }
        console.log(socket.nick + ' se deconnecte !');
    });
});

function checkClientsOfTeam(teamName) {
    var res = true;
    var nbrClients = 0;
    for (i = 0; i < clients.length; ++i) {
        if (clients[i].team == teamName) {
            ++nbrClients;
            if (clients[i].nick != "Anonymous" && clients[i].team != "Any" && clients[i].role != "Any")
                clients[i].isReady = true;
            if (clients[i].isReady == false)
                res = false;
        }
    }
    if (nbrClients != 3)
        res = false;
    return (res);
}

function waitTeamsReady() {
    var res = true;
    console.log('--------');
    if (teams.length < 2)
    {
        console.log('There is not enough teams to start ! [' + teams.length + '/2]');
        res = false;
    }
    for (j = 0; j < teams.length; ++j) {
        if (checkClientsOfTeam(teams[j]) == false) {
            console.log('==> Team "' + teams[j] + '" is not ready !');
            res = false;
        } else {
            console.log('==> Team "' + teams[j] + '" is ready !');
        }
    }
    console.log('--------')
    return (res);
};

function needToWait(timeToWait) {
    if (!waitTeamsReady())
        setTimeout(function() { needToWait(timeToWait); }, timeToWait * 1000);
}

needToWait(30);

server.listen(8080);