$(document).ready(function () {
  $(function () {
      $("#hand-player, #battle-field-player").sortable({
          connectWith: ".card",
          cursor: "move"
      }).disableSelection();
  });
});