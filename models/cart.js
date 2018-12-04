/* Cart model */

//module exports makes it available to be called on in other files
module.exports = function Cart(oldCart) {
  //oldCart is a placeholder object;
  this.items = oldCart.items || {}; //|| is a boolean or; if oldCart.items is undefined use an empty object
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;

/* Adding a new product to cart (& checking if product already exists in cart) */
  this.add = function(itemValue, id, quantity, sizeOptions) {
    var storedItem = this.items[id];
    //if the current item you're adding to the cart is not part of the old cart, make a new item object
    if (!storedItem) {
      storedItem = this.items[id] = {item: itemValue, qty: 0, singleItemTotal: 0, size: sizeOptions, otherId: id};
    }
    //killing 2 birds w/ one stone here:
    //increase the qty of either the new item (if the item wasn't in the cart before)
    //or increase the qty of existing item; same w/ price
    storedItem.qty += quantity;
    storedItem.singleItemTotal = storedItem.item.price * storedItem.qty;
    //increase total qty of all items in cart; same with price but make it = to the aggrevated prices
    this.totalQty += quantity;
    this.totalPrice += storedItem.item.price * quantity;
  };

/* Reduce qty of item in cart */
  this.reduceByOne = function(id) {
    this.items[id].qty--; //reduce qty of item
    //overall price of item group total (ie: $12x3 = $36) - price of that single item ($12)
    this.items[id].price -= this.items[id].item.price;
    this.totalQty--; //reduce cart total qty and price
    this.totalPrice -= this.items[id].item.price;

    //if item qty=0 or less, delete item from cart
    if (this.items[id].qty <= 0) {
      delete this.items[id];
    }
  };

/* Remove item(s) from cart */
  this.removeItem = function(id) {
    this.totalQty -= this.items[id].qty;
    this.totalPrice -= this.items[id].price;
    delete this.items[id];
    }

/* Changing cart obj to an array so we can list the */
  this.generateArray = function() {
    var arr = [];
    for (var id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  }
};
