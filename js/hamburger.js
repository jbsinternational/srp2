$('.hamburger').click(function() {
  $(this).toggleClass('expanded').siblings('nav').slideToggle();
});