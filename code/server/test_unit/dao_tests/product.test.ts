import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import ProductDAO from "../../src/dao/productDAO"
import dayjs from "dayjs"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError, EmptyProductStockError } from "../../src/errors/productError"
import { DateError } from "../../src/utilities";
import { Category, Product } from "../../src/components/product"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")


describe("Register products", () => {
    const productDAO = new ProductDAO();

    test("It should resolve successfully", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
    

        await productDAO.registerProducts("model", "category", 100, "details", 100, "arrivalDate");
        expect(mockDBRun).toHaveBeenCalled();
        mockDBRun.mockRestore();
    });
    

    test("It should reject Model Already Exist", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const error = new Error("UNIQUE constraint failed: products.model");
            callback(error);
            return {} as Database;
        });

        try {
            await productDAO.registerProducts("model", "category", 100, "details", 100, "arrivalDate");
        } catch (error) {
            expect(error).toBeInstanceOf(ProductAlreadyExistsError);
        }

        mockDBRun.mockRestore();
    });

    test("It should handle errors", async () => {
        const productDAO = new ProductDAO();
    
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(Error);
            return {} as Database;
        });
        
        await expect(productDAO.registerProducts("model", "category", 100, "details", 100, "arrivalDate"))
            .rejects.toThrow(Error);

        // Clean up mocks
        mockDBRun.mockRestore()

    });

      

});

describe("Update quantity", () => {

    test("It should update product quantity", async () => {
        const productDAO = new ProductDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { quantity: 100, arrivalDate: "2020-01-01" }); // Mock existing product data
          });
    
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        

        const result = await productDAO.changeProductQuantity("model", 20, "2023-01-01");
        expect(result).toEqual(120);
        expect(mockDBRun).toHaveBeenCalled();
        
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("It should update product quantity with changeDate  empty, using current date ", async () => {
        const productDAO = new ProductDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { quantity: 100, arrivalDate: '2020-01-01' }); // Mock existing product data
          });
    
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        

        const result = await productDAO.changeProductQuantity("model", 20, null);
        expect(result).toEqual(120);
        expect(mockDBRun).toHaveBeenCalled();
        
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    
    test("It should reject if Model Not Exists", async () => {
        const productDAO = new ProductDAO();
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, null);
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.changeProductQuantity("notExistingModel", 20, "2023-01-01");
        } catch (error) {
            expect(error).toBeInstanceOf(ProductNotFoundError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should reject if changeDate is not valid", async () => {
        const productDAO = new ProductDAO();
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 100, arrivalDate: "2020-01-01" });
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.changeProductQuantity("model", 20, "notADate");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should reject if changeDate is after currentDate", async () => {
        const productDAO = new ProductDAO();
        const changeDate = dayjs().add(1, 'day').format('YYYY-MM-DD'); // Get today's date

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 100, arrivalDate: "2020-01-01" });
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.changeProductQuantity("model", 20, changeDate);
        } catch (error) {
            expect(error).toBeInstanceOf(DateError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });


    test("It should reject if changeDate is before arrivalDate", async () => {
        const productDAO = new ProductDAO();
        const changeDate = '2019-01-01'; // Get today's date

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 100, arrivalDate: "2020-01-01" });
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.changeProductQuantity("model", 20, changeDate);
        } catch (error) {
            expect(error).toBeInstanceOf(DateError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should handle errors in update", async () => {
        const productDAO = new ProductDAO();
    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 100, arrivalDate: "2020-01-01" });
          });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });
        
        await expect(productDAO.changeProductQuantity("model", 20, "2023-01-01"))
            .rejects.toThrow("Database error");

        // Clean up mocks
        mockDBRun.mockRestore()
        mockDBGet.mockRestore()
    });
      

});

