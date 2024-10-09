import { describe, test, expect, jest, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import dayjs from "dayjs"

import ProductController from "../../src/controllers/productController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import { Category, Product } from "../../src/components/product"
import ErrorHandler from "../../src/helper"
import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError, EmptyProductStockError } from "../../src/errors/productError"
const baseURL = "/ezelectronics"
import { validationResult } from 'express-validator';
import { DateError } from "../../src/utilities"



jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

//Example of a unit test for the POST ezelectronics/products route
//The test checks if the route returns a 200 success code
//The test also expects the registerProducts method of the controller to be called once with the correct parameters
describe("Register products route tests", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    test("It should return a 200 success code", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        const isAdminOrManagerMock =  jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })

        const validateRequestMock = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL + "/products").send(testProduct)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            testProduct.arrivalDate)

        isLoggedMock.mockRestore();
        isAdminOrManagerMock.mockRestore();
        validateRequestMock.mockRestore();
    })
    
    test("It should return a 503 error code on failure", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        const isAdminOrManagerMock =  jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        const validateRequestMock = jest.spyOn(ProductController.prototype, "registerProducts").mockImplementation(() => {
            throw new Error("Generic error");
        });

        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.error);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            testProduct.arrivalDate)

        isLoggedMock.mockRestore();
        isAdminOrManagerMock.mockRestore();
        validateRequestMock.mockRestore();
    });
    
    test("Error 422 - model empty", async () => {

        const testProduct = { sellingPrice: 100,
            model: "",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL + "/products").send(testProduct) 
        expect(response.status).toBe(422)
    })

    test("Error 422 - category not in Smartphone, Laptop, Appliance", async () => {

        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Console",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL + "/products").send(testProduct) 
        expect(response.status).toBe(422)
    })

    test("Error 422 - quantity<=0", async () => {

        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 0 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL + "/products").send(testProduct) 
        expect(response.status).toBe(422)
    })

    test("Error 422 - sellingPrice<=0", async () => {

        const testProduct = { sellingPrice: 0,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL + "/products").send(testProduct) 
        expect(response.status).toBe(422)
    })


    test("It should return 401 error - User is not Logged", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL + "/products");
      
        expect(response.status).toBe(401);
        expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled();
      });
      

    test("It should return 401 error - User is not logged as Admin or Manager", async () => {

        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).post(baseURL + "/products")
        expect(response.status).toBe(401)
    })
    
    test("Error 409 - Product already exists", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };
    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
            

            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
     
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError())
            const response = await request(app).post(baseURL + "/products").send(testProduct) 
            expect(response.status).toBe(409)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate)

    });


    test("Error 400 - arrivalDate is after current date", async () => {

        const testProduct = {
          sellingPrice: 100,
          model: "model",
          category: "Smartphone",
          arrivalDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          details: "",
          quantity: 100,
        };
      
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          req.user = { username: testAdmin.username };
          return next();
        });
      
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
          return next();
        });

      
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next();
          });
 
          jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new DateError())
          const response = await request(app).post(baseURL + "/products").send(testProduct) 
          expect(response.status).toBe(400)
          expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
              testProduct.category,
              testProduct.quantity,
              testProduct.details,
              testProduct.sellingPrice,
              testProduct.arrivalDate)
      });
      
})


