import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup } from "../src/db/cleanup"
import ReviewController from "../src/controllers/reviewController"
import ReviewDAO from "../src/dao/reviewDAO"
import { Role, User } from "../src/components/user"
import { ProductReview } from "../src/components/review"
import { ProductNotFoundError } from "../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../src/errors/reviewError"
import dayjs from "dayjs";




const routePath = "/ezelectronics" //Base route path for the API

//Default review infromation
const reviewToAdd= { score: 2, comment: "test" }
const model01 = "test01"
const model02 = "test02"
const model03 = "test03"
const model04 = "test04"

//Default user information
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

//Default product information
const productInfo01 = {sellingPrice: 500, model: model01, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo02 = {sellingPrice: 500, model: model02, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo03 = {sellingPrice: 500, model: model03, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo04 = {sellingPrice: 500, model: model04, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const testProductReview01 = new ProductReview (productInfo01.model, testCustomer.username, reviewToAdd.score, dayjs().format('YYYY-MM-DD'), reviewToAdd.comment)

const RC = new ReviewController() //Create a new instance of the controller
const reviewDAO = new ReviewDAO()

//Before executing tests
//Remove everything from test database
//Create an Admin and a Customer User
//Add a product to the db test
beforeAll(async () => {
    jest.setTimeout(20000);
    const registeringManager = await request(app).post(routePath + "/users")
        .send({username: manager.username, password: manager.password, name: manager.name, role: "Manager",surname: manager.surname})
        expect(registeringManager.status).toBe(200);
    
    const registeringCustomer = await request(app).post(routePath + "/users")
        .send({username: customer.username, password: customer.password, name: customer.name, role: "Customer",surname: customer.surname})
        expect(registeringCustomer.status).toBe(200);
    
    const registeringAdmin = await request(app).post(routePath + "/users")
        .send({username: admin.username, password: admin.password, name: admin.name, role: "Admin",surname: admin.surname})
        expect(registeringAdmin.status).toBe(200);

    const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
    let sessionID = loginResponse.headers['set-cookie'];

    const registerProduct01 = await request(app).post(routePath + "/products").set('Cookie', sessionID)
        .send({ model: productInfo01.model, category: productInfo01.category, details: productInfo01.details, sellingPrice: productInfo01.sellingPrice, quantity: productInfo01.quantity, arrivalDate: productInfo01.arrivalDate })
        expect(registerProduct01.status).toBe(200);

    const registerProduct02 = await request(app).post(routePath + "/products").set('Cookie', sessionID)
        .send({ model: productInfo02.model, category: productInfo02.category, details: productInfo02.details, sellingPrice: productInfo02.sellingPrice, quantity: productInfo02.quantity, arrivalDate: productInfo02.arrivalDate })
        expect(registerProduct02.status).toBe(200);
    
    const registerProduct03 = await request(app).post(routePath + "/products").set('Cookie', sessionID)
        .send({ model: productInfo03.model, category: productInfo03.category, details: productInfo03.details, sellingPrice: productInfo03.sellingPrice, quantity: productInfo03.quantity, arrivalDate: productInfo03.arrivalDate })
        expect(registerProduct03.status).toBe(200);

    const registerProduct04 = await request(app).post(routePath + "/products").set('Cookie', sessionID)
        .send({ model: productInfo04.model, category: productInfo04.category, details: productInfo04.details, sellingPrice: productInfo04.sellingPrice, quantity: productInfo04.quantity, arrivalDate: productInfo04.arrivalDate })
        expect(registerProduct04.status).toBe(200);

})

afterAll(async () => {
    await cleanup()
    db.close();
})


//TEST DAO
describe("Review DAO integration test", () => {
    describe("DAO - addReview", () => {

        test("SUCCESS - It should return void when review is added successfully", async () => {
            
            const result01 = await reviewDAO.addReview(model01, testCustomer.username, reviewToAdd.score, reviewToAdd.comment);
            expect(result01).toBeUndefined();
            const result03 = await reviewDAO.addReview(model03, testCustomer.username, reviewToAdd.score, reviewToAdd.comment);
            expect(result03).toBeUndefined();
            const result04 = await reviewDAO.addReview(model04, testCustomer.username, reviewToAdd.score, reviewToAdd.comment);
            expect(result04).toBeUndefined();

        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(reviewDAO.addReview("test10", testCustomer.username, reviewToAdd.score, reviewToAdd.comment)).rejects.toThrowError(new ProductNotFoundError());

        });

        test("ERROR 409 - The user has already made a review for this product", async () => {
            
            await expect(reviewDAO.addReview(model01, testCustomer.username, reviewToAdd.score, reviewToAdd.comment)).rejects.toThrowError(new ExistingReviewError());

        });

    });

    describe("DAO - getProductReviews", () => {
        test("SUCCESS - It should return the list of reviews for a product", async () => {

            const result = await reviewDAO.getProductReviews(model01);
            expect(result).toStrictEqual([testProductReview01]);
        });

        test("SUCCESS - It should return an empty list if the product has no reviews", async () => {
            
            const result = await reviewDAO.getProductReviews(model02);
            expect(result).toStrictEqual([]);
        });
    })

    describe("DAO - deleteReview", () => {
        test("SUCCESS - It should return void when review is deleted successfully", async () => {
            
            const result = await reviewDAO.deleteReview(model03, testCustomer.username);
            expect(result).toBeUndefined();

        });

        test("ERROR 404 - The product does not exist", async () => {
            

            await expect(reviewDAO.deleteReview("test19", testCustomer.username)).rejects.toThrowError(new ProductNotFoundError());
           
        });

        test("ERROR 404 - The user has not already made a review for this product", async () => {
            

            await expect(reviewDAO.deleteReview(model02, testCustomer.username)).rejects.toThrowError(new NoReviewProductError());
           
        });
    })

    describe("DAO - deleteReviewsOfProduct", () => {
        test("SUCCESS - It should return void when the product reviews are deleted successfully", async () => {
            
            const result = await reviewDAO.deleteReviewsOfProduct(model04);
            expect(result).toBeUndefined();
            
        });


        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(reviewDAO.deleteReviewsOfProduct("test10")).rejects.toThrowError(new ProductNotFoundError());
           
        });

    })

    describe("DAO - deleteAllReviews", () => {
        test("SUCCESS - It should return void when all reviews are deleted successfully", async () => {
            
            const result = await reviewDAO.deleteAllReviews();
            expect(result).toBeUndefined();

        });

    })

})


//TEST CONTROLLER
describe("Review CONTROLLER integration test", () => {

    //The test checks if the method returns void when the DAO method returns void
    //The test also expects the DAO method to be called once with the correct parameters
    describe("CONTROLLER - addReview", () => {

        test("SUCCESS - It should return void", async () => {
            //Call the addReview method of the controller
            const response01 = await RC.addReview(model01, testCustomer, reviewToAdd.score, reviewToAdd.comment)
            expect(response01).toBe(undefined) //Check if the response is void

            const response03 = await RC.addReview(model03, testCustomer, reviewToAdd.score, reviewToAdd.comment)
            expect(response03).toBe(undefined) //Check if the response is void

            const response04 = await RC.addReview(model04, testCustomer, reviewToAdd.score, reviewToAdd.comment)
            expect(response04).toBe(undefined) //Check if the response is void
        })
        
        test("ERROR 404 - The product does not exist", async () => {
            //Call the addReview method of the controller
            await expect(RC.addReview("test10", testCustomer, reviewToAdd.score, reviewToAdd.comment)).rejects.toThrowError(new ProductNotFoundError());
           
        })


        test("ERROR 409 - The user has already made a review for this product", async () => {
            //Call the addReview method of the controller
            await expect(RC.addReview(model01, testCustomer, reviewToAdd.score, reviewToAdd.comment)).rejects.toThrowError(new ExistingReviewError());

        })

    })

    describe("CONTROLLER - getProductReviews", () => {

        test("SUCCESS - It should return a list of reviews ", async () => {
            //Call the getProductReviews method of the controller
            const response = await RC.getProductReviews(model01)
            expect(response).toStrictEqual([testProductReview01])
        })
    
        test("SUCCESS - It should return an empty list of reviews ", async () => {
            //Call the getProductReviews method of the controller
            const response = await RC.getProductReviews(model02)
            expect(response).toStrictEqual([])
        })

    })

    describe("CONTROLLER - deleteReview", () => {

        test("SUCCESS - It should return void", async () => {
            //Call the deleteReview method of the controller
            const response = await RC.deleteReview(model01, testCustomer)
            expect(response).toBe(undefined)
        })
    
    
        test("ERROR 404 - The product does not exist", async () => {
            //Call the deleteReview method of the controller
            await expect(RC.deleteReview("test10", testCustomer)).rejects.toThrowError(new ProductNotFoundError());
        })


        test("ERROR 404 - The user has not already made a review for this product", async () => {
            //Call the deleteReview method of the controller
            await expect(RC.deleteReview(model01, testCustomer)).rejects.toThrowError(new NoReviewProductError());
        })

    })

    describe("CONTROLLER - deleteReviewsOfProduct", () => {

        test("SUCCESS - It should return void", async () => {
            //Call the deleteReviewsOfProduct method of the controller
            const response = await RC.deleteReviewsOfProduct(model04)
            expect(response).toBe(undefined)

        })

        test("ERROR 404 - The product does not exist", async () => {
            //Call the deleteReviewsOfProduct method of the controller
            await expect(RC.deleteReviewsOfProduct("test10")).rejects.toThrowError(new ProductNotFoundError());
        })

    
    })

    describe("CONTROLLER - deleteAllReviews", () => {

        test("SUCCESS - It should return void", async () => {
            //Call the deleteAllReviews method of the controller
            const response = await RC.deleteAllReviews()
            expect(response).toBe(undefined)
        })

    
    })

})

//TEST ROUTE
describe("Review ROUTE integration tests", () => {

    describe("POST - addReview", () => {
        test("SUCCESS - add a review", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send(reviewToAdd).expect(200)
            await request(app).post(`${routePath}/reviews/${model03}`).set('Cookie', sessionID).send(reviewToAdd).expect(200)
            await request(app).post(`${routePath}/reviews/${model04}`).set('Cookie', sessionID).send(reviewToAdd).expect(200)
            
        })

        test("ERROR 409: the user has already made a review for this product", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            //trying to add the same product as before
            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send(reviewToAdd).expect(409)

        })

        test("ERROR 422 - at least one request body parameter is wrong", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
    
            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send({ score: 1, comment: ""}).expect(422)     // empty comment
            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send({ score: 0, comment: "test"}).expect(422)    // score < 1
            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send({ score: 7, comment: "test"}).expect(422)    // score > 5
            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send({ score: 0, comment: "" }).expect(422)    // score < 1 AND empty comment
            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send({ score: 8, comment: ""}).expect(422)     // score > 5 AND empty comment
        })

        test("ERROR 401 - the user is not customer", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).post(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).send(reviewToAdd).expect(401)

        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).post(`${routePath}/reviews/${model01}`).send(reviewToAdd).expect(401)

        })

        test("ERROR 404 - the model is empty", async () => {

            await request(app).post(`${routePath}/reviews`).send(reviewToAdd).expect(404)

        })

        test("ERROR 404 - the model does not exist", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).post(`${routePath}/reviews/test10`).set('Cookie', sessionID).send(reviewToAdd).expect(404)

        })

    })

    describe("GET - getProductReviews", () => {
        test("SUCCESS 200 - it returns an array of reviews", async () => {
            
            //login customer
            const loginResponse = await request(app) .post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).expect(200)

        })        
        
        test("SUCCESS 200 - it returns an array of reviews", async () => {
            
            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/reviews/${model01}`).set('Cookie', sessionID).expect(200)

        })

        test("SUCCESS 200 - it returns an empty array if the model has no reviews", async () => {
            
            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/reviews/${model02}`).set('Cookie', sessionID).expect(200)

        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).get(`${routePath}/reviews/${model01}`).expect(401)

        })

        test("ERROR 404 - the model is empty", async () => {

            await request(app).get(`${routePath}/reviews`).expect(404)

        })
       
    })

    describe("DELETE - deleteReview", () => {
        test("SUCCESS 200 - the request params are correct", async () => {
    
             //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).delete(`${routePath}/reviews/${model04}`).set('Cookie', sessionID).expect(200)

        })
    
    
        test("ERROR 404 - the model does not exist or the user does not have a review for this model", async () => {
            
            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/test10`).set('Cookie', sessionID).expect(404)
             
        })
    
        test("ERROR 401 - the user is not authenticated", async () => {

            await request(app).delete(`${routePath}/reviews/${model02}`).expect(401)
             
        })
    
        test("ERROR 401 - the user is not a customer", async () => {
            
            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/${model02}`).set('Cookie', sessionID).expect(401)
             
        })
    
    
    })
    
    describe("DELETE - deleteReviewsOfProduct", () => {
        test("SUCCESS 200 - the request params are correct", async () => {
    
            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/${model01}/all`).set('Cookie', sessionID).expect(200)
        })    
    
        test("SUCCESS 200 - the request params are correct", async () => {
    
            //login manager
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: manager.username, password: manager.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/${model01}/all`).set('Cookie', sessionID).expect(200)
        })    

        test("ERROR 404 - the model does not exist", async () => {
            
            //login manager
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: manager.username, password: manager.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/test10/all`).set('Cookie', sessionID).expect(404)

        })
    
        test("ERROR 401 - the user is not authenticated", async () => {
            
            await request(app).delete(`${routePath}/reviews/${model01}/all`).expect(401)
        })
    
        test("ERROR 401 - the user is not an admin or a manager", async () => {
            
            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/${model01}/all`).set('Cookie', sessionID).expect(401)

        })
    
    })
    
    describe("DELETE - deleteAllReviews", () => {
        test("SUCCESS 200 - the request params are correct", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/`).set('Cookie', sessionID).expect(200)
        })    
    
        test("ERROR 401 - the user is not authenticated", async () => {
            
            await request(app).delete(`${routePath}/reviews/`).expect(401)
        })
    
        test("ERROR 401 - the user is not an admin or a manager", async () => {
            
            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            
            await request(app).delete(`${routePath}/reviews/`).set('Cookie', sessionID).expect(401)
        })
    
    
    })
    
})