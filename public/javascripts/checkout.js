// Stripe
//front end - not running on node.js server

Stripe.setPublishableKey('pk_test_cUP9Is5sXWwN7obZmSxHdkHQ');

//referencing the id used in checkout.hbs to import the checkout form
var $form = $('#checkout-form');

$form.submit(function(event) {
  $('#charge-error').addClass('hidden');
  //disable submit button so user can't press it multiple times during the validation process
  $form.find('button').prop('disabled', true);
  Stripe.card.createToken({
  name: $('#card-name').val(),
  number: $('#card-number').val(),
  cvc: $('#card-cvc').val(),
  exp_month: $('#card-expiry-month').val(),
  exp_year: $('#card-expiry-year').val()
}, stripeResponseHandler);
  return false;
});

function stripeResponseHandler(status, response) {
  if (response.error) { // Problem!

    // Show the errors on the form
    $('#charge-error').text(response.error.message);
    $('#charge-error').removeClass('hidden');
    $form.find('button').prop('disabled', false); // Re-enable submission

  } else { // Token was created!

    // Get the token ID:
    var token = response.id;

    // Insert the token into the form so it gets submitted to the server:
    $form.append($('<input type="hidden" name="stripeToken" />').val(token));

    // Submit the form:
    $form.get(0).submit();

  }
};
