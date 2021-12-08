var express = require('express');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  let products = [
    {
      name : "IPHONE 11 PRO",
      category : "MObile",
      description : "lorem ipsem sit amet dolor it.",
      image : "https://static.toiimg.com/thumb/resizemode-4,msid-71395006,imgsize-500,width-800/71395006.jpg"
    },
    {
      name : "OPPO F11",
      category : "MObile",
      description : "lorem ipsem sit amet dolor it.",
      image : "https://img.tatacliq.com/images/i6/1348Wx2000H/MP000000004463836_1348Wx2000H_20200805234048.jpeg"
    },
    {
      name : " SAMSUNG S20",
      category : "MObile",
      description : "lorem ipsem sit amet dolor it.",
      image : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHFjGQl7NRWDEBQbXdWzxNOk172p0tm3HlzQ&usqp=CAU"
    },
    {
      name : "REDMI NOTE 10",
      category : "MObile",
      description : "lorem ipsem sit amet dolor it.",
      image : "https://static.digit.in/default/56df7a071797e0355cc2f6f95093fefd89c43c94.jpeg?tr="
    }
  ]
  res.render('index', { products,admin:false });
});

module.exports = router;
