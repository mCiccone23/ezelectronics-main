import { describe, test, expect, jest } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { Role, User } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"

import exp from "constants"


jest.mock("../../src/dao/reviewDAO")

const controller = new ReviewController() //Create a new instance of the controller

const model = "test01"

const testProductReviews1 = new ProductReview ("test01", "customer", 2, "2024-02-02", "ok")
const testProductReviews2 = new ProductReview ("test01", "customer2", 3, "2024-04-02", "ok")

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")
//The test checks if the method returns void when the DAO method returns void
//The test also expects the DAO method to be called once with the correct parameters
describe("CONTROLLER - addReview", () => {

    test("SUCCESS - It should return void", async () => {
        const testReview = {score: 2, comment: "test"}
        //Mock the addReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce(undefined) 
        //Call the addReview method of the controller
        const response = await controller.addReview(model, testCustomer, testReview.score, testReview.comment)

        //Check if the addReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(model, testCustomer.username, testReview.score, testReview.comment)
        expect(response).toBe(undefined) //Check if the response is void
    })
  
    test("FAILURE - It should return an error", async () => {
        const testReview = {score: 2, comment: "test"}
        //Mock the addReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "addReview").mockRejectedValueOnce(new Error("Database error"));
        //Call the addReview method of the controller
        await expect(controller.addReview(model, testCustomer, testReview.score, testReview.comment)).rejects.toThrow("Database error");

        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(model, testCustomer.username, testReview.score, testReview.comment);
    })
  
    test("ERROR 404 - The product does not exist", async () => {
        const testReview = {score: 2, comment: "test"}
        //Mock the addReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError());
        //Call the addReview method of the controller
        await expect(controller.addReview(model, testCustomer, testReview.score, testReview.comment)).rejects.toThrowError(new ProductNotFoundError());

        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(model, testCustomer.username, testReview.score, testReview.comment);
    })


    test("ERROR 409 - The user has already made a review for this product", async () => {
        const testReview = {score: 2, comment: "test"}
        //Mock the addReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError());
        //Call the addReview method of the controller
        await expect(controller.addReview(model, testCustomer, testReview.score, testReview.comment)).rejects.toThrowError(new ExistingReviewError());

        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(model, testCustomer.username, testReview.score, testReview.comment);
    })

})

describe("CONTROLLER - getProductReviews", () => {

    test("SUCCESS - It should return a list of reviews ", async () => {
        //Mock the getProductReviews method of the DAO
        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce([testProductReviews1, testProductReviews2]) 
        //Call the getProductReviews method of the controller
        const response = await controller.getProductReviews(model)

        //Check if the getProductReviews method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(model)
        expect(response).toStrictEqual([testProductReviews1, testProductReviews2]) //Check if the response is void
    })
  
    test("SUCCESS - It should return an empty list of reviews ", async () => {
        //Mock the getProductReviews method of the DAO
        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce([]) 
        //Call the getProductReviews method of the controller
        const response = await controller.getProductReviews(model)

        //Check if the getProductReviews method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(model)
        expect(response).toStrictEqual([]) //Check if the response is void
    })

    test("FAILURE - It should return an error", async () => {
        //Mock the getProductReviews method of the DAO
        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockRejectedValueOnce(new Error("Database error")) 
        //Call the getProductReviews method of the controller
        await expect(controller.getProductReviews(model)).rejects.toThrow("Database error");

        //Check if the getProductReviews method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(model)

    })
})

describe("CONTROLLER - deleteReview", () => {

    test("SUCCESS - It should return void", async () => {
        //Mock the deleteReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(undefined) 
        //Call the deleteReview method of the controller
        const response = await controller.deleteReview(model, testCustomer)

        //Check if the deleteReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(model, testCustomer.username)
        expect(response).toBe(undefined) //Check if the response is void
    })
  

    test("FAILURE - It should return an error", async () => {
        //Mock the deleteReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(new Error("Database error"));
        //Call the deleteReview method of the controller
        await expect(controller.deleteReview(model, testCustomer)).rejects.toThrow("Database error");

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(model, testCustomer.username);
    })
  
    test("ERROR 404 - The product does not exist", async () => {
        //Mock the deleteReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError());
        //Call the deleteReview method of the controller
        await expect(controller.deleteReview(model, testCustomer)).rejects.toThrowError(new ProductNotFoundError());

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(model, testCustomer.username);
    })


    test("ERROR 404 - The user has not already made a review for this product", async () => {
        //Mock the deleteReview method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError());
        //Call the deleteReview method of the controller
        await expect(controller.deleteReview(model, testCustomer)).rejects.toThrowError(new NoReviewProductError());

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(model, testCustomer.username);
    })

})

describe("CONTROLLER - deleteReviewsOfProduct", () => {

    test("SUCCESS - It should return void", async () => {
        //Mock the deleteReviewsOfProduct method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined) 
        //Call the deleteReviewsOfProduct method of the controller
        const response = await controller.deleteReviewsOfProduct(model)

        //Check if the deleteReviewsOfProduct method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model)
        expect(response).toBe(undefined) //Check if the response is void
    })

    test("FAILURE - It should return an error", async () => {
        //Mock the deleteReviewsOfProduct method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new Error("Database error"));
        //Call the deleteReviewsOfProduct method of the controller
        await expect(controller.deleteReviewsOfProduct(model)).rejects.toThrow("Database error");

        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model);
    })
  
    test("ERROR 404 - The product does not exist", async () => {
        //Mock the deleteReviewsOfProduct method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError());
        //Call the deleteReviewsOfProduct method of the controller
        await expect(controller.deleteReviewsOfProduct(model)).rejects.toThrowError(new ProductNotFoundError());

        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model);
    })

  
})

describe("CONTROLLER - deleteAllReviews", () => {

    test("SUCCESS - It should return void", async () => {
        //Mock the deleteAllReviews method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined) 
        //Call the deleteAllReviews method of the controller
        const response = await controller.deleteAllReviews()

        //Check if the deleteAllReviews method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalled()
        expect(response).toBe(undefined) //Check if the response is void
    })

    test("FAILURE - It should return an error", async () => {
        //Mock the deleteAllReviews method of the DAO
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockRejectedValueOnce(new Error("Database error"));
        //Call the deleteAllReviews method of the controller
        await expect(controller.deleteAllReviews()).rejects.toThrow("Database error");

        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
    })

  
})