describe("Update product quantity", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    test("It should return a 200 success code", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })
        
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(120)
        const response = await request(app).patch(baseURL + "/products/model").send({quantity: 20, changeDate: "2023-01-01"})
        expect(response.status).toBe(200)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, 20, "2023-01-01")


    })

      

    
    test("It should return a 503 error code on failure", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new Error());
        const response = await request(app).patch(baseURL + "/products/model").send({quantity: 20, changeDate: "2023-01-01"});
        expect(response.error);
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, 20, "2023-01-01")

        jest.clearAllMocks();

    });


    test("Error 422 - quantity<=0", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        const response = await request(app).patch(baseURL + "/products/model/").send({quantity: 0, changeDate: "2023-01-01"});
        expect(response.status).toBe(422)

        jest.clearAllMocks();
    })


    test("It should return 401 error - User is not Logged", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(120)
        const response = await request(app).patch(baseURL + "/products/model");
      
        expect(response.status).toBe(401);
        expect(ProductController.prototype.changeProductQuantity).not.toHaveBeenCalled();

        jest.clearAllMocks();
      });
      

    test("It should return 401 error - User is not logged as Admin or Manager", async () => {

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(120)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).patch(baseURL + "/products/model")
        expect(response.status).toBe(401)

        jest.clearAllMocks();
    })
    

    test("Error 404 - Product does not exist", async () => {
    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
            

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }
        next();
        });
        
        
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError());
    
        const response = await request(app).patch(baseURL + "/products/model").send({quantity: 20, changeDate: "2023-01-01"});
        expect(response.status).toBe(404)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("model", 20, "2023-01-01")
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        jest.clearAllMocks();

    });


    test("Error 400 - changeDate is after current date", async () => {
      
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          req.user = { username: testAdmin.username };
          return next();
        });
      
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
          return next();
        });

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(
            [{
                sellingPrice: 100,
                model: "model",
                category: Category.SMARTPHONE,
                arrivalDate: "2020-01-01",
                details: "",
                quantity: 100,
              }]);
      
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
          });
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateError());
        const response = await request(app).patch(baseURL + "/products/model").send(
            {quantity: 20, changeDate: dayjs().add(1, 'day').format('YYYY-MM-DD')}); 
        expect(response.status).toBe(400)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("model", 20, dayjs().add(1, 'day').format('YYYY-MM-DD'))
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        jest.clearAllMocks();

      });

      test("Error 400 - changeDate is before arrivalDate", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: testAdmin.username };
            return next();
          });
        
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
          });
  
          jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(
              [{
                  sellingPrice: 100,
                  model: "model",
                  category: Category.SMARTPHONE,
                  arrivalDate: "2020-01-01",
                  details: "",
                  quantity: 100,
                }]);
        
          jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
              const errors = validationResult(req);
              if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
              }
              next();
            });
   
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateError());
          const response = await request(app).patch(baseURL + "/products/model").send(
              {quantity: 20, changeDate: "2019-01-01"}); 
          expect(response.status).toBe(400)
          expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("model", 20, "2019-01-01")
          expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)

          jest.clearAllMocks();

      });
      
})


describe("Sell a product", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("It should return a 200 success code", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })
        
        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(80)
        const response = await request(app).patch(baseURL + "/products/model/sell").send({quantity: 20, sellingDate: "2023-01-01"})
        expect(response.status).toBe(200)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, 20, "2023-01-01")

        jest.clearAllMocks();

    })

      

    
    test("It should return a 503 error code on failure", async () => {
        const testProduct = { sellingPrice: 100,
            model: "model",
            category: "Smartphone",
            arrivalDate: "2020-01-01",
            details: "",
            quantity: 100 };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(
                [{
                    sellingPrice: 100,
                    model: "model",
                    category: Category.SMARTPHONE,
                    arrivalDate: "2020-01-01",
                    details: "",
                    quantity: 100,
                  }]);

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        const validateRequestMock = jest.spyOn(ProductController.prototype, "sellProduct").mockImplementation(() => {
            throw new Error("Generic error");
        });
        
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateError());
        const response = await request(app).patch(baseURL + "/products/model/sell").send({quantity: 20, sellingDate: "2023-01-01"});
        expect(response.error);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, 20, "2023-01-01")

        jest.clearAllMocks();

    });
    


    test("Error 422 - quantity<=0", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        const response = await request(app).patch(baseURL + "/products/model/sell").send({quantity: 0, sellingDate: "2023-01-01"});
        expect(response.status).toBe(422)

        jest.clearAllMocks();
    })


    test("It should return 401 error - User is not Logged", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });
        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(80)
        const response = await request(app).patch(baseURL + "/products/model/sell");
        expect(response.status).toBe(401);
        expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled();

        jest.clearAllMocks();
      });
      

    test("It should return 401 error - User is not logged as Admin or Manager", async () => {

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(120)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).patch(baseURL + "/products/model/sell")
        expect(response.status).toBe(401)

        jest.clearAllMocks();
    })
    

    test("Error 404 - Product does not exist", async () => {
    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
            

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }
        next();
        });
    
        

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError());
        const response = await request(app).patch(baseURL + "/products/model/sell").send({quantity: 20, sellingDate: "2023-01-01"});
        expect(response.status).toBe(404)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("model", 20, "2023-01-01")
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)

        jest.clearAllMocks();

    });


    test("Error 400 - sellingDate is after current date", async () => {
      
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          req.user = { username: testAdmin.username };
          return next();
        });
      
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
          return next();
        });
      
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
          });
 
          
          jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateError());
        const response = await request(app).patch(baseURL + "/products/model/sell").send(
            {quantity: 20, sellingDate: dayjs().add(1, 'day').format('YYYY-MM-DD')}); 
        expect(response.status).toBe(400)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("model", 20, dayjs().add(1, 'day').format('YYYY-MM-DD'))
          expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)

        jest.clearAllMocks();

      });

      test("Error 400 - sellingDate is before arrivalDate", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: testAdmin.username };
            return next();
        });
        
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
        });
  
    
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        });

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateError());
        const response = await request(app).patch(baseURL + "/products/model/sell").send(
            {quantity: 20, sellingDate: "2019-01-01"}); 
        expect(response.status).toBe(400)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("model", 20, "2019-01-01")
          expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)


        jest.clearAllMocks();

      });

      test("Error 409 - stock quantity = 0", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: testAdmin.username };
            return next();
          });
        
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
          });
  
        
          jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
              const errors = validationResult(req);
              if (!errors.isEmpty()) {
                  return res.status(409).json({ errors: errors.array() });
              }
              next();
            });
            
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError());
            const response = await request(app).patch(baseURL + "/products/model/sell").send(
                {quantity: 20, sellingDate: "2023-01-01"}); 
            expect(response.status).toBe(409)  
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("model", 20, "2023-01-01")
              expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)

          

      });
      

      test("Error 409 - stock quantity is too low", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: testAdmin.username };
            return next();
          });
        
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
          });
  
        
          jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
              const errors = validationResult(req);
              if (!errors.isEmpty()) {
                  return res.status(409).json({ errors: errors.array() });
              }
              next();
            });
   

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError());
            const response = await request(app).patch(baseURL + "/products/model/sell").send(
                {quantity: 20, sellingDate: "2023-01-01"}); 
            expect(response.status).toBe(409)  
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("model", 20, "2023-01-01")
              expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)

      });
      
})


