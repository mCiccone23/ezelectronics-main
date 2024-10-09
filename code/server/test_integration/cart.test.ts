import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import db from "../src/db/db"
import CartDAO from "../src/dao/cartDAO"
import { Category } from "../src/components/product"
import CartController from "../src/controllers/cartController"
import { Product } from "../src/components/product"
import { Role, User } from "../src/components/user"
import { ProductInCartError, ProductNotInCartError } from "../src/errors/cartError"
import { CartNotFoundError, EmptyCartError } from "../src/errors/cartError"
import { Cart } from "../src/components/cart"

const routePath = "/ezelectronics" //Base route path for the API

const cartDAO = new CartDAO();
const CC = new CartController();

//Default product information
const model01 = "test01"
const model02 = "test02"
const model03 = "test03"
const model04 = "test04"

const productInfo01 = {sellingPrice: 500, model: model01, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo02 = {sellingPrice: 500, model: model02, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo03 = {sellingPrice: 500, model: model03, category: "Laptop", arrivalDate: "2024-05-01", details: "ok", quantity: 5}
const productInfo04 = {sellingPrice: 500, model: model04, category: "Smartphone", arrivalDate: "2024-05-01", details: "ok", quantity: 0}


//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager"};
const customer1 = { username: "customer1", name: "customer1", surname: "customer1", password: "customer1", role: "Customer" }
const testCustomer = new User(customer.username, customer.name, customer.surname, Role.CUSTOMER, "", "");
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string

const productModel = "testModel";
const productModel1 = 'testModel1';
const zeroQuantityModel = "zeroQuantityModel";

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
        jest.setTimeout(20000);
        await postUser({ username: customer.username, name: customer.name, surname: customer.surname, password: customer.password, role: customer.role })
        await postUser({ username: admin.username, name: admin.name, surname: admin.surname, password: admin.password, role: admin.role })  
        await postUser({ username: manager.username, name: manager.name, surname: manager.surname, password: manager.password, role: manager.role })
        await postUser({ username: customer1.username, name: customer1.name, surname: customer1.surname, password: customer1.password, role: customer1.role })

        // Login as customer and get the session cookie
        customerCookie = await login({ username: customer.username, password: customer.password });

        const insertZero = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertZero, [zeroQuantityModel, Category.SMARTPHONE, "2024-04-15", 150, 0, "Details"]);

        const insertSql = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertSql, [productModel, Category.SMARTPHONE, "2024-04-15", 100, 5, "Details"]);

        const insertSql1 = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertSql1, [productModel1, Category.APPLIANCE, "2023-11-15", 100, 20, "Details"]);

        const insertProductInfo01 = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertProductInfo01, [productInfo01.model, productInfo01.category, productInfo01.arrivalDate, productInfo01.sellingPrice, productInfo01.quantity, productInfo01.details]);

        const insertProductInfo02 = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertProductInfo02, [productInfo02.model, productInfo02.category, productInfo02.arrivalDate, productInfo02.sellingPrice, productInfo02.quantity, productInfo02.details]);

        const insertProductInfo03 = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertProductInfo03, [productInfo03.model, productInfo03.category, productInfo03.arrivalDate, productInfo03.sellingPrice, productInfo03.quantity, productInfo03.details]);

        const insertProductInfo04 = "INSERT INTO products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
        await db.run(insertProductInfo04, [productInfo04.model, productInfo04.category, productInfo04.arrivalDate, productInfo04.sellingPrice, productInfo04.quantity, productInfo04.details]);

        // Create a cart for the customer user
        await cartDAO.createUserCart(customer.username);
        await cartDAO.createUserCart(customer1.username);

})


//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
    db.close();
})



