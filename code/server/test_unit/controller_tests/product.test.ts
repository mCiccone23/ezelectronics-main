import { test, expect, jest, describe, afterEach } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"

import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError, EmptyProductStockError } from "../../src/errors/productError"
import { DateError } from "../../src/utilities";
import { Category, Product } from "../../src/components/product"
import dayjs from "dayjs"

jest.mock("../../src/dao/productDAO")

describe("Register products", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should resolve successfully", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };
        jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce(); //Mock the registerProducts method of the DAO
        const controller = new ProductController(); //Create a new instance of the controller
        //Call the registerProducts method of the controller with the test user object
        const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
    
        //Check if the registerProducts method of the DAO has been called once with the correct parameters
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            testProduct.arrivalDate);
    });

    test("It should return Product Already exist error", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };
        jest.spyOn(ProductDAO.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError());
        const controller = new ProductController(); 

        const response = await expect(controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate))
        .rejects
        .toThrow(ProductAlreadyExistsError);

        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalled();
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            testProduct.arrivalDate);
        
    });

    test("Invalid date format", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "invalidDate",
            details: "",
            quantity: 100 };
            
        
        const controller = new ProductController(); 

        const response = await expect(controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate))
        .rejects
        .toThrow(Error);

        
    });
    test("Register without arrivalDate using current date", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            details: "",
            quantity: 100 };
            
        jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
        const controller = new ProductController(); 

        const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, null);

        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalled();
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            dayjs().format('YYYY-MM-DD'))
        
    });
    test("arrivalDate after current date", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            details: "",
            quantity: 100 };
            
        
        const controller = new ProductController(); 

        const response = await expect(controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate))
        .rejects
        .toThrow(Error);

        
    });
    
})

describe("Update quantity", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should return updated quantity", async () => {
        const product = new Product(100, "model", Category.SMARTPHONE, "2020-01-01", "", 100 );

        const upQuantityMock =  jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue(120);
    
        const controller = new ProductController();
        
        const response = await controller.changeProductQuantity(product.model, 20, "2023-01-01")
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalled();
        expect(response).toBe(120);

        upQuantityMock.mockRestore();


    });


    test("It should throw an error if model is an empty string", async () => {
        
        const controller = new ProductController();

        await expect(controller.changeProductQuantity("", 20, "2023-01-01")).rejects.toThrowError(
            Error("Invalid input parameters")
        );
      });

      
});

describe("Sell product", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should return updated quantity", async () => {
        const product = new Product(100, "model", Category.SMARTPHONE, "2020-01-01", "", 100 );

        const upQuantityMock =  jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValue(80);
    
        const controller = new ProductController();
        
        const response = await controller.sellProduct(product.model, 20, "2023-01-01")
        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalled();
        expect(response).toBe(80);

        upQuantityMock.mockRestore();


    });


    test("It should throw an error if model is an empty string", async () => {
        
        const controller = new ProductController();
      
        await expect(controller.sellProduct("", 20, "2023-01-01")).rejects.toThrowError(
            Error("Invalid input parameters")
        );
      });

      test("It should throw an error if sellingDate is not in a valid format", async () => {
        
        const controller = new ProductController();
      
        await expect(controller.sellProduct("model", 20, "invalidDate")).rejects.toThrowError(
            Error("Invalid date format")
        );
      });
      

      test("It should throw an error if sellingDate is after current date", async () => {
        
        const sellingDate = dayjs().add(1, 'day').format('YYYY-MM-DD')
        const controller = new ProductController();
      
        await expect(controller.sellProduct("model", 20, sellingDate)).rejects.toThrowError(
            DateError
        );
      });

      test("Update without sellingDate using current date", async () => {
            
        jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(120);
        const controller = new ProductController(); 

        const response = await controller.sellProduct("model", 20, null);

        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalled();
        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
            "model", 20,
            dayjs().format('YYYY-MM-DD'))
        
    });

      
});

describe("Get All Products", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should return all Products", async () => {

        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]

       const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(productsList);

        const controller = new ProductController();
        const response = await controller.getProducts(null, null, null);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalled();
        expect(response).toEqual(productsList)

        getProductsMock.mockRestore();

    });

    test("It should return error", async () => {
        const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new Error());

        const controller = new ProductController();
        await expect(controller.getProducts(null, null, null)).rejects.toThrow(Error);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalled();

        getProductsMock.mockRestore();
    });

    test("It should return Products with the selected category", async () => {

        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model3", Category.SMARTPHONE, "2020-01-01", "", 100 )]

       const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(productsList);

        const controller = new ProductController();
        const response = await controller.getProducts("category", "Smartphone",  null);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalled();
        expect(response).toEqual(productsList)

        getProductsMock.mockRestore();
    });

    test("It should return Products with the selected model", async () => {

        const productsList = [new Product(100, "model", Category.SMARTPHONE, "2020-01-01", "", 100 )]

       const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(productsList);

        const controller = new ProductController();
        const response = await controller.getProducts("model", null,  "model");

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalled();
        expect(response).toEqual(productsList)

        getProductsMock.mockRestore();
    });
})


describe("Get available Products", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should return all available Products", async () => {

        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]

       const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(productsList);

        const controller = new ProductController();
        const response = await controller.getAvailableProducts(null, null, null);

        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalled();
        expect(response).toEqual(productsList)

        getProductsMock.mockRestore();

    });

    test("It should return error", async () => {
        const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockRejectedValueOnce(new Error());

        const controller = new ProductController();
        await expect(controller.getAvailableProducts(null, null, null)).rejects.toThrow(Error);

        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalled();

        getProductsMock.mockRestore();
    });

    test("It should return available Products with the selected category", async () => {

        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model3", Category.SMARTPHONE, "2020-01-01", "", 100 )]

       const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(productsList);

        const controller = new ProductController();
        const response = await controller.getAvailableProducts("category", "Smartphone",  null);

        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalled();
        expect(response).toEqual(productsList)

        getProductsMock.mockRestore();
    });

    test("It should return available Products with the selected model", async () => {

        const productsList = [new Product(100, "model", Category.SMARTPHONE, "2020-01-01", "", 100 )]

       const getProductsMock =  jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(productsList);

        const controller = new ProductController();
        const response = await controller.getAvailableProducts("model", null,  "model");

        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalled();
        expect(response).toEqual(productsList)

        getProductsMock.mockRestore();
    });
})


describe("Delete product", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should return true", async () => {
        const product = new Product(100, "model", Category.SMARTPHONE, "2020-01-01", "", 100 )

        const delProductMock =  jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);

        const controller = new ProductController();

        const response =  await controller.deleteProduct(product.model);

        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalled();
        expect(response).toBe(true);

        delProductMock.mockRestore();

    })



    test("It should return error - empty model", async () => {

        const controller = new ProductController();

        await expect(controller.deleteProduct("")).rejects.toThrow(Error("Invalid input parameters"));

        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(0);
        

    })


})


describe("Delete all products", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("It should return true", async () => {

        const delProductsMock =  jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

        const controller = new ProductController();

        const response =  await controller.deleteAllProducts();

        expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalled();
        expect(response).toBe(true);

        delProductsMock.mockRestore();

    })


    
test("It should return error", async () => {
    const delProductsMock =  jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error());

    const controller = new ProductController();
    await expect(controller.deleteAllProducts()).rejects.toThrow(Error);

    expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalled();

    delProductsMock.mockRestore();
});


})