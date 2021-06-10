// ==UserScript==
// @name         Oh No, My Queen!
// @version      0.1
// @description  Automatically resign when you lose your Queen, unless you can equalize or win on this turn.
// @author       Collided Scope
// @include      https://lichess.org/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.0/chess.min.js
// ==/UserScript==

const hope = () => {
  // Use the number of plies to determine whose turn it is.
  const turn = 'w b'[$('.buttons').next().children().length % 3];
  // workaround for chess.js's lack of a set_turn() method
  const game = new Chess(`8/8/8/8/8/8/8/8 ${turn} - - 0 1`);

  $('piece:not(.ghost)').each(function() {
    const [color, type] = this.cgPiece.split(' ');
    const letter = type == 'knight' ? 'n' : type[0];
    // When we get here, our captured Queen might still be in the DOM. We could
    // poll to wait for her to disappear, or just not put her in the game.
    if (letter != 'q' || color[0] != turn)
      game.put({type: letter, color: color[0]}, this.cgKey);
  });

  return can_equalize(game) || can_checkmate(game);
};

const can_equalize = game =>
  game.moves({verbose: true}).some(move => move.captured == 'q');

const can_checkmate = game => game.moves().forEach(move => {
  game.move(move);
  if (game.in_checkmate()) return true;
  game.undo();
});

const you_resign_now = () => {
  $('.resign')[0].click();
  $('.yes')[0].click();
};

const observer = new MutationObserver(() => {
  if ($('.material-top .queen').length && !hope())
    you_resign_now();
});

if ($('.main-board').length) {
  setTimeout(() => {
    if (taken = $('.material-top')[0])
      observer.observe(taken, {childList: true, subtree: true});
  }, 1000);
}
