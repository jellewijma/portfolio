window.addEventListener('resize', () => {
  // We execute the same script as before
  let vh = window.innerWidth * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gaming").style.display = "none";
  document.getElementById("customMechanicalKeyboards").style.display = "none";
  document.getElementById("muziek").style.display = "none";
  document.getElementById("photography").style.display = "block";
  document.getElementById("school").style.display = "none";
  document.getElementById("hobbies").style.display = "grid";
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