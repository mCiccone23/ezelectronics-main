import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup } from "../src/db/cleanup"
import ProductController from "../src/controllers/productController"
import ProductDAO from "../src/dao/productDAO"
import { Role, User } from "../src/components/user"
import { Category, Product } from "../src/components/product"
import { DateError } from "../src/utilities"
import dayjs from "dayjs"
import { ProductAlreadyExistsError, ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../src/errors/productError"




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
const productInfo03 = {sellingPrice: 500, model: model03, category: "Laptop", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo04 = {sellingPrice: 500, model: model04, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const testProduct01 = new Product(productInfo01.sellingPrice, productInfo01.model, Category.SMARTPHONE, productInfo01.arrivalDate, productInfo01.details, productInfo01.quantity)
const testProduct02 = new Product(productInfo02.sellingPrice, productInfo02.model, Category.SMARTPHONE, productInfo02.arrivalDate, productInfo02.details, productInfo02.quantity)

const PC = new ProductController() //Create a new instance of the controller
const productDAO = new ProductDAO()

//Before executing tests
//Remove everything from test database
//Create an Admin and a Customer User
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


})

afterAll(async () => {
    await cleanup()
    db.close();
})


//TEST DAO
describe("Product DAO integration test", () => {
    describe("DAO - registerProducts", () => {

        test("SUCCESS - It should return void when product is registered successfully", async () => {

            const result01 = await productDAO.registerProducts(productInfo01.model, productInfo01.category, productInfo01.quantity, productInfo01.details, productInfo01.sellingPrice, productInfo01.arrivalDate);
            expect(result01).toBeUndefined();
            const result02 = await productDAO.registerProducts(productInfo02.model, productInfo02.category, productInfo02.quantity, productInfo02.details, productInfo02.sellingPrice, productInfo02.arrivalDate);
            expect(result02).toBeUndefined();
            const result03 = await productDAO.registerProducts(productInfo03.model, productInfo03.category, productInfo03.quantity, productInfo03.details, productInfo03.sellingPrice, productInfo03.arrivalDate);
            expect(result03).toBeUndefined();

        });

        test("ERROR 409 - The product already exists", async () => {
            
            await expect(productDAO.registerProducts(productInfo01.model, productInfo01.category, productInfo01.quantity, productInfo01.details, productInfo01.sellingPrice, productInfo01.arrivalDate)).rejects.toThrowError(new ProductAlreadyExistsError());

        });

    });

    describe("DAO - changeProductQuantity", () => {
        test("SUCCESS - It should return the updated quantity", async () => {

            const result = await productDAO.changeProductQuantity(model01, 20, "2024-05-02");
            expect(result).toStrictEqual(25);
        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(productDAO.changeProductQuantity(model04, 20, "2024-05-02")).rejects.toThrowError(new ProductNotFoundError());

        });

        test("ERROR 400 - changeDate is before arrivalDate", async () => {
            
            await expect(productDAO.changeProductQuantity(model01, 20, "2024-04-30")).rejects.toThrowError(new DateError());

        });

        test("ERROR 400 - changeDate is after currentDate", async () => {
            
            await expect(productDAO.changeProductQuantity(model01, 20, dayjs().add(1, 'day').format('YYYY-MM-DD'))).rejects.toThrowError(new DateError());

        });
    })

    describe("DAO - sellProduct", () => {
        test("SUCCESS - It should return the updated quantity", async () => {

            const result = await productDAO.sellProduct(model01, 20, "2024-05-02");
            expect(result).toStrictEqual(5);
        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(productDAO.sellProduct(model04, 20, "2024-05-02")).rejects.toThrowError(new ProductNotFoundError());

        });

        test("ERROR 400 - sellingDate is before arrivalDate", async () => {
            
            await expect(productDAO.sellProduct(model01, 20, "2024-04-30")).rejects.toThrowError(new DateError());

        });

        test("ERROR 409 - Stock quantity is too low", async () => {
            
            await expect(productDAO.sellProduct(model01, 20, "2024-04-30")).rejects.toThrowError(new LowProductStockError());

        });

        test("ERROR 409 - Stock is empty", async () => {
            const result = await productDAO.sellProduct(model01, 5, "2024-05-02");
            expect(result).toStrictEqual(0);

            await expect(productDAO.sellProduct(model01, 20, "2024-04-30")).rejects.toThrowError(new EmptyProductStockError());

        });

    })

    describe("DAO - getProducts", () => {
        test("SUCCESS - It should return the list of products", async () => {

            const result = await productDAO.getProducts("model", null, model02);
            expect(result).toStrictEqual([testProduct02]);
        });

        test("SUCCESS - It should return an empty list if the product has no reviews", async () => {
            
            const result = await productDAO.getProducts("category", "Appliance", null);
            expect(result).toStrictEqual([]);
        });

        test("ERROR 404 - The selected model does not exist", async () => {
            
            await expect(productDAO.getProducts("model", null, model04)).rejects.toThrowError(new ProductNotFoundError());

        });

        

    })

    describe("DAO - getAvailableProducts", () => {
        test("SUCCESS - It should return the list of products", async () => {

            const result = await productDAO.getAvailableProducts("model", null, model02);
            expect(result).toStrictEqual([testProduct02]);
        });

        test("SUCCESS - It should return an empty list if the product has no reviews", async () => {
            
            const result = await productDAO.getAvailableProducts("category", "Appliance", null);
            expect(result).toStrictEqual([]);
        });

        test("ERROR 404 - The selected model does not exist", async () => {
            
            await expect(productDAO.getAvailableProducts("model", null, "none")).rejects.toThrowError(new ProductNotFoundError());

        });

        

    })

    describe("DAO - deleteProduct", () => {
        test("SUCCESS - It should return true", async () => {

            const result = await productDAO.deleteProduct(model01);
            expect(result).toStrictEqual(true);
        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(productDAO.deleteProduct(model04)).rejects.toThrowError(new ProductNotFoundError());

        });

    })

    
    describe("DAO - deleteAllProducts", () => {
        test("SUCCESS - It should return true", async () => {

            const result = await productDAO.deleteAllProducts();
            expect(result).toStrictEqual(true);
        });

    })

})

//TEST CONTROLLER
describe("Product CONTROLLER integration test", () => {

    //The test checks if the method returns void when the DAO method returns void
    //The test also expects the DAO method to be called once with the correct parameters
    describe("CONTROLLER - addReview", () => {

        test("SUCCESS - It should return void", async () => {
            //Call the registerProducts method of the controller
            const response01 = await PC.registerProducts(productInfo01.model, productInfo01.category, productInfo01.quantity, productInfo01.details, productInfo01.sellingPrice, productInfo01.arrivalDate);
            expect(response01).toBeUndefined();

            const response02 = await PC.registerProducts(productInfo02.model, productInfo02.category, productInfo02.quantity, productInfo02.details, productInfo02.sellingPrice, productInfo02.arrivalDate);
            expect(response02).toBeUndefined();

            const response03 = await PC.registerProducts(productInfo03.model, productInfo03.category, productInfo03.quantity, productInfo03.details, productInfo03.sellingPrice, productInfo03.arrivalDate);
            expect(response03).toBeUndefined();
        })
        
        test("ERROR 409 - The product already exists", async () => {
            
            await expect(PC.registerProducts(productInfo01.model, productInfo01.category, productInfo01.quantity, productInfo01.details, productInfo01.sellingPrice, productInfo01.arrivalDate)).rejects.toThrowError(new ProductAlreadyExistsError());

        });

        test("ERROR - Invalid date format", async () => {
            
            await expect(PC.registerProducts(productInfo01.model, productInfo01.category, productInfo01.quantity, productInfo01.details, productInfo01.sellingPrice, "invalidDate")).rejects.toThrowError(new Error("Invalid date format"));

        });

        test("ERROR 409 - arrivalDate is after current date", async () => {
            
            await expect(PC.registerProducts(productInfo01.model, productInfo01.category, productInfo01.quantity, productInfo01.details, productInfo01.sellingPrice, dayjs().add(1, 'day').format('YYYY-MM-DD'))).rejects.toThrowError(new DateError());

        });

    })

    describe("CONTROLLER - changeProductQuantity", () => {
        test("SUCCESS - It should return the updated quantity", async () => {

            const response = await PC.changeProductQuantity(model01, 20, "2024-05-02");
            expect(response).toStrictEqual(25);
        });

        test("ERROR - Empty model field", async () => {
            
            await expect(PC.changeProductQuantity("", 20, "2024-05-02")).rejects.toThrowError(new Error("Invalid input parameters"));

        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(PC.changeProductQuantity(model04, 20, "2024-05-02")).rejects.toThrowError(new ProductNotFoundError());

        });

        test("ERROR 400 - changeDate is before arrivalDate", async () => {
            
            await expect(PC.changeProductQuantity(model01, 20, "2024-04-30")).rejects.toThrowError(new DateError());

        });

        test("ERROR 400 - changeDate is after currentDate", async () => {
            
            await expect(PC.changeProductQuantity(model01, 20, dayjs().add(1, 'day').format('YYYY-MM-DD'))).rejects.toThrowError(new DateError());

        });
    })

    describe("CONTROLLER - sellProduct", () => {
        test("SUCCESS - It should return the updated quantity", async () => {

            const response = await PC.sellProduct(model01, 20, "2024-05-02");
            expect(response).toStrictEqual(5);
        });

        test("ERROR - Empty model field", async () => {
            
            await expect(PC.sellProduct("", 20, "2024-05-02")).rejects.toThrowError(new Error("Invalid input parameters"));

        });

        test("ERROR - Invalid date format", async () => {
            
            await expect(PC.sellProduct(model01, 20, "invalidDate")).rejects.toThrowError(new Error("Invalid date format"));

        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(PC.sellProduct(model04, 20, "2024-05-02")).rejects.toThrowError(new ProductNotFoundError());

        });

        test("ERROR 400 - sellingDate is before arrivalDate", async () => {
            
            await expect(PC.sellProduct(model01, 20, "2024-04-30")).rejects.toThrowError(new DateError());

        });

        test("ERROR 400 - sellingDate is after currentDate", async () => {
            
            await expect(PC.sellProduct(model01, 20, dayjs().add(1, 'day').format('YYYY-MM-DD'))).rejects.toThrowError(new DateError());

        });

        test("ERROR 409 - Stock quantity is too low", async () => {
            
            await expect(PC.sellProduct(model01, 20, "2024-04-30")).rejects.toThrowError(new LowProductStockError());

        });

        test("ERROR 409 - Stock is empty", async () => {
            const response = await PC.sellProduct(model01, 5, "2024-05-02");
            expect(response).toStrictEqual(0);

            await expect(PC.sellProduct(model01, 20, "2024-04-30")).rejects.toThrowError(new EmptyProductStockError());

        });

    })

    describe("CONTROLLER - getProducts", () => {
        test("SUCCESS - It should return the list of products", async () => {

            const response = await PC.getProducts("model", null, model02);
            expect(response).toStrictEqual([testProduct02]);
        });

        test("SUCCESS - It should return an empty list if the product has no reviews", async () => {
            
            const response = await PC.getProducts("category", "Appliance", null);
            expect(response).toStrictEqual([]);
        });

        test("ERROR 404 - The selected model does not exist", async () => {
            
            await expect(PC.getProducts("model", null, model04)).rejects.toThrowError(new ProductNotFoundError());

        });

        

    })

    describe("CONTROLLER - getAvailableProducts", () => {
        test("SUCCESS - It should return the list of products", async () => {

            const response = await PC.getAvailableProducts("model", null, model02);
            expect(response).toStrictEqual([testProduct02]);
        });

        test("SUCCESS - It should return an empty list if the product has no reviews", async () => {
            
            const response = await PC.getAvailableProducts("category", "Appliance", null);
            expect(response).toStrictEqual([]);
        });

        test("ERROR 404 - The selected model does not exist", async () => {
            
            await expect(PC.getAvailableProducts("model", null, "none")).rejects.toThrowError(new ProductNotFoundError());

        });

        

    })

    describe("CONTROLLER - deleteProduct", () => {
        test("SUCCESS - It should return true", async () => {

            const response = await PC.deleteProduct(model01);
            expect(response).toStrictEqual(true);
        });

        test("ERROR 404 - The product does not exist", async () => {
            
            await expect(PC.deleteProduct(model04)).rejects.toThrowError(new ProductNotFoundError());

        });

        test("ERROR - Empty model field", async () => {
            
            await expect(PC.deleteProduct("")).rejects.toThrowError(new Error("Invalid input parameters"));

        });

    })

    
    describe("CONTROLLER - deleteAllProducts", () => {
        test("SUCCESS - It should return true", async () => {

            const response = await PC.deleteAllProducts();
            expect(response).toStrictEqual(true);
        });

    })

})

//TEST ROUTE
describe("Product ROUTE integration tests", () => {

    describe("POST - registerProducts", () => {
        test("SUCCESS - add a product", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send(productInfo01).expect(200)
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send(productInfo02).expect(200)
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send(productInfo03).expect(200)
            
        })

        test("ERROR 409: product already exists", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            //trying to add the same product as before
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send(productInfo01).expect(409)

        })

        test("ERROR 400: arrivalDate is after current date", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send({ model : productInfo01.model,
                category : productInfo01.category,
                quantity : productInfo01.quantity,
                details : productInfo01.details,
                sellingPrice : productInfo01.sellingPrice,
                arrivalDate : dayjs().add(1, 'day').format('YYYY-MM-DD')}).expect(400)

        })

        test("ERROR 422 - at least one request body parameter is wrong", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send({ model : "",
                category : productInfo01.category,
                quantity : productInfo01.quantity,
                details : productInfo01.details,
                sellingPrice : productInfo01.sellingPrice,
                arrivalDate : productInfo01.arrivalDate}).expect(422)   //empty model
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send({ model : productInfo01.model,
                category : "Console",
                quantity : productInfo01.quantity,
                details : productInfo01.details,
                sellingPrice : productInfo01.sellingPrice,
                arrivalDate : productInfo01.arrivalDate}).expect(422)   //category not in Smartphone, Laptop, Appliance
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send({ model : productInfo01.model,
                category : productInfo01.category,
                quantity : productInfo01.quantity,
                details : productInfo01.details,
                sellingPrice : 0,
                arrivalDate : productInfo01.arrivalDate}).expect(422)   //sellingPrice<=0
            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send({ model : productInfo01.model,
                category : productInfo01.category,
                quantity : 0,
                details : productInfo01.details,
                sellingPrice : productInfo01.sellingPrice,
                arrivalDate : productInfo01.arrivalDate}).expect(422)   //quantity<=0
        })

        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).post(`${routePath}/products`).set('Cookie', sessionID).send(productInfo01).expect(401)

        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).post(`${routePath}/products`).send(productInfo01).expect(401)

        })

    })

    describe("PATCH - changeProductQuantity", () => {
        test("SUCCESS - change a product quantity", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}`).set('Cookie', sessionID).send({quantity: 20, changeDate: "2024-05-02"}).expect(200)
            
        })

        test("ERROR 404: Product does not exist", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model04}`).set('Cookie', sessionID).send({quantity: 20, changeDate: "2024-05-02"}).expect(404)

        })

        test("ERROR 400: changeDate is after current date", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}`).set('Cookie', sessionID).send({quantity: 20, changeDate: dayjs().add(1, 'day').format('YYYY-MM-DD')}).expect(400)

        })

        test("ERROR 400: changeDate is before arrivalDate", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}`).set('Cookie', sessionID).send({quantity: 20, changeDate: "2024-04-30"}).expect(400)

        })

        test("ERROR 422 - quantity<=0", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            await request(app).patch(`${routePath}/products/${model01}`).set('Cookie', sessionID).send({quantity: 0, changeDate: "2024-05-02"}).expect(422)

        })

        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}`).set('Cookie', sessionID).send({quantity: 20, changeDate: "2024-05-02"}).expect(401)


        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).patch(`${routePath}/products/${model01}`).send({quantity: 20, changeDate: "2024-05-02"}).expect(401)

        })

    })
    
    describe("PATCH - sellProduct", () => {
        test("SUCCESS - sell a product", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 20, sellingDate: "2024-05-02"}).expect(200)
            
        })

        test("ERROR 404: Product does not exist", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model04}/sell`).set('Cookie', sessionID).send({quantity: 20, sellingDate: "2024-05-02"}).expect(404)

        })

        test("ERROR 400: sellingDate is after current date", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 20, sellingDate: dayjs().add(1, 'day').format('YYYY-MM-DD')}).expect(400)

        })

        test("ERROR 400: sellingDate is before arrivalDate", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 5, sellingDate: "2024-04-30"}).expect(400)

        })

        test("ERROR 422 - quantity<=0", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 0, sellingDate: "2024-05-02"}).expect(422)

        })

        test("ERROR 409 - stock quantity is too low or is empty", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];
            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 20, sellingDate: "2024-05-02"}).expect(409) //stock quantity is too low
            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 5, sellingDate: "2024-05-02"}).expect(200) //now stock is empty
            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 1, sellingDate: "2024-05-02"}).expect(409) //check if stock is empty

        })


        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).patch(`${routePath}/products/${model01}/sell`).set('Cookie', sessionID).send({quantity: 20, sellingDate: "2024-05-02"}).expect(401)


        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).patch(`${routePath}/products/${model01}/sell`).send({quantity: 20, sellingDate: "2024-05-02"}).expect(401)

        })
    })

    describe("GET - getProducts", () => {
        test("SUCCESS - get product list", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).send().expect(200)
            
        })

        test("ERROR 404: Product does not exist", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query({grouping: "model", model: model04}).expect(404)

        })

        test("ERROR 422 - at least one request body parameter is wrong", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Smartphone", model : "model"}).expect(422); //grouping is model but field category is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Smartphone"}).expect(422);  //grouping is model but field model is empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "category", category: "Smartphone", model : "model"}).expect(422);  //grouping is category but field model is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "category", model: "model"}).expect(422);   //grouping is category but field category is empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {category: "Smartphone", model : "model"}).expect(422); // field grouping is empty but field category and model are not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {model : "model"}).expect(422); // field grouping is empty but field model is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {category: "Smartphone"}).expect(422);  // field grouping is empty but field category is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Console"}).expect(422); // category is not in Smartphone, Laptop, Appliance

        })


        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).send().expect(401)


        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).get(`${routePath}/products`).send().expect(401)

        })
    })

    describe("GET - getAvailableProducts", () => {
        test("SUCCESS - get product list", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).send().expect(200)
            
        })

        test("ERROR 404: Product does not exist", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query({grouping: "model", model: model04}).expect(404)

        })

        test("ERROR 422 - at least one request body parameter is wrong", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Smartphone", model : "model"}).expect(422); //grouping is model but field category is not empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Smartphone"}).expect(422);  //grouping is model but field model is empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {grouping : "category", category: "Smartphone", model : "model"}).expect(422);  //grouping is category but field model is not empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {grouping : "category", model: "model"}).expect(422);   //grouping is category but field category is empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {category: "Smartphone", model : "model"}).expect(422); // field grouping is empty but field category and model are not empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {model : "model"}).expect(422); // field grouping is empty but field model is not empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {category: "Smartphone"}).expect(422);  // field grouping is empty but field category is not empty
            await request(app).get(`${routePath}/products/available`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Console"}).expect(422); // category is not in Smartphone, Laptop, Appliance

        })


        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).get(`${routePath}/products/available`).send().expect(401)

        })
    })

    describe("GET - getProducts", () => {
        test("SUCCESS - get product list", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).send().expect(200)
            
        })

        test("ERROR 404: Product does not exist", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query({grouping: "model", model: model04}).expect(404)

        })

        test("ERROR 422 - at least one request body parameter is wrong", async () => {

            //login customer
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Smartphone", model : "model"}).expect(422); //grouping is model but field category is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Smartphone"}).expect(422);  //grouping is model but field model is empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "category", category: "Smartphone", model : "model"}).expect(422);  //grouping is category but field model is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "category", model: "model"}).expect(422);   //grouping is category but field category is empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {category: "Smartphone", model : "model"}).expect(422); // field grouping is empty but field category and model are not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {model : "model"}).expect(422); // field grouping is empty but field model is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {category: "Smartphone"}).expect(422);  // field grouping is empty but field category is not empty
            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).query(
                {grouping : "model", category: "Console"}).expect(422); // category is not in Smartphone, Laptop, Appliance

        })


        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).get(`${routePath}/products`).set('Cookie', sessionID).send().expect(401)


        })

        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).get(`${routePath}/products`).send().expect(401)

        })
    })

    describe("GET - deleteProduct", () => {
        test("SUCCESS - delete a product", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).delete(`${routePath}/products/${model01}`).set('Cookie', sessionID).send().expect(200)
            
        })

        test("ERROR 404: Product does not exist", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).delete(`${routePath}/products/${model01}`).set('Cookie', sessionID).send().expect(404)

        })


        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).delete(`${routePath}/products/${model01}`).send().expect(401)

        })

        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).delete(`${routePath}/products/${model01}`).set('Cookie', sessionID).send().expect(401)


        })
    })

    describe("GET - deleteAllProducts", () => {
        test("SUCCESS - delete a product", async () => {

            //login
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).delete(`${routePath}/products`).set('Cookie', sessionID).send().expect(200)
            
        })


        test("ERROR 401 - the user is not logged in", async () => {

            await request(app).delete(`${routePath}/products`).send().expect(401)

        })

        test("ERROR 401 - the user is not admin or manager", async () => {

            //login admin
            const loginResponse = await request(app).post(routePath + "/sessions").send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);

            let sessionID = loginResponse.headers['set-cookie'];

            await request(app).delete(`${routePath}/products`).set('Cookie', sessionID).send().expect(401)


        })
    })
    
})


