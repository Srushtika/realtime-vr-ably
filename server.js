var eyes = {}
var pupils = {}
var arms = {}
var avatars = {}
var VRchannel
var myId

console.log('starting')

//connecting to ably
var ably = new Ably.Realtime({ authUrl: '/auth' });
ably.connection.once('connected', function () {
    myId = ably.auth.tokenDetails.clientId;
    console.log(`My id is ${myId}`)
    startApp(myId)
})

function startApp(userId) {
    console.log(`Inside startApp`)
    var x = Math.random() * (20 - (-20)) + (-20);
    var y = 0;
    var z = 0;
    var initialPosition = { x: x, y: y, z: z };
    VRchannel = ably.channels.get('vr-channel');
    VRchannel.presence.enter()
    var currentUser = {
        type: 'a-box',
        attr: {
            position: initialPosition,
            rotation: "0 0 0",
            color: "#373737",
            depth: "1",
            height: "1",
            width: "1"
        }
    }
    var camera = document.getElementById('user-cam');
    function networkTick() {
        var latestPosition = camera.getAttribute('position');
        var latestRotation = camera.getAttribute('rotation');
        currentUser.attr = {
            position: latestPosition,
            rotation: latestRotation
        }
        VRchannel.publish('attr-change', currentUser)
    };
    setInterval(networkTick, 1000);
    VRchannel.presence.get(function (err, members) {
        for (var i in members) {
            console.log(`Member id ${members[i].clientId}`)
            subscribeToAvatarChanges(members[i].clientId)
        }
    });
    VRchannel.presence.subscribe('enter', function (member) {
        var memberData = JSON.stringify(member)
        var memberJSON = JSON.parse(memberData)
        console.log(`User with clientID ${memberJSON.clientId} has entered`)
        subscribeToAvatarChanges(memberJSON.clientId)
    })
    VRchannel.presence.subscribe('leave', function (member) {
        console.log(`User with clientID ${JSON.stringify(member.clientId)} has left`)
        removeAvatar(JSON.stringify(member.clientId))
    })

}
function removeAvatar(id) {
    console.log(`Removing avatar for ${eval(id)}`)
    var idToRemove = eval(id).toString()
    var scene = document.getElementById('scene');
    scene.removeChild(avatars[idToRemove]);
}

//add Avatar when user enters the app
function createAvatar(id, rec) {
    console.log(`Id inside createAvatar is ${id}`)
    var attr = JSON.stringify(rec.data.attr)
    var new_attr = JSON.parse(attr)
    var type = JSON.stringify(rec.data.type)
    var newBox = document.createElement(eval(type));
    for (var key in new_attr) {
        newBox.setAttribute(key, new_attr[key]);
    }
    console.log('Creating eyes')
    var leye = document.createElement('a-entity')
    leye.setAttribute('mixin', 'eye')
    var reye = document.createElement('a-entity')
    reye.setAttribute('mixin', 'eye')


    console.log('Creating pupils')
    var lpupil = document.createElement('a-entity')
    lpupil.setAttribute('mixin', 'pupil')
    var rpupil = document.createElement('a-entity')
    rpupil.setAttribute('mixin', 'pupil')

    console.log('Creating arms')
    var larm = document.createElement('a-entity')
    larm.setAttribute('mixin', 'arm')
    var rarm = document.createElement('a-entity')
    rarm.setAttribute('mixin', 'arm')

    var x = JSON.stringify(rec.data.attr.position.x)
    var y = 0;
    var z = 0;

    var leyex = x + 0.25
    var leyey = y + 0.20
    var leyez = z - 0.6

    var reyex = x - 0.25
    var reyey = y + 0.20
    var reyez = z - 0.6


    var lpx = x + 0.25
    var lpy = y + 0.20
    var lpz = z - 0.8

    var rpx = x - 0.25
    var rpy = y + 0.20
    var rpz = z - 0.8

    leye.setAttribute('position', leyex + " " + leyey + " " + leyez)
    leye.setAttribute('id', 'leye' + id)
    reye.setAttribute('position', reyex + " " + reyey + " " + reyez)
    reye.setAttribute('id', 'reye' + id)

    lpupil.setAttribute('position', lpx + " " + lpy + " " + lpz)
    lpupil.setAttribute('id', 'lpupil' + id)
    rpupil.setAttribute('position', rpx + " " + rpy + " " + rpz)
    rpupil.setAttribute('id', 'rpupil' + id)

    var larmx = x - 0.5
    var larmy = y - 1.8
    var larmz = z

    var rarmx = x + 0.5
    var rarmy = y - 1.8
    var rarmz = z

    larm.setAttribute('position', larmx + " " + larmy + " " + larmz)
    larm.setAttribute('id', 'larm' + id)
    larm.setAttribute('rotation', '0 0 -10')
    rarm.setAttribute('position', rarmx + " " + rarmy + " " + rarmz)
    rarm.setAttribute('id', 'rarm' + id)
    rarm.setAttribute('rotation', '0 0 10')

    //wrapping the individual avatar entities inside a single entity
    var avatarRoot = document.createElement('a-entity');
    avatarRoot.appendChild(newBox);
    avatarRoot.appendChild(leye);
    avatarRoot.appendChild(reye);
    avatarRoot.appendChild(lpupil);
    avatarRoot.appendChild(rpupil);
    avatarRoot.appendChild(larm);
    avatarRoot.appendChild(rarm);
    avatarRoot.setAttribute('id', id)
    avatarRoot.setAttribute('position', { x: x, y: y, z: z })

    var scene = document.getElementById('scene');
    scene.appendChild(avatarRoot);

    avatars[id] = avatarRoot;
}

//subscribe to changes in attributes
function subscribeToAvatarChanges(id) {
    console.log(`subscribeToAvatarChanges id is ${id}`)
    VRchannel.subscribe('attr-change', function (data) {
        //console.log('Attributes changed')
        var avatarData = JSON.stringify(data)
        var avatarJSON = JSON.parse(avatarData)
        if (avatarExists(avatarJSON.clientId)) {
            updateAvatar(avatarJSON.clientId, avatarJSON)
        } else {
            if (avatarJSON.clientId != myId)
                createAvatar(avatarJSON.clientId, avatarJSON)
        }
    })
}

//check if avatar needs to be created or updated
function avatarExists(id) {
    console.log(`Avatar check for ${id} result is ${avatars.hasOwnProperty(id)}`)
    return avatars.hasOwnProperty(id);
}


//update Avatar according to changing attributes
function updateAvatar(id, userRecord) {
    //console.log(`Inside updateAvatar`)
    var avatar = avatars[id];
    for (var i = 0; i < avatar.attributes.length; i++) {
        console.log(`Avatar attr is ${avatar.attributes[i].name} val is ${avatar.attributes[i].value}`)
    }
    var position = JSON.stringify(userRecord.data.attr.position)
    var rotation = JSON.stringify(userRecord.data.attr.rotation)
    console.log(`New position is ${position}`)
    console.log(`New rotation is ${rotation}`)
    avatar.setAttribute('position', JSON.parse(position));
    avatar.setAttribute('rotation', JSON.parse(rotation))
}