describe("Retrieve all products", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("It should return a 200 success code", async () => {

        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]

        const getProductsMock = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(productsList)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin.username
            return next();
           })
        const isAdminOrManagerMock =  jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        const response = await request(app).get(baseURL + "/products") 
        expect(response.status).toBe(200) 
        expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        expect(response.body).toEqual(productsList)

        getProductsMock.mockRestore();
        isLoggedMock.mockRestore();
        isAdminOrManagerMock.mockRestore();


    })

    test("It should return a 503 error code on failure", async () => {


        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        jest.spyOn(ProductController.prototype, "getProducts").mockImplementation(() => {
            throw new Error("Generic error");
        });

        const response = await request(app).get(baseURL + "/products");
        expect(response.error);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1) 

    });
    


    test("It should return 401 error - User is not Logged", async () => {
        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]
    
        const getProductsMock = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(productsList)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });

        const response = await request(app).get(baseURL + "/products");
      
        expect(response.status).toBe(401);
        expect(ProductController.prototype.getProducts).not.toHaveBeenCalled();
      });
      

    test("It should return 401 error - User is not logged as Admin or Manager", async () => {
        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]
    
        const getProductsMock = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(productsList)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).get(baseURL + "/products")
        expect(response.status).toBe(401)
        expect(ProductController.prototype.getProducts).not.toHaveBeenCalled();
    })

    test("Error 422 - Invalid grouping parameters", async () => {
    

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        let response = await request(app).get(baseURL + "/products").query(
            {grouping : "model", category: "Smartphone", model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products").query(
            {grouping : "model", category: "Smartphone"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products").query(
            {grouping : "category", category: "Smartphone", model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products").query(
            {grouping : "category", model: "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products").query(
            {category: "Smartphone", model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products").query(
            {model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products").query(
            {category: "Smartphone"});
        expect(response.status).toBe(422)

    })

    test("Error 422 - category not in Smartphone, Laptop, Appliance", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        const response = await request(app).get(baseURL + "/products").query(
            {grouping : "category", category: "Console"});
        expect(response.status).toBe(422)
    })

    
})

describe("Retrieve available products", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("It should return a 200 success code", async () => {

        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
        new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]

        const getProductsMock = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(productsList)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin.username
            return next();
           })
        const response = await request(app).get(baseURL + "/products/available") 
        expect(response.status).toBe(200) 
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        expect(response.body).toEqual(productsList)

        getProductsMock.mockRestore();
        isLoggedMock.mockRestore();



    })

    test("It should return a 503 error code on failure", async () => {


        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockImplementation(() => {
            throw new Error("Generic error");
        });

        const response = await request(app).get(baseURL + "/products/available");
        expect(response.error);
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1) 

    });
    


    test("It should return 401 error - User is not Logged", async () => {
        const productsList = [new Product(100, "model1", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model2", Category.SMARTPHONE, "2020-01-01", "", 100 ),
            new Product(100, "model3", Category.APPLIANCE, "2020-01-01", "", 100 )]
    
        const getProductsMock = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(productsList)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });

        const response = await request(app).get(baseURL + "/products/available");
      
        expect(response.status).toBe(401);
        expect(ProductController.prototype.getAvailableProducts).not.toHaveBeenCalled();
      });
      

    test("Error 422 - Invalid grouping parameters", async () => {
    

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })
        
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        let response = await request(app).get(baseURL + "/products/available").query(
            {grouping : "model", category: "Smartphone", model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products/available").query(
            {grouping : "model", category: "Smartphone"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products/available").query(
            {grouping : "category", category: "Smartphone", model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products/available").query(
            {grouping : "category", model: "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products/available").query(
            {category: "Smartphone", model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products/available").query(
            {model : "model"});
        expect(response.status).toBe(422)

        response = await request(app).get(baseURL + "/products/available").query(
            {category: "Smartphone"});
        expect(response.status).toBe(422)

    })

    test("Error 422 - Category not in Smartphone, Laptop, Appliance", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        const response = await request(app).get(baseURL + "/products/available").query(
            {grouping : "category", category: "Console"});
        expect(response.status).toBe(422)
    })

    
})


