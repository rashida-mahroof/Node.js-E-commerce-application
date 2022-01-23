var express = require('express');
const req = require('express/lib/request');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const session = require('express-session');
const async = require('hbs/lib/async');
const { response } = require('express');
const { registerHelper } = require('hbs');
const { render } = require('express/lib/response');
const verifyLogin = (req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
let user = req.session.user
console.log(user);
//let cartCount = null
if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)

 await productHelpers.getAllProducts().then((products)=>{
    //console.log(products);
    res.render('user/view-products',{products,user,cartCount});
  
  })
}else{
  await productHelpers.getAllProducts().then((products)=>{
    //console.log(products);
    res.render('user/view-products',{products});
  
  })
}
});

router.get('/login', (req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    
    res.render('user/login',{"loginErr":req.session.userLoginErr});
    req.session.userLoginErr = false
  }
})

router.get('/signup',(req,res)=>{
  res.render('user/signup');
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.user = response
    req.session.userLoggedIn = true
    res.redirect('/')

  })
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user = response.user
      req.session.userLoggedIn  = true
      res.redirect('/')
    }else{
      req.session.userLoginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
    let products =await userHelpers.getCartProducts(req.session.user._id)
    console.log(products.length);
    if(products.length!=0){
      let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
      //console.log(products)
      res.render('user/cart',{products,'user':req.session.user,totalValue})
     }else{
      res.render('user/cart',{'user':req.session.user})
     }
})

router.get('/add-to-cart/:id',verifyLogin,async(req,res)=>{
  //console.log("api call");
if(req.session.user){
    await userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
}else{
  res.redirect('/login')
}
})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
   userHelpers.changeProductQuantity(req.body).then(async(response)=>{
   response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/remove-item',(req,res,next)=>{
  console.log(req.body);
  userHelpers.removeCartItem(req.body).then((response)=>{
    res.json(response)
  }) 
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products =await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='cod'){
      res.json({status:true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })
    }
  })
})

router.get('/order-success',(req,res)=>{
    res.render('user/order-success',{user:req.session.user})
})

router.get('/orders/:id',verifyLogin,async(req,res)=>{
 // console.log(req.params.id);
  let orders = await userHelpers.getUserOrders(req.params.id)
  // console.log(orders);
  res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view-order-products/:id',async(req,res)=>{
  let products =await userHelpers.getOrderProducts(req.params.id)
  // console.log(products);
  res.render('user/view-order-products',{user:req.session.user,products})
})

router.post('/cancel-order',(req,res,next)=>{
  console.log(req.body);
  userHelpers.cancelOrder(req.body).then((response)=>{
    res.json(response)
  }) 
})

router.post('/search-product',async(req,res,next)=>{
  console.log(req.body);
   let products = await productHelpers.getSearchResults(req.body)
     console.log(products);
     let user = req.session.user
     if(req.session.user){
      
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      res.render('user/view-products',{products,user,cartCount}) 
     }
      else{
        res.render('user/view-products',{products}) 
        // res.json({products});
      }
})
module.exports = router;

