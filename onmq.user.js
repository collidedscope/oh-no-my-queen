// ==UserScript==
// @name         Oh No, My Queen!
// @version      0.2.2
// @description  Automatically resign when you lose your Queen, unless you can equalize or win on this turn.
// @author       Collided Scope
// @include      https://lichess.org/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.0/chess.min.js
// ==/UserScript==

// When we lose our Queen and can't immediately retaliate, we resign if
// our opponent is now ahead by at least this many points of material.
const IMBALANCE_TOLERANCE = 5;

// message to send while resigning
const PARTING_WORDS = "Oh no, my Queen!"

const game = new Chess();
const mo_config = {childList: true, subtree: true};

const on_exist = (selector, rate, timeout, callback) => {
  const start = performance.now();
  const poller = setInterval(() => {
    const found = $(selector);
    if (found.length || performance.now() - start > timeout) {
      clearInterval(poller);
      if (found.length) callback(found);
    }
  }, rate);
};

const can_equalize = () =>
  game.moves({verbose: true}).some(move => move.captured == 'q');

const can_checkmate = () => game.moves().forEach(move => {
  game.move(move);
  if (game.in_checkmate()) return true;
  game.undo();
});

const you_resign_now = () => {
  if (PARTING_WORDS) {
    let chat = $('.mchat__say')[0];
    chat.value = PARTING_WORDS;
    chat.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
  }
  $('.resign')[0].click();
  $('.yes')[0].click();
};

const move_init = new MutationObserver((mutations, mo) => {
  mo.disconnect();
  const moves = mutations[0].addedNodes[0];
  game.move(moves.childNodes[1].innerText); // extract and play first move
  move_watcher.observe(moves, mo_config);
});

const move_watcher = new MutationObserver(mutations => {
  const node = mutations.pop().addedNodes[0];
  if (game.move(node.innerText)?.captured == 'q' // some Queen captured
      && $('.rclock-bottom.running').length      // and our turn to move
      && !(can_equalize() || can_checkmate())    // and we can't retaliate
      && $('.material-top score').text() >= IMBALANCE_TOLERANCE)
    you_resign_now();
});

if ($('.main-board').length) {
  on_exist('.buttons', 10, 1000, b => {
    if (b.next().hasClass('message'))
      // At the start of the game, the element we want to watch for new moves
      // doesn't exist yet, so watch for mutations on the parent until it does.
      move_init.observe(b[0].parentNode, mo_config);
    else {
      // game is in progress; load moves and set up watcher
      const plies = b.next().children().not(':nth-child(3n+1)');
      plies.each((_, e) => game.move(e.innerText));
      move_watcher.observe(b.next()[0], mo_config);
    }
  });
}
