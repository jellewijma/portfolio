// import the object Deck for deck.js
import Deck from "./deck_new.js";

const deckPlayer = document.querySelector(".deck-player");
const playerHand = document.querySelector(".hand-player");

let state, deck

// prepare the game
startGame();
function startGame() {
  deck = new Deck();
  console.log(deck);
  state = 'draw'

  for (let times = 0; times < 4; times++) {
    drawCard(true)
  }

}

document.getElementById("deck").addEventListener("click", () => {
  if (state === "draw") {
    drawCard(false)
  }
});

function drawCard(pc) {
  if (pc === false) {
    state = 'place_card'
  }

  // get a card form the pile
  const playerCard = deck.pop()
  // put the card form the pile in to the players hand
  playerHand.appendChild(playerCard.getHTML())
}

$(document).ready(function () {
  $(function () {
      $("#hand-player, #battle-field-player").sortable({
          connectWith: ".drageble",
          cursor: "move"
      }).disableSelection();
  });
});