import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import Authenticator from "../../src/routers/auth"
import { Cart } from "../../src/components/cart"
import { Category, Product } from "../../src/components/product"
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from '../../src/errors/cartError'
import CartController from "../../src/controllers/cartController"
import ErrorHandler from "../../src/helper"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError, ProductSoldError } from "../../src/errors/productError"
const baseURL = "/ezelectronics/carts"

jest.mock("../../src/controllers/cartController")
jest.mock("../../src/routers/auth")

const testCart = new Cart("customer", true, "2024-02-11", 500, [{ model: "model", quantity: 1, category: Category.LAPTOP, price: 500 }]);
const testCart1 = new Cart("customer", true, "2024-02-11", 500, [{ model: "model", quantity: 1, category: Category.LAPTOP, price: 500 }]);
const testCart2 = new Cart("customer", true, "2023-02-11", 400, [{ model: "model", quantity: 1, category: Category.SMARTPHONE, price: 400 }]);
const testProduct = new Product(100, "model", Category.APPLIANCE, "2024-02-11", "", 4);

describe("GET - retrieve the cart of the logged in customer", ()=>{
    test("SUCCESS 200 - it should returns the cart of the logged in customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: "customer" };
            return next();
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testCart);

        const response = await request(app).get(baseURL);
        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.getCart).toHaveBeenCalledWith({ username: "customer" });
        expect(response.body).toEqual(testCart);
    });
    test("FAILED 401 - it should return 401 if user is not authenticated", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).get(baseURL);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });
    test("FAILED 401 - it should return 401 if the user is not a customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });

        const response = await request(app).get(baseURL);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });
    test("FAILED 503 - it should return 503 if there is an internal server error", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
            req.user = { username: "customer" };
            return next();
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).get(baseURL);

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });
    });
});

describe("POST - add a product unit to the cart of the logged in customer", ()=>{
    test("SUCCESS 200 - it should add a product unit to the cart", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
            req.user = {username: "customer"};
            return next(); 
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next)=>next());
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app).post(baseURL).send({ model: "model"});

        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith({ username: "customer" }, "model");
    });
    test("FAILED 422 - it should return 422 if 'model' is not provided", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app).post(baseURL).send({});
        
        expect(response.status).toBe(422);
        
    });
    test("FAILED 401 - it should return 401 if user is not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        });
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app)
            .post(baseURL)
            .send({ model: "model" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });
    test("FAILED 401 - it should return 401 if user is not a customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app)
            .post(baseURL)
            .send({ model: "model" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });
    test("FAILED 404 - it should return 404 if model does not represent an existing product", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: "customer" }; 
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError());

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));
        const response = await request(app)
            .post(baseURL)
            .send({ model: "nonExistingModel" });

            expect(response.status).toBe(404);
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
            expect(CartController.prototype.addToCart).toHaveBeenCalledWith({ username: "customer" }, "nonExistingModel");
    });
    test("FAILED 409 - it should return 409 if model represents a product whose available quantity is 0", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: "customer" };
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError);

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app)
            .post(baseURL)
            .send({ model: "outOfStockModel" });

        expect(response.status).toBe(409);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith({ username: "customer" }, "outOfStockModel");
    });

    test("FAILED 503 - it should return 503 if there is an internal server error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: "customer" }; 
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new Error("Internal Server Error"));

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app)
            .post(baseURL)
            .send({ model: "model" });

        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith({ username: "customer" }, "model");
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });

    });
});

describe("PATCH - checkout the cart of the logged in customer", ()=>{
    test("SUCCESS 200 - it should return 200 if the cart is successfully checked out", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);
    });
    test("FAILED 401 - it should return 401 if the user is not authenticated", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });
    test("FAILED 401 - it should return 401 if the user is not a customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });
        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });
    test("FAILED 404 - it should return 404 if there is no information about an unpaid cart in the database", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError());

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);
    });
    test("FAILED 400 - it should return 400 if the cart is empty", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError());

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(400);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);
    });
    test("FAILED 409 - it should return 409 if at least one product in the cart is unavailable in the required quantity", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new ProductSoldError());

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(409);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);
    });
    test("FAILED 409 - it should return 409 if at least one product in the cart has a higher quantity than available in the stock", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError());

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(409);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);
    });
    test("FAILED 503 - it should return 503 if there is an internale server error", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).patch(baseURL).send();

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);
    });
});

