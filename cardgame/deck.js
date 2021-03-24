// create the card value options
const SUITS = ["♥","♦","♠","♣"]
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]

// create a deck object
export default class Deck {
  // the constructor creates a new deck
  constructor(cards = freshDeck()) {
    this.cards = cards
  }
  // count the number of cards
  get numberOfCards(){
    return this.cards.length
  }

  pop(){
    return this.cards.shift()
  }

  push(card){
    this.cards.push(card)
  }

  // shuffle the cards into 2 random piles
  shuffle(){
    for (let i = this.numberOfCards - 1; i > 0; i--) {
      const newIndex = Math.floor(Math.random() * (i + 1))
      const oldValue = this.cards[newIndex]
      this.cards[newIndex] = this.cards[i]
      this.cards[i] = oldValue
    }
  }
}
// the card object
class Card {
  // the card existe out of a suit and a value
  constructor(suit, value) {
    this.suit = suit
    this.value = value
  }
  // set the color to the counter fiting suit color
  get color(){
    return this.suit === '♠' || this.suit === '♣' ? 'black' : 'red'
  }
  // create the card in HTML
  getHTML() {
    const cardDiv = document.createElement('div')
    cardDiv.innerText = this.suit
    cardDiv.classList.add("card", this.color)
    cardDiv.dataset.value = `${this.value} ${this.suit}`
    return cardDiv
  }
}
// make new list of card from the arrays
function freshDeck(){
  return SUITS.flatMap(suit => {
    return VALUES.map(value =>{
      return new Card(suit, value)
    })
  })
}