describe("Sell product", () => {

    test("It should sell a product", async () => {
        const productDAO = new ProductDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { quantity: 100, arrivalDate: "2020-01-01" }); // Mock existing product data
          });
    
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        

        const result = await productDAO.sellProduct("model", 20, "2023-01-01");
        expect(result).toEqual(80);
        expect(mockDBRun).toHaveBeenCalled();
        
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    
    test("It should reject if Model Not Exists", async () => {
        const productDAO = new ProductDAO();
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, null);
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.sellProduct("notExistingModel", 20, "2023-01-01");
        } catch (error) {
            expect(error).toBeInstanceOf(ProductNotFoundError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });



    test("It should reject if sellingDate is before arrivalDate", async () => {
        const productDAO = new ProductDAO();
        const sellingDate = '2019-01-01';

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 100, arrivalDate: "2020-01-01" });
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.sellProduct("model", 20, sellingDate);
        } catch (error) {
            expect(error).toBeInstanceOf(DateError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should reject if stock quantity = 0", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 0, arrivalDate: "2020-01-01" });
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

       

        try {
            await productDAO.sellProduct("model", 20, "2023-01-01");
        } catch (error) {
            expect(error).toBeInstanceOf(EmptyProductStockError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should reject if stock quantity is too low", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 18, arrivalDate: "2020-01-01" });
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
       

        try {
            await productDAO.sellProduct("model", 20, "2023-01-01");
        } catch (error) {
            expect(error).toBeInstanceOf(LowProductStockError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should handle errors in db get", async () => {
        const productDAO = new ProductDAO();
    
        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });
        
        await expect(productDAO.sellProduct("model", 20, "2023-01-01"))
            .rejects.toThrow("Database error");

        // Clean up mocks
        mockDBRun.mockRestore()
    });

    test("It should handle errors in update", async () => {
        const productDAO = new ProductDAO();
    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model", quantity: 100, arrivalDate: "2020-01-01" });
          });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });
        
        await expect(productDAO.sellProduct("model", 20, "2023-01-01"))
            .rejects.toThrow("Database error");

        // Clean up mocks
        mockDBRun.mockRestore()
        mockDBGet.mockRestore()
    });

});

describe("Get Products", () => {
    test("It should return all products", async () => {
        const productDAO = new ProductDAO();

        const mockProducts = [
            { sellingPrice: 100, model: "model1", category: "Smartphone", arrivalDate: "2020-01-01", details: "", quantity: 100 },
            { sellingPrice: 100, model: "model2", category: "Smartphone", arrivalDate: "2020-01-01", details: "", quantity: 100 },
            { sellingPrice: 100, model: "model3", category: "Appliance", arrivalDate: "2020-01-01", details: "", quantity: 100 }
        ];
    

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, mockProducts);
        });
    
        const result = await productDAO.getProducts(null, null, null);
    
        expect(result).toHaveLength(mockProducts.length);
        expect(result[0]).toBeInstanceOf(Product);
        expect(result[0].model).toBe(mockProducts[0].model);
        expect(result[1].model).toBe(mockProducts[1].model);
        expect(result[2].model).toBe(mockProducts[2].model);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });


    
    test("It should return products with the selected category", async () => {
        const productDAO = new ProductDAO();

        const mockProducts = [
            { sellingPrice: 100, model: "model1", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "", quantity: 100 },
            { sellingPrice: 100, model: "model2", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "", quantity: 100 }
        ];
        
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, mockProducts)
        });
    
        const result = await productDAO.getProducts("category", "Smartphone", null);
    
        expect(result).toHaveLength(mockProducts.length);
        expect(result[0]).toBeInstanceOf(Product);
        expect(result[0].model).toBe(mockProducts[0].model);
        expect(result[1].model).toBe(mockProducts[1].model);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });

    
    test("It should return products with the selected model", async () => {
        const productDAO = new ProductDAO();

        const mockProducts = [
            { sellingPrice: 100, model: "model3", category: Category.APPLIANCE, arrivalDate: "2020-01-01", details: "", quantity: 100 }
        ];
    
       
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, mockProducts)
        });
    
        const result = await productDAO.getProducts("model", null, "model3");
    
        expect(result).toHaveLength(mockProducts.length);
        expect(result[0]).toBeInstanceOf(Product);
        expect(result[0].model).toBe(mockProducts[0].model);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });

    test("It should reject if Product is not found", async () => {
        const productDAO = new ProductDAO();
        
        // Mock db.all to return an error
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, []);
        });

        await expect(productDAO.getProducts("model", null, "model")).rejects.toThrow(ProductNotFoundError);

        // Clean up mocks
        mockDBAll.mockRestore();
    });

    test("It should handle errors in db all", async () => {
        const productDAO = new ProductDAO();
    
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });
        
        await expect(productDAO.getProducts(null, null, null))
            .rejects.toThrow("Database error");

        // Clean up mocks
        mockDBAll.mockRestore()
    });
});


