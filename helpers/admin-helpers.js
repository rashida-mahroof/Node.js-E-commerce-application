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

module.exports ={

    doLogin:(adminData)=>{
        //console.log(adminData);
        let response = {}
        return new Promise(async(resolve,reject)=>{
          let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({$and:[{email:adminData.Email},{password:adminData.Password}]})
          if(admin){
              response.admin = admin;
              response.status = true
              resolve({status:true})
              console.log("login success");
          } 
          else{
              console.log("login failed");
              resolve({status:false})
          }
        })
    },
    
    getAllUsers:()=>{
         return new Promise(async(resolve,reject)=>{
        //     let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
        //     resolve(users)
        




        let userDetails = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          //  { $match: { _id: objectId("61d05206842733c13a06598d") } },
            {
                $lookup:
                {
                    from: collection.USER_COLLECTION,
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
           

           
           
        ]).toArray();
        resolve(userDetails)
        console.log(userDetails);
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