describe("Delete all products", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("It should return a 200 success code", async () => {


        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin.username
            return next();
           })
        const isAdminOrManagerMock =  jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        const response = await request(app).delete(baseURL + "/products") 
        expect(response.status).toBe(200) 
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled()
        
        isLoggedMock.mockRestore();
        isAdminOrManagerMock.mockRestore();


    })

    test("It should return a 503 error code on failure", async () => {


        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockImplementation(() => {
            throw new Error("Generic error");
        });

        const response = await request(app).delete(baseURL + "/products");
        expect(response.error);
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1) 

    });
    


    test("It should return 401 error - User is not Logged", async () => {

    
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });

        const response = await request(app).delete(baseURL + "/products");
      
        expect(response.status).toBe(401);
        expect(ProductController.prototype.deleteAllProducts).not.toHaveBeenCalled();
      });
      

    test("It should return 401 error - User is not logged as Admin or Manager", async () => {

    
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).delete(baseURL + "/products")
        expect(response.status).toBe(401)
        expect(ProductController.prototype.deleteAllProducts).not.toHaveBeenCalled();
    })


    
})


describe("Delete single product", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("It should return a 200 success code", async () => {


        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin.username
            return next();
           })
        const isAdminOrManagerMock =  jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
        const response = await request(app).delete(baseURL + "/products/model") 
        expect(response.status).toBe(200) 
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
        
        isLoggedMock.mockRestore();
        isAdminOrManagerMock.mockRestore();


    })

    test("It should return a 503 error code on failure", async () => {


        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })


        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        
        jest.spyOn(ProductController.prototype, "deleteProduct").mockImplementation(() => {
            throw new Error("Generic error");
        });

        const response = await request(app).delete(baseURL + "/products/model");
        expect(response.error);
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1) 

    });
    


    test("It should return 401 error - User is not Logged", async () => {

    
        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
          return res.status(401).json({ error: "Unauthorized" });
        });

        const response = await request(app).delete(baseURL + "/products/model");
      
        expect(response.status).toBe(401);
        expect(ProductController.prototype.deleteProduct).not.toHaveBeenCalled();
      });
      

    test("It should return 401 error - User is not logged as Admin or Manager", async () => {

    
        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).delete(baseURL + "/products/model")
        expect(response.status).toBe(401)
        expect(ProductController.prototype.deleteProduct).not.toHaveBeenCalled();
    })

    test("Error 404 - Product does not exist", async () => {
    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testAdmin.username};
            return next();
            })
    
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return  next();
            })
            
    
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }
        next();
        });
        
        
        jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError());
    
        const response = await request(app).delete(baseURL + "/products/model");
        expect(response.status).toBe(404)
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1) 
        jest.clearAllMocks();
    
    });
    
})