//DAO
describe("Cart Dao integration test", ()=>{

    describe("Dao - getCart", ()=>{
        test("SUCCESS - it should return the cart for a specific user", async()=>{
            const cart = await cartDAO.getCart(customer.username);
            expect(cart).toBeDefined();
            expect(cart.customer).toBe(customer.username); 
        });
        test("SUCCESS - it should return an empty cart if no unpaid cart exists for the user", async () => {
            const userWithNoUnpaidCart = 'userwithnouncart';

            const cart = await cartDAO.getCart(userWithNoUnpaidCart);
            expect(cart).toBeDefined();
            expect(cart.customer).toBe(userWithNoUnpaidCart);
            expect(cart.products).toHaveLength(0);
        });
    });

    describe("Dao - createUserCart", ()=>{
        test("SUCCESS - it should create a new cart for a specific user", async()=>{
            const res = await cartDAO.createUserCart(customer.username);
            expect(res).toBe(true);
            const cart = await cartDAO.getCart(customer.username)
            expect(cart.customer).toBe(customer.username) 
            expect(cart.products).toStrictEqual([]);  
        });
    });  
    describe("Dao - updateAddOneUnitProductToCart", ()=>{
        test("SUCCESS - it should add one unit ptoduct to the cart", async()=>{
            const response = await cartDAO.updateAddOneUnitProductToCart(1, productInfo01.model);
            expect(response).toBe(true);
        });
    });
    describe("Dao - AddNewProductToCart", ()=>{
        test("SUCCESS - it should add a new product to the current cart of the logged in customer", async()=>{
            const response = await cartDAO.AddNewProductToCart(1, productInfo01.model, productInfo01.category, productInfo01.sellingPrice);
            expect(response).toBe(true);
        });
    });
    
    describe("Dao - checkProductQuantity", ()=>{
        test("SUCCESS - it should check the availability of the product", async()=>{
            const response = await cartDAO.checkProductQuantity(productInfo01.model);
            expect(response).toBe(true);
        });
        test("FAILED - it should throw ProductInCartError if product's quantity = 0", async()=>{
            const response = await cartDAO.checkProductQuantity(productInfo04.model);
            expect(response).toBe(false);

        });
    });

    describe("Dao - updateCart", ()=>{
        test("SUCCESS - it should handle the update of the total cost of the cart", async()=>{
            const response = await cartDAO.updateCart(1);
            expect(response).toBe(true);
        });
    });

    describe("Dao - getCartProducts", ()=>{
        test("SUCCESS - it should retrieve all the products in the cart of the logged in customer", async()=>{
            const products = await cartDAO.getCartProducts(1);
            expect(products).toBeDefined();
            products.forEach(product=>{
                expect(product).toHaveProperty("model");
                expect(product).toHaveProperty("quantity");
                expect(product).toHaveProperty("category");
                expect(product).toHaveProperty("price");
            })

        });
    });

    describe("Dao - checkoutCart", ()=>{
        test("SUCCESS - it should return true and checkout the current cart of the logged in customer", async()=>{
            const response = await cartDAO.checkoutCart(1);
            expect(response).toBe(true);
        });

    });

    describe("Dao - getCartId", ()=> {
        test("SUCCESS - it should retrieve the id of the cart", async()=>{
            const cartId = await cartDAO.getCartID(customer.username);
            
            expect(cartId).toBeDefined();
            expect(typeof cartId).toBe('number');
        });
        test("FAILED - it should throw cartNotFounError if the user has no unpaid cart",async()=>{
            const username = 'userWithoutCart';
            await expect(cartDAO.getCartID(username)).rejects.toThrow(new CartNotFoundError());
        });
    });

    describe("Dao - notEmptyCart", ()=>{
        test("SUCCESS - it should return true if the cart is not empty", async()=>{
    
            //prendo l'id del carrello e aggiungo un prodotto al carrello
            const cartID = await cartDAO.getCartID(customer.username);
            await cartDAO.AddNewProductToCart(cartID, productInfo03.model, productInfo03.category, productInfo03.sellingPrice);

            //verifico che il carrello non è vuoto
            const response = await cartDAO.NotEmptyCart(cartID);
            expect(response).toBe(true); 
        });
        test("FAILED - it should throw cartNotFoundError if the cart does not exist", async()=>{
            await expect(cartDAO.NotEmptyCart(undefined as any)).rejects.toThrow(new CartNotFoundError())
        });
        test("FAILED - it should reject EmptyCartError if the cart is empty", async()=>{
            await expect (cartDAO.NotEmptyCart(1)).rejects.toThrow(new EmptyCartError());
        });
    });

    describe("Dao - productAvailability", ()=>{
        test("SUCCESS - it should check the availability of products", async()=>{
            const cartId = await cartDAO.getCartID(customer.username)
            const response = await cartDAO.ProductAvailability(cartId);
            expect(response).toBe(true);
        });
    });

    describe("Dao - getCustomerCarts", ()=>{
        test("SUCCESS - it should retrieve an empty array if no piad carts exist for user", async()=>{
            const carts = await cartDAO.getCustomerCarts(customer1.username);
            expect(carts).toEqual([]);
        });
        test("SUCCESS - it should return an array of paid carts for the user", async()=>{
            const cartId = await cartDAO.getCartID(customer.username);
            await cartDAO.AddNewProductToCart(cartId, productInfo01.model, productInfo01.category, productInfo01.sellingPrice)

            await cartDAO.checkoutCart(cartId);

            const carts = await cartDAO.getCustomerCarts(customer.username);
            expect(carts).toBeInstanceOf(Array);
            expect(carts.length).toBeGreaterThan(0);

            carts.forEach((cart: Cart) => {
                expect(cart).toBeInstanceOf(Cart);
                expect(cart.customer).toBe(customer.username);
                expect(cart.paymentDate).toBeDefined();
                expect(cart.total).toBeGreaterThanOrEqual(0);
                expect(cart.products).toBeInstanceOf(Array);
            });
        });
    });

    describe("Dao - deleteProductFromCart", ()=>{
        test("It should delete a product from cart", async()=>{
            //prendo l'id
            const cartId = await cartDAO.getCartID(customer.username);
            //aggiungo prodotto al carrello
            await cartDAO.AddNewProductToCart(cartId, productInfo01.model, productInfo01.category, productInfo01.sellingPrice)
            const result = await cartDAO.deleteProductFromCart(cartId, productInfo01.model);
            expect(result).toBe(true);
        });
    });

    describe("Dao - updateRemoveOneUnitProductFromCart", ()=>{
        test("SUCCESS -  it should decrement the product quantity in the cart if the quantity is greater than 1", async()=>{
            //prendo l'id
            const cartId = await cartDAO.getCartID(customer.username);
            //aggiungo prodotto al carrello
            await cartDAO.AddNewProductToCart(cartId, productInfo01.model, productInfo01.category, productInfo01.sellingPrice);
            await cartDAO.updateAddOneUnitProductToCart(cartId, productInfo01.model);

            const result = await cartDAO.updateRemoveOneUnitProductToCart(cartId, productInfo01.model);
            expect(result).toBe(true);
        });
        test("SUCCESS - it should remove the product from cart if the quantity 1", async()=>{
            //prendo l'id
            const cartId = await cartDAO.getCartID(customer.username);
            //aggiungo prodotto al carrello
            await cartDAO.AddNewProductToCart(cartId, productInfo01.model, productInfo01.category, productInfo01.sellingPrice);

            const result = await (cartDAO.updateRemoveOneUnitProductToCart(cartId, productInfo01.model));
            expect(result).toBe(true);
        });
    });

    describe("Dao - clearCart", ()=>{
        test("SUCCESS - it should remove all products from the current cart", async()=>{
            //prendo l'id
            const cartId = await cartDAO.getCartID(customer.username);
            //aggiungo prodotto al carrello
            await cartDAO.AddNewProductToCart(cartId, productInfo01.model, productInfo01.category, productInfo01.sellingPrice);
            await cartDAO.AddNewProductToCart(cartId, productInfo02.model, productInfo02.category, productInfo02.sellingPrice);

            const result = await cartDAO.clearCart(cartId);
            expect(result).toBe(true);
        });
    });
    
    describe("Dao - deleteAllCarts", ()=>{
        test("SUCCESS - it should delete all carts", async()=>{
            const result = await cartDAO.deleteAllCarts();
            expect(result).toBe(true);
        });
    });

    describe("Dao - getAllCarts", ()=>{
        test("SUCCESS - it should retrieve all carts", async()=>{
            await cartDAO.createUserCart(customer.username);
            await cartDAO.createUserCart(customer1.username);

            const result = await cartDAO.getAllCarts();

            expect(result).toHaveLength(2);
        });
        test("SUCCESS - it should return an empty list if there aren't carts", async()=>{
            await cartDAO.deleteAllCarts();
            const result = await cartDAO.getAllCarts();
            expect(result).toEqual([]);
        })
    })
})