describe("Get available Products", () => {
    test("It should return all products", async () => {
        const productDAO = new ProductDAO();

        const mockProducts = [
            { sellingPrice: 100, model: "model1", category: "Smartphone", arrivalDate: "2020-01-01", details: "", quantity: 100 },
            { sellingPrice: 100, model: "model2", category: "Smartphone", arrivalDate: "2020-01-01", details: "", quantity: 100 },
            { sellingPrice: 100, model: "model3", category: "Appliance", arrivalDate: "2020-01-01", details: "", quantity: 100 }
        ];
    

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, mockProducts);
        });
    
        const result = await productDAO.getAvailableProducts(null, null, null);
    
        expect(result).toHaveLength(mockProducts.length);
        expect(result[0]).toBeInstanceOf(Product);
        expect(result[0].model).toBe(mockProducts[0].model);
        expect(result[1].model).toBe(mockProducts[1].model);
        expect(result[2].model).toBe(mockProducts[2].model);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });


    
    test("It should return products with the selected category", async () => {
        const productDAO = new ProductDAO();

        const mockProducts = [
            { sellingPrice: 100, model: "model1", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "", quantity: 100 },
            { sellingPrice: 100, model: "model2", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "", quantity: 100 }
        ];
        
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, mockProducts)
        });
    
        const result = await productDAO.getAvailableProducts("category", "Smartphone", null);
    
        expect(result).toHaveLength(mockProducts.length);
        expect(result[0]).toBeInstanceOf(Product);
        expect(result[0].model).toBe(mockProducts[0].model);
        expect(result[1].model).toBe(mockProducts[1].model);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });

    
    test("It should return products with the selected model", async () => {
        const productDAO = new ProductDAO();

        const mockProducts = [
            { sellingPrice: 100, model: "model3", category: Category.APPLIANCE, arrivalDate: "2020-01-01", details: "", quantity: 100 }
        ];
    
        
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, [], callback) => {
            return callback(null, mockProducts)
        });
    
        const result = await productDAO.getAvailableProducts("model", null, "model3");
    
        expect(result).toHaveLength(mockProducts.length);
        expect(result[0]).toBeInstanceOf(Product);
        expect(result[0].model).toBe(mockProducts[0].model);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });

    test("It should reject if Product is not found", async () => {
        const productDAO = new ProductDAO();
        
        const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError());

        await expect(productDAO.getAvailableProducts("model", null, "model")).rejects.toThrow(ProductNotFoundError);

        // Clean up mocks
        mockGetProducts.mockRestore();
    });

    test("It should handle errors in db all", async () => {
        const productDAO = new ProductDAO();
    
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });
        
        await expect(productDAO.getAvailableProducts(null, null, null))
            .rejects.toThrow("Database error");

        // Clean up mocks
        mockDBAll.mockRestore()
    });
});

describe('Delete all products', () => {

    test("It should delete products", async () => {
        const productDAO = new ProductDAO();
    
        // Mock db.run to return success
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(null);
            return {} as Database;
        });
          
        const result = await productDAO.deleteAllProducts();
    
        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledTimes(1);

        // Clean up mocks
        mockDBRun.mockRestore();
    });
    
    test("It should handle errors in deleteAllProducts", async () => {
        const productDAO = new ProductDAO();

    
        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            return callback(new Error("Database error"));
        });
    
        await expect(productDAO.deleteAllProducts()).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBRun.mockRestore();
    });
 })
  

describe("Delete a product", () => {

    test("It should delete product", async () => {
        const productDAO = new ProductDAO();
       
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model" }); // Mock existing product data
          });
    
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
    
        const result = await productDAO.deleteProduct("model");
    
        expect(result).toBe(true);
    
        // Clean up mocks
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    
    
    test("It should handle errors in db run", async () => {
        const productDAO = new ProductDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, { model: "model" }); // Mock existing product data
          });
    
        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            return callback(new Error("Database error"));
        });
    
        await expect(productDAO.deleteProduct("model")).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("It should handle errors in db get", async () => {
        const productDAO = new ProductDAO();

    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });
    
        await expect(productDAO.deleteProduct("model")).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBGet.mockRestore();
    });

    
    
    test("It should reject if Product Not Exists", async () => {
        const productDAO = new ProductDAO();
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, null);
          });

        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        try {
            await productDAO.deleteProduct("notExistingModel");
        } catch (error) {
            expect(error).toBeInstanceOf(ProductNotFoundError);
        }
        // Clean up mocks
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    });
 })




