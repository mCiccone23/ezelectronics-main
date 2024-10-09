import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { beforeEach, afterEach } from "node:test"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductReview } from "../../src/components/review"

jest.mock("../../src/db/db.ts")


describe("DAO - addReview", () => {
    /*
    let reviewDAO: ReviewDAO

    beforeEach(() => { reviewDAO = new ReviewDAO() });
    afterEach(() => { jest.restoreAllMocks()});
    */
    test("SUCCESS - It should return void when review is added successfully", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exists
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the user has not already made a review for this product
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const result = await reviewDAO.addReview("model", "username", 3, "test");
        expect(result).toBeUndefined();

        expect(mockDBGet).toHaveBeenCalledTimes(2);
        expect(mockDBRun).toHaveBeenCalledTimes(1);

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    
    test("ERROR 404 - The product does not exist", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the product does not exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the user has not already made a review for this product
            return {} as Database
        })

        await expect(reviewDAO.addReview("model", "username", 3, "test")).rejects.toThrowError(new ProductNotFoundError());

        expect(mockDBGet).toHaveBeenCalledTimes(2);

        mockDBGet.mockRestore();
    });

    test("ERROR 409 - The user has already made a review for this product", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the user has already made a review for this product
            return {} as Database
        })

        await expect(reviewDAO.addReview("model", "username", 3, "test")).rejects.toThrowError(new ExistingReviewError());

        expect(mockDBGet).toHaveBeenCalledTimes(2);

        mockDBGet.mockRestore();
    });

    test("FAILURE - It throw a DB error during review insertion", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the user has not already made a review for this product
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        });

        await expect(reviewDAO.addReview("model", "username", 3, "test")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalledTimes(2);
        expect(mockDBRun).toHaveBeenCalled();

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("FAILURE - It throw a DB error during get product", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        })

        await expect(reviewDAO.addReview("model", "username", 3, "test")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalledTimes(1);

        mockDBGet.mockRestore();
    });


    test("FAILURE - It throw a DB error during get the customer review for this produce", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        })

        await expect(reviewDAO.addReview("model", "username", 3, "test")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalledTimes(2);

        mockDBGet.mockRestore();
    });


});

describe("DAO - getProductReviews", () => {
    /*
    let reviewDAO: ReviewDAO

    beforeEach(() => { reviewDAO = new ReviewDAO() });
    afterEach(() => { jest.restoreAllMocks()});
    */
test("SUCCESS - It should return the list of reviews for a product", async () => {
    const reviewDAO = new ReviewDAO();

    const model = "model1";
    const mockRows = [
        { model: 'model1', username: 'user1', score: 5, date: '2023-01-01', comment: 'Great product!' },
        { model: 'model1', username: 'user2', score: 4, date: '2023-01-02', comment: 'Good product!' },
    ];

    const mockGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, { count: 1 }); //the product exists
        return {} as any; 
    });

    const mockAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockRows);
        return {} as any; 
    });

    const result = await reviewDAO.getProductReviews(model);
    const expectedReviews = mockRows.map(row => new ProductReview(row.model, row.username, row.score, row.date, row.comment));

    expect(result).toEqual(expectedReviews);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockAll).toHaveBeenCalledTimes(1);

    mockGet.mockRestore();
    mockAll.mockRestore();
});

test("SUCCESS - It should return an empty list if the product has no reviews", async () => {
    const reviewDAO = new ReviewDAO();
    const model = "model2"; 

    const mockGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, { count: 1 }); //the product exists
        return {} as any;
    });

    const mockAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, []);
        return {} as any;
    });

    const result = await reviewDAO.getProductReviews(model);

    expect(result).toEqual([]);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockAll).toHaveBeenCalledTimes(1);

    mockGet.mockRestore();
    mockAll.mockRestore();
});


test("FAILED - It should throw a ProductNotFoundError if the product does not exist", async () => {
    const reviewDAO = new ReviewDAO();
    const model = "nonexistent_model";

    const mockGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, { count: 0 }); // the product does not exist
        return {} as any;
    });

    await expect(reviewDAO.getProductReviews(model)).rejects.toThrow(ProductNotFoundError);

    expect(mockGet).toHaveBeenCalledTimes(1);

    mockGet.mockRestore();
});


test("FAILED - It should throw a DB error during get product reviews", async () => {
    const reviewDAO = new ReviewDAO();
    const model = "model3"; 

    const mockGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, { count: 1 }); //the product exists
        return {} as any;
    });

    const mockAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(new Error("Database error"));
        return {} as any;
    });

    await expect(reviewDAO.getProductReviews(model)).rejects.toThrow("Database error");

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockAll).toHaveBeenCalledTimes(1);

    mockGet.mockRestore();
    mockAll.mockRestore();
});


})

