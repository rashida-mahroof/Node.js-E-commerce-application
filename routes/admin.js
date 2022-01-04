var express = require('express');
const req = require('express/lib/request');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers')
const productHelpers = require('../helpers/product-helpers');
const session = require('express-session');
const { response } = require('express');
const { registerHelper } = require('hbs');

/* GET users listing. */
router.get('/', function(req, res, next) {

    res.render('admin/login',{"loginErr":req.session.adminLoginErr});
    req.session.adminLoginErr = false
}) 
router.post('/login',(req,res)=>{
  adminHelpers.doLogin(req.body).then((response)=>{
    console.log(response);
    if(response.status){
      req.session.admin = response.admin
      req.session.adminLoggedIn  = true
      res.redirect('view-products')
    }else{
      req.session.adminLoginErr = "Invalid username or password"
      res.redirect('/admin')
    }
  }) 
})
router.get('/logout',(req,res)=>{
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin')
})
router.get('/view-products', function(req, res, next) {
  let admin = req.session.admin
  productHelpers.getAllProducts().then((products)=>{
    //console.log(products);
    res.render('admin/view-products',{admin:true,products});
  
  })  

});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.Image)
   productHelpers.addProduct(req.body,(id)=>{
     let Image = req.files.Image
     Image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
       if(!err){
        res.render("admin/add-product")
       }else{
         console.log(err)
       }
     })
     
   })
})

router.get('/delete-product/:id',(req,res)=>{
    let proId = req.params.id
    console.log(proId);
    productHelpers.deleteProduct(proId).then((response)=>{
      res.redirect('/admin/')
    })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product =await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render("admin/edit-product",{product})

})
router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let Image = req.files.Image
      let id = req.params.id
      Image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
         res.render("admin/")
        }else{
          console.log(err)
        }
      })
    }
  })
})

router.get('/all-users',(req,res,next)=>{
  adminHelpers.getAllUsers().then((users)=>{
    console.log(users);
    res.render('admin/all-users',{admin:true,users})
  })
})


router.get('/view-ordered-products/:id',async(req,res)=>{
  console.log(req.params.id);
  let products=await  adminHelpers.getOrderProducts(req.params.id)
    res.render('admin/ordered-products',{admin:true,products})
    console.log(products);
  })

  // router.get('/all-orders',(req,res)=>{
  //   adminHelpers.getAllOrders().then((orders)=>{
  //     res.render('admin/all-orders',{admin:true})
  //   })
  // })
module.exports = router;