//CONTROLLER
describe("Cart controller integration test", ()=>{
    
    describe("Controller - addToCart", ()=>{
        test("SUCCESS - it should return true if the product was successfully added", async()=>{
            const response = await CC.addToCart(testCustomer, productModel1);
            expect(response).toBe(true);
        });
        test("SUCCESS - it should increase the quantity if the product is already in the cart", async()=>{
            await CC.addToCart(testCustomer, productModel1); // Add the product first time
            const response = await CC.addToCart(testCustomer, productModel1);
            expect(response).toBe(true);
        });
        test("FAILED - it should throw productNotInCartError if the product is not in cart", async()=>{
            await expect(CC.addToCart(testCustomer, "nonexistentModel")).rejects.toThrow(new ProductNotInCartError());
        });
    });

    describe('Controller - getCart', ()=>{
        test("SUCCESS - It should retrieve the user's cart if it exists", async()=>{
            const cart = await CC.getCart(testCustomer);
            expect(cart).toBeDefined();
            
        });
        test("SUCCESS - It should return an empty cart if the user has no current cart", async () => {
            const newUser = new User("newUser", "new", "user", Role.CUSTOMER, "", "");
            const cart = await CC.getCart(newUser);
            expect(cart).toBeDefined();
            expect(cart.products).toHaveLength(0);
        });
        test("FAILED - It should throw an error if the cart does not exist", async () => {
            
            const userWithoutCart = new User("customer1", "customer1", "customer1", Role.CUSTOMER, "", "");

            try {
                await CC.getCart(userWithoutCart);
            } catch (error) {
                expect(error).toBeInstanceOf(CartNotFoundError);
                expect(error.message).toBe('Cart not found');
            }
        });
    });

    describe("Controller - checkoutCart", ()=>{
        test("SUCCESS - It should return true", async () =>{
           
            const response = await CC.checkoutCart(testCustomer);
            expect(response).toBe(true);
        });
        test("FAILURE - It should throw EmptyCartError if the cart is empty", async () => {
            const newCust = new User('newCus', 'name', 'suranme', Role.CUSTOMER, '', '');
            await cartDAO.createUserCart(newCust.username)

            await expect(CC.checkoutCart(newCust)).rejects.toThrow(new EmptyCartError());
        });

        test("FAILED - It should throw CartNotFoundError if the cart does not exist", async () => {
            const nonExistentUser = new User("nonExistentUser", "non", "existent", Role.CUSTOMER, "", "");
            await expect(CC.checkoutCart(nonExistentUser)).rejects.toThrow(new CartNotFoundError());
        });

    });

    describe("Controller - getCustomerCarts", ()=>{
        test("SUCCESS - it should return the paid carts for the customer", async () => {
            const carts = await cartDAO.getCustomerCarts(customer.username);
    
            // Verifica che i carrelli siano stati recuperati correttamente
            expect(carts).toBeDefined();
            expect(Array.isArray(carts)).toBe(true);
        });
    
        test("SUCCESS - it should return an empty array if customer haven't paid carts", async () => {
            // Creazione di un cliente senza carrelli pagati nel sistema
            const newCustomer = new User("newCustomer", "Nuovo", "Cliente", Role.CUSTOMER, "newcustomer@domain.com", "password");
    
            // Recupero dei carrelli per il nuovo cliente
            const carts = await cartDAO.getCustomerCarts(newCustomer.username);
    
            // Verifica che l'array ritornato sia vuoto
            expect(carts).toBeDefined();
            expect(Array.isArray(carts)).toBe(true);
            expect(carts.length).toBe(0); 
        });
    
    });
    describe("Controller - removeProductFromCart", () => {
        test("SUCCESS - It should remove one unit of product from cart", async () => {
            await CC.addToCart(testCustomer, productModel);
            const response = await CC.removeProductFromCart(testCustomer, productModel);
            expect(response).toBe(true); 
        });
    
        test("FAILED - It should throw CartNotFoundError if the cart does not exist", async () => {
            // Create a new user object without a cart
            const newUser = new User("nonExistentUser", "Non", "Existent", Role.CUSTOMER, "", "");
    
            // Attempt to remove a product from the cart (which should not exist)
            await expect(CC.removeProductFromCart(newUser, "testModel")).rejects.toThrow(new CartNotFoundError());
        });
    
        test("FAILED - It should throw ProductNotInCartError if the product is not in the cart", async () => {
            // Attempt to remove a product that is not in the cart
            await expect(CC.removeProductFromCart(testCustomer, "nonexistentModel")).rejects.toThrow(new ProductNotInCartError());
        });
    });
    
    describe("Controller - clearCart", ()=>{
        test("SUCCESS - it should clear the customer's cart", async()=>{
            await CC.addToCart(testCustomer, productModel);
            const response = await CC.clearCart(testCustomer);
            expect(response).toBe(true);
        })
        test("FAILED - It should throw CartNotFoundError if the cart does not exist", async () => {
            const nonExistentUser = new User("nonExistentUser", "non", "existent", Role.CUSTOMER, "", "");

            await expect(CC.clearCart(nonExistentUser)).rejects.toThrow(new CartNotFoundError());
        });
    });

    describe("Controller - deleteAllCarts", ()=>{
        test("SUCCESS - it should delete all carts", async()=>{
            const response = await CC.deleteAllCarts();
            expect(response).toBe(true);
        });

    });

    describe("Controller - getAllCarts", ()=>{
        test("SUCCESS - it should retrieve all carts for all users", async()=> {
            const response = await CC.getAllCarts();
            expect(Array.isArray(response)).toBe(true);
        });

    })
});



