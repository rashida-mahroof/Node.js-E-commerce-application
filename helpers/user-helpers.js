var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcryptjs')
const async = require('hbs/lib/async')
const { status } = require('express/lib/response')
const { stringify } = require('querystring')
var objectId = require('mongodb').ObjectID;
const collections = require('../config/collections')
const { Collection } = require('mongodb')
const { response } = require('express')
const { resolve } = require('path/posix')

module.exports = {
    doSignup: (userData)=>{
        //console.log(userData);
        return new Promise(async(resolve,reject)=>{
            //var salt = bcrypt.genSaltSync(10);   
                    userData.Password = await bcrypt.hash(userData.Password,10)
                           //console.log(userData.Password);
                            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                            resolve(data.insertedId)
                       })
                       
            })
           
    },
    doLogin: (userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginstatus= false
            let response = {}
            let user =await db.get().collection(collection.USER_COLLECTION).findOne({Email: userData.Email})
            if(user){
               
                   
                  //var res = bcrypt.compare(user.Password,userData.Password)
                //   console.log(user.Password);
                //   console.log(userData.Password);
                   var a= bcrypt.compare( userData.Password,user.Password).then((status)=>{
                     if(status){
                         console.log("success");
                         response.user = user
                         response.status = true
                         resolve(response)
                     }
                     else{
                         console.log("failed");
                         resolve({status:false})
                     }
                    });       
            }else{
                console.log("login failed");
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj = {
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
           let userCart =  await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }
                        ).then(()=>{
                            resolve()
                        })
                }else{
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                        $push: {products:proObj}
                    }
                    ).then((response)=>{
                        resolve()
                    })
                }
            }else{

                let cartObj = {
                    user: objectId(userId),
                    products:[proObj]
                }
    
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        console.log(userId);
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'         //splits the cart object into products array
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
    
                
            ]).toArray()
            resolve(cartItems)
            
            
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = null
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
              count = cart.products.length
            }
            resolve(count)
        })
        
    },
    changeProductQuantity:(details)=>{
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
            if(count==-1 && quantity==1){
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({_id:objectId(details.cart)},
                        {
                            $pull:{products:{item:objectId(details.product)}}
                        }
                        ).then((response)=>{
                            resolve({removeProduct:true})
                        })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart), 'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':count}
                    }
                ).then((response)=>{
                resolve({status:true})
                }) 
                console.log(details.count);
          
            }
        })

    },
    removeCartItem:(details)=>{
        
        return new Promise(async(resolve,reject)=>{
           await db.get().collection(collection.CART_COLLECTION)
                        .updateOne({_id:objectId(details.cart)},
                        {
                            $pull:{products:{item:objectId(details.product)}}
                        }
                        ).then((response)=>{
                            resolve({removeProduct:true})
                        })
        })
    },
    getTotalAmount:(userId)=>{   
            return new Promise(async(resolve,reject)=>{
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:'$products'         //splits the cart object into products array
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            total:{$sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.Price' }]}}
                        }
                    }
                ]).toArray()
               // console.log(total[0].total);
                resolve(total[0].total)   
            })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status = order['payment-method'] === 'cod'?'placed':'pending'
            let orderObj ={
                deliveryDetails:{
                    name : order.name,
                    mobile: order.mobile,
                    pincode: order.pincode,
                    address: order.address
                },
                userId:objectId(order.userId),
                products: products,
                paymentMethod: order['payment-method'],
                status: status,
                total: total,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                resolve();
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart);
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:objectId(userId)}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'         //splits the cart object into products array
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
    
                
            ]).toArray()
            resolve(orderItems)
        })
    }
}