describe("DAO - deleteReview", () => {
    /*
    let reviewDAO: ReviewDAO

    beforeEach(() => { reviewDAO = new ReviewDAO() });
    afterEach(() => { jest.restoreAllMocks()});
    */
    test("SUCCESS - It should return void when review is deleted successfully", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exists
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the user has already made a review for this product
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const result = await reviewDAO.deleteReview("model", "username");
        expect(result).toBeUndefined();

        expect(mockDBGet).toHaveBeenCalled();
        expect(mockDBRun).toHaveBeenCalledTimes(1);

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });


    test("ERROR 404 - The product does not exist", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the product does not exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the user has not already made a review for this product
            return {} as Database
        })

        await expect(reviewDAO.deleteReview("model", "username")).rejects.toThrowError(new ProductNotFoundError());

        expect(mockDBGet).toHaveBeenCalled();

        mockDBGet.mockRestore();
    });

    test("ERROR 404 - The user has not already made a review for this product", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the user has not already made a review for this product
            return {} as Database
        })

        await expect(reviewDAO.deleteReview("model", "username")).rejects.toThrowError(new NoReviewProductError());

        expect(mockDBGet).toHaveBeenCalled();

        mockDBGet.mockRestore();
    });

    test("FAILURE - It throw a DB error during review delete", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the user has already made a review for this product
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        });

        await expect(reviewDAO.deleteReview("model", "username")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalled();
        expect(mockDBRun).toHaveBeenCalled();

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("FAILURE - It throw a DB error during get product", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        })

        await expect(reviewDAO.deleteReview("model", "username")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalled();

        mockDBGet.mockRestore();
    });

    test("FAILURE - It throw a DB error during get the customer review for this produce", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })
        .mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        })

        await expect(reviewDAO.deleteReview("model", "username")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalled();

        mockDBGet.mockRestore();
    });


})

describe("DAO - deleteReviewsOfProduct", () => {
    /*
    let reviewDAO: ReviewDAO

    beforeEach(() => { reviewDAO = new ReviewDAO() });
    afterEach(() => { jest.restoreAllMocks()});
    */
    test("SUCCESS - It should return void when the product reviews are deleted successfully", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exists
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const result = await reviewDAO.deleteReviewsOfProduct("model");
        expect(result).toBeUndefined();

        expect(mockDBGet).toHaveBeenCalled();
        expect(mockDBRun).toHaveBeenCalledTimes(1);

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });


    test("ERROR 404 - The product does not exist", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 0 })    //the product does not exist
            return {} as Database
        })

        await expect(reviewDAO.deleteReviewsOfProduct("model")).rejects.toThrowError(new ProductNotFoundError());

        expect(mockDBGet).toHaveBeenCalled();

        mockDBGet.mockRestore();
    });

    test("FAILURE - It throw a DB error during review delete", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(null, { count: 1 })    //the product exist
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        });

        await expect(reviewDAO.deleteReviewsOfProduct("model")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalled();
        expect(mockDBRun).toHaveBeenCalled();

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("FAILURE - It throw a DB error during get product", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        })

        await expect(reviewDAO.deleteReviewsOfProduct("model")).rejects.toThrow("Database error");

        expect(mockDBGet).toHaveBeenCalled();

        mockDBGet.mockRestore();
    });


})

describe("DAO - deleteAllReviews", () => {
    /*
    let reviewDAO: ReviewDAO

    beforeEach(() => { reviewDAO = new ReviewDAO() });
    afterEach(() => { jest.restoreAllMocks()});
    */
    test("SUCCESS - It should return void when all reviews are deleted successfully", async () => {
        const reviewDAO = new ReviewDAO()

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, callback) => {
            callback(null);
            return {} as Database
        });

        const result = await reviewDAO.deleteAllReviews();
        expect(result).toBeUndefined();
        expect(mockDBRun).toHaveBeenCalledTimes(1);

        mockDBRun.mockRestore();
    });


    test("FAILURE - It throw a DB error during review delete", async () => {
        const reviewDAO = new ReviewDAO()

        const mockDBRun = jest.spyOn(db, "run")
        .mockImplementation((sql, callback) => {
            callback(new Error("Database error"));
            return {} as Database
        });

        await expect(reviewDAO.deleteAllReviews()).rejects.toThrow("Database error");

        expect(mockDBRun).toHaveBeenCalled();

        mockDBRun.mockRestore();
    });



})