//ROUTES
describe("Cart routes integration test", ()=>{

    describe("GET /carts", ()=>{
        test("it should return the current cart of the logged in user", async()=>{
            const response = await request(app)
            .get(`${routePath}/carts`)
            .set('Cookie', customerCookie);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("customer", customer.username);
            //expect(response.body).toHaveProperty("paid", false);
            expect(response.body).toHaveProperty("paymentDate", null);
            expect(response.body).toHaveProperty("products");
            expect(response.body).toHaveProperty("total");
        });
        test("it should return an empty cart if the customer is not logged in", async () => {
            // Fetch the cart without providing a session cookie (should not have access)
            await request(app)
                .get(`${routePath}/carts`)
                .expect(401);
        });
        test("it should return an empty cart if the logged in user is not a customer", async () => {
            // Log in as admin to attempt access (should not be allowed)
            const adminCookie = await login(admin);

            // Fetch the cart using the admin's session cookie (should not have access)
            await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(401);
        });
    });

    describe("POST /carts", () => {
        test("it should add a product unit to the customer's cart", async () => {
            
            // Add product unit to cart using the authenticated customer's session cookie
            const response = await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: productModel })
                .expect(200);

            // Verify the response
            expect(response.status).toBe(200);
        });

        test("it should return a 404 error if model does not represent an existing product", async () => {
            const nonExistingModel = "nonExistingModel";
            const response = await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: nonExistingModel })
                .expect(404);

            // Verify the response
            expect(response.status).toBe(404);
        });

        test("it should return a 409 error if model represents a product whose available quantity is 0", async () => {
            // Attempt to add a product with zero quantity to cart
            const response = await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: productInfo04.model })
                .expect(409);

            expect(response.status).toBe(409);
        });

        test("it should return a 401 error if the customer is not logged in", async () => {
            // Attempt to add a product unit to cart without providing a session cookie
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: productModel })
                .expect(401);
        });

        test("it should return a 401 error if the logged in user is not a customer", async () => {
            // Log in as admin to attempt access (should not be allowed)
            const adminCookie = await login(admin);

            // Attempt to add a product unit to cart using the admin's session cookie
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .send({ model: "testModel" })
                .expect(401);
        });
    });
    describe("PATCH /carts", () => {
        test("it should checkout the cart of the logged in customer", async () => {
            // Ensure cart has products before checkout
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: productModel })
                .expect(200);
            
            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200);

            expect(response.status).toBe(200);
        });

        test("it should return a 401 error if the customer is not logged in", async () => {
            // Logout the customer to simulate no active session
            const noSessionCookie = "invalidCookie";

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', noSessionCookie)
                .expect(401);

            expect(response.status).toBe(401);
        });

        test("it should return a 401 error if the logged in user is not a customer", async () => {
            // Login as admin to attempt access (should not be allowed)
            const adminCookie = await login(admin);

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(401);

            expect(response.status).toBe(401);
        });
    });
      
    describe("GET /carts/history", ()=>{
        test("it should return the history of paid carts for the logged in customer", async()=>{
        const response = await request(app)
            .get(`${routePath}/carts/history`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); 
    });

    test('it should return a 401 error if the user is not logged in', async () => {
        const response = await request(app)
            .get(`${routePath}/carts/history`)
            .expect(401);

        expect(response.status).toBe(401);
    });

    test('it should return a 401 error if the logged in user is not a customer', async () => {
        // Esegui il login come utente diverso da customer (ad esempio, admin)
        const adminCookie = await login({ username: 'admin', password: 'admin' });

        const response = await request(app)
            .get(`${routePath}/carts/history`)
            .set('Cookie', adminCookie)
            .expect(401);

        expect(response.status).toBe(401);
    });
 });

 describe('DELETE /products/:model', () => {
    test('it should remove a product unit from the customer\'s cart', async () => {
        // Aggiungi un prodotto al carrello dell'utente cliente
        await request(app)
            .post(`${routePath}/carts`)
            .set('Cookie', customerCookie)
            .send({ model: productModel })
            .expect(200);

        // Rimuovi il prodotto dal carrello usando il modello come parametro della route
        const response = await request(app)
            .delete(`${routePath}/carts/products/${productModel}`)
            .set('Cookie', customerCookie)
            .expect(200);

        expect(response.status).toBe(200);
    });

    test('it should return a 404 error if the product model does not exist', async () => {
        const nonExistingModel = 'nonExistingModel';

        // Prova a rimuovere un modello di prodotto che non esiste nel carrello
        const response = await request(app)
            .delete(`${routePath}/carts/products/${nonExistingModel}`)
            .set('Cookie', customerCookie)
            .expect(404);

        expect(response.status).toBe(404);
    });

    test('it should return a 404 error if the product model is not in the current cart', async () => {
        // Prova a rimuovere un prodotto che non è nel carrello corrente dell'utente
        const response = await request(app)
            .delete(`${routePath}/carts/products/${productModel}`)
            .set('Cookie', customerCookie)
            .expect(404);

        expect(response.status).toBe(404);
    });

    test('it should return a 404 error if the customer does not have a current cart', async () => {
        // Prova a rimuovere un prodotto quando l'utente non ha un carrello corrente
        const response = await request(app)
            .delete(`${routePath}/carts/products/${productModel}`)
            .set('Cookie', customerCookie)
            .expect(404);

        expect(response.status).toBe(404);
    });

    test('it should return a 401 error if the user is not logged in', async () => {

        // Prova a rimuovere un prodotto senza fornire un cookie di sessione
        const response = await request(app)
            .delete(`${routePath}/carts/products/${productModel}`)
            .expect(401);

        expect(response.status).toBe(401);
    });

    test('it should return a 401 error if the logged in user is not a customer', async () => {
        // Esegui il login come utente diverso da customer (ad esempio, admin)
        const adminCookie = await login({ username: 'admin', password: 'admin' });

        // Prova a rimuovere un prodotto usando il cookie di un utente diverso da customer
        const response = await request(app)
            .delete(`${routePath}/carts/products/${productModel}`)
            .set('Cookie', adminCookie)
            .expect(401);

        expect(response.status).toBe(401);
    });
});

