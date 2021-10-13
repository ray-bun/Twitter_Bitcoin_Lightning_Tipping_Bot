module.exports = function formatNumber(num) {
    var array = num.toString().split("");
    var index = -3;
    while (array.length + index > 0) {
      array.splice(index, 0, ",");
      // Decrement by 4 since we just added another unit to the array.
      index -= 4;
    }
    return array.join("");
  }
  
