document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gaming").style.display = "none";
  document.getElementById("customMechanicalKeyboards").style.display = "none";
  document.getElementById("muziek").style.display = "none";
  document.getElementById("photography").style.display = "block";
  document.getElementById("school").style.display = "none";
  document.getElementById("hobbies").style.display = "grid";

  // /* Storing user's device details in a variable*/
  // let details = navigator.userAgent;

  let regexp = /android|iphone|kindle|ipad/i;

  let isMobileDevice = regexp.test(details);

  var bgParticles = Array.from(document.getElementsByClassName("mobile"));

  console.log(bgParticles);

  if (isMobileDevice) {
    console.log("You are using a Mobile Device");
    // disable bg blur on mobile
    bgParticles.forEach(element => {
      element.style.display = "none";
      console.log(element);
    });
  } else {
    bgParticles.forEach(element => {
      element.style.display = "block";
    });
    console.log("You are using Desktop");
  }
});

function changePage(page) {
  switch (page) {
    case 'hobbies':
      document.getElementById("gaming").style.display = "none";
      document.getElementById("customMechanicalKeyboards").style.display = "none";
      document.getElementById("muziek").style.display = "none";
      document.getElementById("photography").style.display = "block";
      document.getElementById("school").style.display = "none";
      document.getElementById("hobbies").style.display = "grid";
      document.getElementById("hobbySelector").classList.add("selected");
      document.getElementById("schoolSelector").classList.remove("selected");
      break;
    case 'school':
      document.getElementById("gaming").style.display = "none";
      document.getElementById("customMechanicalKeyboards").style.display = "none";
      document.getElementById("muziek").style.display = "none";
      document.getElementById("photography").style.display = "none";
      document.getElementById("school").style.display = "block";
      document.getElementById("hobbies").style.display = "none";
      document.getElementById("schoolSelector").classList.add("selected");
      document.getElementById("hobbySelector").classList.remove("selected");
      break;
  }
}


function changeHobby(hobby) {
  switch (hobby) {
    case 'gaming':
      document.getElementById("gaming").style.display = "block";
      document.getElementById("customMechanicalKeyboards").style.display = "none";
      document.getElementById("muziek").style.display = "none";
      document.getElementById("photography").style.display = "none";
      break;
    case 'cmk':
      document.getElementById("gaming").style.display = "none";
      document.getElementById("customMechanicalKeyboards").style.display = "block";
      document.getElementById("muziek").style.display = "none";
      document.getElementById("photography").style.display = "none";
      break;
    case 'muziek':
      document.getElementById("gaming").style.display = "none";
      document.getElementById("customMechanicalKeyboards").style.display = "none";
      document.getElementById("muziek").style.display = "block";
      document.getElementById("photography").style.display = "none";
      break;
    case 'foto':
      document.getElementById("gaming").style.display = "none";
      document.getElementById("customMechanicalKeyboards").style.display = "none";
      document.getElementById("muziek").style.display = "none";
      document.getElementById("photography").style.display = "block";
      break;
  }
}