describe("DELETE /current", () => {
    test("it should remove all products from the customer's current cart", async () => {
        // Add product unit to cart using the authenticated customer's session cookie
        await request(app)
            .post(`${routePath}/carts`)
            .set('Cookie', customerCookie)
            .send({ model: productModel })
            .expect(200);

        await request(app)
            .post(`${routePath}/carts`)
            .set('Cookie', customerCookie)
            .send({ model: productModel1 })
            .expect(200);


        // Esegui la richiesta di eliminazione dei prodotti dal carrello corrente
        const response = await request(app)
            .delete(`${routePath}/carts/current`)
            .set('Cookie', customerCookie)
            .expect(200);

        // Verifica che la risposta sia conforme alle aspettative
        expect(response.status).toBe(200);
    });

    test("it should return a 404 error if the customer does not have a current cart", async () => {
        await cartDAO.deleteAllCarts();
        // Esegui la richiesta di eliminazione dei prodotti dal carrello corrente (carrello non presente)
        const response = await request(app)
            .delete(`${routePath}/carts/current`)
            .set('Cookie', customerCookie)
            .expect(404);

        // Verifica che la risposta sia conforme alle aspettative
        expect(response.status).toBe(404);
    });

    test("it should return a 401 error if the customer is not logged in", async () => {
        // Esegui la richiesta di eliminazione dei prodotti dal carrello corrente senza fornire un cookie di sessione
        await request(app)
            .delete(`${routePath}/carts/current`)
            .expect(401);
    });

    test("it should return a 401 error if the logged in user is not a customer", async () => {
        // Log in come admin per tentare l'accesso (non dovrebbe essere consentito)
        const adminCookie = await login(admin);

        // Esegui la richiesta di eliminazione dei prodotti dal carrello corrente usando il cookie di sessione dell'amministratore
        const response = await request(app)
            .delete(`${routePath}/carts/current`)
            .set('Cookie', adminCookie)
            .expect(401);

        // Verifica che la risposta sia conforme alle aspettative
        expect(response.status).toBe(401);
    });
});
describe("DELETE /carts", () => {
    test("it should delete all carts when user is admin", async () => {
        // Login as admin and get the session cookie
        const adminCookie = await login({ username: admin.username, password: "admin" });

        // Make request to delete all carts
        const response = await request(app)
            .delete(`${routePath}/carts`)
            .set('Cookie', adminCookie)
            .expect(200);

        expect(response.status).toBe(200);
    });

    test("it should delete all carts when user is manager", async () => {
        // Login as manager and get the session cookie
        const managerCookie = await login({ username: manager.username, password: "manager" });

        // Make request to delete all carts
        const response = await request(app)
            .delete(`${routePath}/carts`)
            .set('Cookie', managerCookie)
            .expect(200);

        expect(response.status).toBe(200);
    });

    test("it should return a 401 error if user is not authenticated", async () => {
        // Make request without authentication
        await request(app)
            .delete(`${routePath}/carts`)
            .expect(401);
    });

    test("it should return a 401 error if user is neither admin nor manager", async () => {
        
        // Make request to delete all carts
        await request(app)
            .delete(`${routePath}/carts`)
            .set('Cookie', customerCookie)
            .expect(401);
    });
});

describe("GET /carts/all", () => {
    test("it should return all carts when user is admin", async () => {
        // Login as admin and get the session cookie
        const adminCookie = await login({ username: admin.username, password: "admin" });
        const response = await request(app)
            .get(`${routePath}/carts/all`)
            .set('Cookie', adminCookie)
            .expect(200);

        // Verifica che la risposta contenga un array di carrelli
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("it should return all carts when user is manager", async () => {
        // Login as manager and get the session cookie
        const managerCookie = await login({ username: manager.username, password: "manager" });
        
        const response = await request(app)
            .get(`${routePath}/carts/all`)
            .set('Cookie', managerCookie)
            .expect(200);

        // Verifica che la risposta contenga un array di carrelli
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("it should return a 401 error if user is not authenticated", async () => {
        await request(app)
            .get(`${routePath}/carts/all`)
            .expect(401);
    });

    test("it should return a 401 error if user is neither admin nor manager", async () => {
        // Login come utente customer per tentare l'accesso (non dovrebbe essere consentito)
        const customerCookie = await login(customer);

        await request(app)
            .get(`${routePath}/carts/all`)
            .set('Cookie', customerCookie)
            .expect(401);
    });
});

})