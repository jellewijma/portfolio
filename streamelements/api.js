const getBtn = document.getElementById('get-btn');
const postBtn = document.getElementById('post-btn');
const show = document.getElementById('show');

const getData = () => {
    axios.defaults.headers.common["Authorization"] = 'Bearer d80uer4y7ccfaoy078nb39g4rpdia6';
    axios.defaults.headers.common["Client-ID"] = 'dtl5hjirog33oqahml36ln8hu7h0i2';
    axios.get('https://api.twitch.tv/helix/channels?broadcaster_id=132607940').then(response => {
        console.log(response)
        
        streamTitle = response['data']['data'][0]['title'];
        
        titleParts = streamTitle.split(" - ");

        document.getElementById('title_name').innerText = titleParts[1]
        document.getElementById('title_preacher').innerText = titleParts[2]

        
        // document.getElementById('title').innerText = response['data']['data'][0]['title']


    })
};

const sendData = () => {};

const shows = () => {
    console.log(document.location.hash)
    // Get the client id out of the hash
    clientId = document.location.hash;

    clientId_stripped = clientId.substring(1);
    clientId_clean = clientId_stripped.split('&');
    console.log(clientId_clean[0])
    clientId_ready = clientId_clean[0].split('=');
    console.log(clientId_ready[1])
};

getBtn.addEventListener('click', getData);
postBtn.addEventListener('click', sendData);
show.addEventListener('click', shows);

//  id 132607940 channels?broadcaster_id=132607940