module.exports = function Cart(oldCart) {
  //oldCart is an object; || is a boolean or
  //if oldCart.items is undefined use an empty object
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;

//adding a new product to cart (& checking if product already exists in cart)
  this.add = function(item, id) {
    var storedItem = this.items[id];
    //if the current item you're adding to the cart is not part of the old cart,
    //then make a new item object
    if (!storedItem) {
      storedItem = this.items[id] = {item: item, qty: 0, price: 0};
    }
    //killing 2 birds w/ one stone here:
    //increase the qty of either the new item (if the item wasn't in the cart before)
    //or increase the qty of existing item; same w/ price
    storedItem.qty++;
    storedItem.price = storedItem.item.price * storedItem.qty;
    //increase total qty of all items in cart; same with price but make it = to the aggrevated prices
    this.totalQty++;
    this.totalPrice += storedItem.item.price;
  };

//Reduce qty of item in cart
  this.reduceByOne = function(id) {
    //reduce qty of item
    this.items[id].qty--;
    //overall price of item group total (ie: $12x3 = $36) - price of that single item ($12)
    this.items[id].price -= this.items[id].item.price;
    //reduce cart total qty and price
    this.totalQty--;
    this.totalPrice -= this.items[id].item.price;

    //if item qty=0 or less, delete item from cart
    if (this.items[id].qty <= 0) {
      delete this.items[id];
    }
  };

  //Remove item(s) from cart
    this.removeItem = function(id) {
      this.totalQty -= this.items[id].qty;
      this.totalPrice -= this.items[id].price;
      delete this.items[id];
    }

  //changing cart obj to an array so we can list them
  this.generateArray = function() {
    var arr = [];
    for (var id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  }
};
