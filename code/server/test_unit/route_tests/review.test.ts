import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import Authenticator from "../../src/routers/auth"
import {ProductNotFoundError} from "../../src/errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import ErrorHandler from "../../src/helper"
import { validationResult } from 'express-validator';
import ReviewController from "../../src/controllers/reviewController"
import { ProductReview } from "../../src/components/review"
const baseURL = "/ezelectronics/reviews"

jest.mock("../../src/controllers/reviewController")
jest.mock("../../src/routers/auth")


const model = "test01"

const testProductReviews1 = new ProductReview ("test01", "customer", 2, "2024-02-02", "ok")
const testProductReviews2 = new ProductReview ("test01", "customer2", 3, "2024-04-02", "ok")


describe("POST - addReview", () => {
    test("SUCCESS 200 - the request params are correct", async () => {
        const testbody = {score: 2, comment: "test" }
        
        jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(undefined)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                notEmpty: () => ({ isLength: () => ({}) }),
                isInt: () => ({ isLength: () => ({}) }),
            })),
        }))
        
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(model, undefined, testbody.score, testbody.comment)
    })

    test("FAILURE - the request return an error", async () => {
        const testbody = {score: 2, comment: "test" }

        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new Error());
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})
        
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                notEmpty: () => ({ isLength: () => ({}) }),
                isInt: () => ({ isLength: () => ({}) }),
            })),
        }))
        
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(503)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(model, undefined, testbody.score, testbody.comment)
    })


    test("ERROR 422 - the score < 1 and the comment not empty", async () => {
        const testbody = {score: 0, comment: "test" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })

    test("ERROR 422 - the score > 5 anche the comment not empty", async () => {
        const testbody = {score: 7, comment: "test" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })

    test("ERROR 422 - the score is between 1 and 5 and the comment is empty", async () => {
        const testbody = {score: 3, comment: "" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })

    test("ERROR 422 - the score < 1 and the comment is empty", async () => {
        const testbody = {score: 0, comment: "" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })

    test("ERROR 422 - the score > 5 and the comment is empty", async () => {
        const testbody = {score: 7, comment: "" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });
        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })

    test("ERROR 401 - the user is not authenticated", async () => {
        const testbody = {score: 3, comment: "test" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        })

        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
    })

    test("ERROR 401 - the user is not a customer", async () => {
        const testbody = {score: 3, comment: "test" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer" });
        })

        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })

    test("ERROR 404 - the model is empty", async () => {
        const testbody = {score: 3, comment: "test" }

        const response = await request(app).post(baseURL + "/").send(testbody)
        expect(response.status).toBe(404)
    })

    test("ERROR 404 - the model does not exist", async () => {
        const testbody = {score: 3, comment: "test" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError())

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                notEmpty: () => ({ isLength: () => ({}) }),
                isInt: () => ({ isLength: () => ({}) }),
            })),
        }))

        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(404)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(model, undefined, testbody.score, testbody.comment)
    })

    test("ERROR 409 - the user has already made a review for this product", async () => {
        const testbody = {score: 3, comment: "test" }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError())

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                notEmpty: () => ({ isLength: () => ({}) }),
                isInt: () => ({ isLength: () => ({}) }),
            })),
        }))

        const response = await request(app).post(baseURL + "/" + model).send(testbody)
        expect(response.status).toBe(409)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(model, undefined, testbody.score, testbody.comment)
    })


})

describe("GET - getProductReviews", () => {
    test("SUCCESS 200 - it returns an array of reviews because the request params are correct", async () => {

        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([testProductReviews1, testProductReviews2])
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).get(baseURL + "/" + model)
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(model)
        expect(response.body).toEqual([testProductReviews1, testProductReviews2])
    })

    test("SUCCESS 200 - it returns an empty list because the product has no review ", async () => {

        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([])
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).get(baseURL + "/" + model)
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(model)
        expect(response.body).toEqual([])
    })

    test("FAILURE - the request return an error", async () => {

        jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new Error());
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).get(baseURL + "/" + model)
        expect(response.status).toBe(503)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(model)
    })


    test("ERROR 404 - the model is empty", async () => {
       
        const response = await request(app).get(baseURL + "/")
        expect(response.status).toBe(404)
    })

    test("ERROR 401 - the user is not authenticated", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        })

        const response = await request(app).get(baseURL + "/" + model)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
    })


})

describe("DELETE - deleteReview", () => {
    test("SUCCESS 200 - the request params are correct", async () => {

        jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(undefined)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).delete(baseURL + "/" + model)
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(model, undefined)
    })

    test("FAILURE - the request return an error", async () => {

        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new Error());
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).delete(baseURL + "/" + model)
        expect(response.status).toBe(503)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(model, undefined)
    })

    test("ERROR 404 - the model does not exist or the user does not have a review for this model", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError())

        const response = await request(app).delete(baseURL + "/" + model)
        expect(response.status).toBe(404)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(model, undefined)

    })

    test("ERROR 401 - the user is not authenticated", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        })

        const response = await request(app).delete(baseURL + "/" + model)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
    })

    test("ERROR 401 - the user is not a customer", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer" });
        })

        const response = await request(app).delete(baseURL + "/" + model)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
    })


})

describe("DELETE - deleteReviewsOfProduct", () => {
    test("SUCCESS 200 - the request params are correct", async () => {

        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).delete(baseURL + "/" + model + "/all")
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model)
    })

    test("FAILURE - the request return an error", async () => {

        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new Error());
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).delete(baseURL + "/" + model + "/all")
        expect(response.status).toBe(503)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model)
    })


    test("ERROR 404 - the model does not exist", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError())

        const response = await request(app).delete(baseURL + "/" + model + "/all")
        expect(response.status).toBe(404)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model)

    })

    test("ERROR 401 - the user is not authenticated", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        })

        const response = await request(app).delete(baseURL + "/" + model + "/all")
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
    })

    test("ERROR 401 - the user is not an admin or a manager", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an admin or manager" });
        })

        const response = await request(app).delete(baseURL + "/" + model + "/all")
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
    })

})

describe("DELETE - deleteAllReviews", () => {
    test("SUCCESS 200 - the request params are correct", async () => {

        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).delete(baseURL + "/")
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith()
    })

    test("FAILURE - the request return an error", async () => {

        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockRejectedValueOnce(new Error());
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next();})

        const response = await request(app).delete(baseURL + "/")
        expect(response.status).toBe(503)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith()
    })


    test("ERROR 401 - the user is not authenticated", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        })

        const response = await request(app).delete(baseURL + "/")
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
    })

    test("ERROR 401 - the user is not an admin or a manager", async () => {
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an admin or manager" });
        })

        const response = await request(app).delete(baseURL + "/")
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
    })


})