describe("GET - get the history of the logged in customer's carts", ()=>{
    test("SUCCESS 200 - it should return the history of the logged in customer's carts", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testCart1, testCart2]);

        const response = await request(app).get(baseURL + '/history').send();

        expect(response.status).toBe(200);
        expect(response.body).toEqual([testCart1, testCart2]);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(undefined);
    });
    test("FAILED 401 - it should return 401 if user is not authenticated", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).get(baseURL + '/history').send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });
    test("FAILED 401 - it should return 401 if user is not a customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });

        const response = await request(app).get(baseURL + '/history').send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });
    test("FAILED 503 - it should return 503 if there is an internal server error", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).get(baseURL + '/history').send();

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503});
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(undefined);
    })
});


describe("DELETE - remove a product unit from a cart", () => {
    test("SUCCESS 200 - it removes the product from the cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model");
    });

    test("FAILED 401 - it should return 401 if user is not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });

    test("FAILED 401 - it should return 401 if user is not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });

    test("FAILED 404 - it should return 404 if model represents a product that is not in the cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model");
    });

    test("FAILED 404 - it should return 404 if there is no information about an unpaid cart for the user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError());

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model");
    });

    test("FAILED 404 - it should return 404 if model does not represent an existing product", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError());

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model");
    });

    test("FAILED 503 - it should return 503 if there is an internal server error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).delete(`${baseURL}/products/model`).send();

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model");
    });
});

describe("DELETE - remove all products from the current cart", () => {
    test("SUCCESS 200 - it removes all products from the current cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);

        const response = await request(app).delete(baseURL + '/current').send();

        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith(undefined);
    });

    test("FAILED 401 - it should return 401 if user is not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).delete(baseURL + '/current').send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });

    test("FAILED 401 - it should return 401 if user is not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });

        const response = await request(app).delete(baseURL + '/current').send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });

    test("FAILED 404 - it should return 404 if there is no information about an unpaid cart for the user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError());

        const response = await request(app).delete(baseURL + '/current').send();

        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith(undefined);
    });

    test("FAILED 503 - it should return 503 if there is an internal server error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).delete(baseURL + '/current').send();

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled();
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith(undefined);
    });
});

describe("DELETE - delete all carts", () => {
    test("SUCCESS 200 - it deletes all carts", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

        const response = await request(app).delete(baseURL).send();

        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled();
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
    });

    test("FAILED 401 - it should return 401 if user is not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).delete(baseURL).send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthenticated user" });
    });

    test("FAILED 401 - it should return 401 if user is not an admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized user" });
        });

        const response = await request(app).delete(baseURL).send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized user" });
    });

    test("FAILED 503 - it should return 503 if there is an internal server error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).delete(baseURL).send();

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled();
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
    });
});



describe("GET - retrieve all carts of all users", ()=>{
    test("SUCCESS 200 - it returns all carts because the request params are correct", async()=>{
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{return next();})
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testCart1, testCart2]);

        const response = await request(app).get(baseURL + "/all");
        expect(response.status).toBe(200);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled();
        expect(CartController.prototype.getAllCarts).toHaveBeenCalled();
        expect(response.body).toEqual([testCart1, testCart2]);
    });
    test("FAILED 401 - it should return 401 if user is not authenticated", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
            return res.status(401).json({ error: "Unauthenticated user" });
        });

        const response = await request(app).get(baseURL + "/all");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: "Unauthenticated user"});
    });
    test("FAILED 401 - it should return 401 if user is not admin or manager", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) =>{
            return res.status(401).json({error: "Unauthorized user"});
        });

        const response = await request(app).get(baseURL + "/all");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: "Unauthorized user"});
    });
    test("FAILED 503 - it should return 503 if there is an internal server error", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());

        jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error("Internal Server Error"));

        const response = await request(app).get(baseURL + "/all");

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: "Internal Server Error", status: 503 });
    });
});