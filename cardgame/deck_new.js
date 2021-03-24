// create the card value options
const VALUES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const COST    = ['1']
const TITLE   = ['minion']
const IMG     = ['']
const TEXT    = ['this is a basic minion']
const ATTACK  = ['1']
const INFO    = ['']
const DEFENSE = ['1']


// create a deck object
export default class Deck {
  // the constructor creates a new deck
  constructor(cards = freshDeck()) {
    this.cards = cards;
  }
  // count the number of cards
  get numberOfCards() {
    return this.cards.length;
  }

  pop() {
    return this.cards.shift();
  }

  push(card) {
    this.cards.push(card);
  }

  // shuffle the cards into 2 random piles
  shuffle() {
    for (let i = this.numberOfCards - 1; i > 0; i--) {
      const newIndex = Math.floor(Math.random() * (i + 1));
      const oldValue = this.cards[newIndex];
      this.cards[newIndex] = this.cards[i];
      this.cards[i] = oldValue;
    }
  }
}
// the card object
class Card {
  // the card existe out of a suit and a value
  constructor(value) {
    this.value = value;
  }

  // create the card in HTML
  getHTML() {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card")
    cardDiv.dataset.value = `${this.value}`;
    return cardDiv;
  }
}
// make new list of card from the arrays
function freshDeck() {
  return VALUES.map((value) => {
    return new Card(value);
  });
}
