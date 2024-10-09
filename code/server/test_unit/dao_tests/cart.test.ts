import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import CartDAO from "../../src/dao/cartDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from '../../src/errors/cartError'
import { Category } from "../../src/components/product"
import { Cart, ProductInCart } from "../../src/components/cart"
import dayjs from "dayjs"

jest.mock("../../src/db/db.ts")

describe("Get the current cart for the current user", () =>{
    test("SUCCESS - It should return the current cart for the current user", async () =>{
    const cartDAO = new CartDAO();
        
    const mockCart = { idCart: 1, username: "customer1", paid: false, paymentDate: "2024-02-11", total: 2200};
    
    
    const mockProducts = [
        { model: "model1", quantity: 2, category: Category.SMARTPHONE, price: 800 },
        { model: "model2", quantity: 1, category: Category.LAPTOP, price: 1400 }
    ];

    //mock db.get to return mockCart
    const mockDBGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback)=>{
        callback(null, mockCart)
        return {} as Database
    })

    // Mock getCartProducts to return mockProducts
    const mockGetCartProducts = jest.spyOn(cartDAO, "getCartProducts").
    mockImplementation(async () => {
        return mockProducts.map(p => new ProductInCart(p.model, p.quantity, p.category, p.price));
    });

    const result = await cartDAO.getCart("customer1");
    const expectedCart = new Cart("customer1", false, "2024-02-11", 2200, mockProducts.map(p => new ProductInCart(p.model, p.quantity, p.category, p.price)));
    
    expect(result).toEqual(expectedCart);
    expect(mockDBGET).toHaveBeenCalledTimes(1);    
    expect(mockGetCartProducts).toHaveBeenCalledTimes(1);

    
    //clean up mocks
    mockDBGET.mockRestore();
    mockGetCartProducts.mockRestore();

});

test("SUCCESS - it should return an empty cart if there is no information about an unpaid cart or if there is an unpaid cart with no products", async () =>{
    const cartDAO = new CartDAO();
    const existingUsername = "User";

    //mock database to return null for unpaid cart
    const mockDBGET = jest.spyOn(db, "get")
    .mockImplementation((sql, params, callback) =>{
        callback(null, null)
        return {} as Database
    });

    const result = await cartDAO.getCart(existingUsername);

    const expectedCart = new Cart(existingUsername, false, null as any, 0, []);

    expect(result).toEqual(expectedCart);

    //clean up mocks
    mockDBGET.mockRestore();
});

test("FAILED - it doesn't throws any cart during get the current cart for the current user ", async () =>{
    const cartDAO = new CartDAO();

    const mockDBGET = jest.spyOn(db, "get")
    .mockImplementation((sql, params, callback) =>{
        callback(new Error("Cart not found "));
        return {} as Database
    });

    await expect(cartDAO.getCart("customer")).rejects.toThrow("Cart not found ");

    expect(mockDBGET).toHaveBeenCalledTimes(1);

    mockDBGET.mockRestore();
});

})

describe("Create user carts", () =>{
    test("SUCCESS - It should resolve true", async() =>{
        const cartDAO = new CartDAO();
        
        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(null)
            return {} as Database
        });

        const result = await cartDAO.createUserCart("username");
        
        expect(result).toBe(true);

        mockDBRUN.mockRestore();
    });

    test("FAILED - it should handle error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback (new Error("failed in creating a new cart for the user"));
            return {} as Database
        });
        
        await expect(cartDAO.createUserCart("username")).rejects.toThrow("failed in creating a new cart for the user");
        expect(mockDBRUN).toHaveBeenCalledTimes(1);

        mockDBRUN.mockRestore();
    });
})

describe("Update or add the unit product to the cart", () =>{
    test("SUCCESS - It should resolve true when product quantity is available", async () =>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback) =>{
            callback(null, {quantity: 10});
            return {} as Database
        });

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(null);
            return {} as Database
        });


        const result = await cartDAO.updateAddOneUnitProductToCart(1, "model");

        expect(result).toBe(true);

        mockDBRUN.mockRestore();
    });
    

    test("FAILED - it should handle error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback) =>{
            callback(null, {quantity: 10});
            return {} as Database
        });

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(new Error("failed to update quantity of a product in cart"));
            return {} as Database
        });

        await expect(cartDAO.updateAddOneUnitProductToCart(1, "model")).rejects.toThrow("failed to update quantity of a product in cart");

        mockDBRUN.mockRestore();
    });
    test('FAILED - it should handle db error', async () => {
        const cartDAO = new CartDAO();
        const username = 'testuser';
    
        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback) =>{
            callback(null, {quantity: 10});
            return {} as Database
        });

        // Simula un'eccezione nel blocco try
        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
          throw new Error('Database error');
        });
    
        await expect(cartDAO.createUserCart(username)).rejects.toThrow('Database error');
      });
})

describe("Add new product to cart", ()=>{
    test("SUCCESS - it should resolve true when product quantity is available", async() =>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(null);
            return {} as Database
        });

        const result = await cartDAO.AddNewProductToCart(1, "model", "category", 300);

        expect(result).toBe(true);

        mockDBRUN.mockRestore();
    });

    test("FAILED - it should handle error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(new Error("failed to add a new product in cart"));
            return {} as Database;
        });

        await expect(cartDAO.AddNewProductToCart(1, "model", "category", 300)).rejects.toThrow("failed to add a new product in cart");

        mockDBRUN.mockRestore()
    });
})

describe("Check product quantity", () =>{
    test("SUCCESS - It should resolve true when product quantity is available", async()=>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback) =>{
            callback(null, {quantity: 10});
            return {} as Database
        });

        const result = await cartDAO.checkProductQuantity("model");

        expect(result).toBe(true);

        mockDBGET.mockRestore();
    });

    test("FAILED - it should reject ProductInCartError when product in quantity is 0", async() =>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback) =>{
            callback(null, {quantity: 0});
            return {} as Database 
        });

        const result = await cartDAO.checkProductQuantity("model");

        expect(result).toBe(false);

        mockDBGET.mockRestore();
    });

    test("FAILED - it should handle database error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback) =>{
            callback(new Error("no more available products of this model"), null);
            return {} as Database
        });

        await expect(cartDAO.checkProductQuantity("model")).rejects.toThrow("no more available products of this model");

        mockDBGET.mockRestore();
    })
})

describe("Update cart total cost", () =>{
    test("SUCCESS - it should resolve true when cart is updated successfully", async() =>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.updateCart(1);

        expect(result).toBe(true);

        mockDBRUN.mockRestore();
    });

    test("FAILED - It should handle database error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(new Error("failed in updating the cart for the user"));
            return {} as Database
        });

        await expect(cartDAO.updateCart(1)).rejects.toThrow("failed in updating the cart for the user");

        mockDBRUN.mockRestore();
    });
})

describe("Get cart products", () =>{
    test("SUCCESS - it should resolve an array of Product when products are found in the cart", async()=>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback) =>{
            callback(null, [{model: "model1", quantity: 2, category: Category.SMARTPHONE, price: 1100}, { model: "model2", quantity: 1, category: Category.LAPTOP, price: 700}]);
            return {} as Database;
        });

        const result = await cartDAO.getCartProducts(1);

        expect(result).toEqual([
            new ProductInCart("model1", 2, Category.SMARTPHONE, 1100),
            new ProductInCart("model2", 1, Category.LAPTOP, 700)
        ]);

        mockDBALL.mockRestore();
    });

    test("FAILED - it should handle error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("failed to find products added to cart"), null);
            return {} as Database;
        });

        await expect(cartDAO.getCartProducts(1)).rejects.toThrow("failed to find products added to cart");

        mockDBALL.mockRestore();
    });
});

describe("Checkout cart", () =>{
    test("SUCCESS - It should resolve true when cart is succesfully checked out", async() =>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback)=>{
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.checkoutCart(1);

        expect(result).toBe(true);

        mockDBRUN.mockRestore();
    });

    test("FAILED - It should handle error", async() => {
        const cartDAO = new CartDAO();
        
        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("failed to proceed the payment of the cart"));
            return {} as Database;
        });

        await expect(cartDAO.checkoutCart(1)).rejects.toThrow("failed to proceed the payment of the cart");

        mockDBRUN.mockRestore();
    });
});

describe("Get cart ID", ()=>{
    test("SUCCESS - It should resolve the cart ID", async()=>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback)=>{
            callback(null, {idCart: 1});
            return {} as Database;
        });

        const result = await cartDAO.getCartID("username");

        expect(result).toBe(1);

        mockDBGET.mockRestore();
    });

    test("FAILED - It should handle error", async()=>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("Cart not found "), null);
            return {} as Database;
        });

        await expect(cartDAO.getCartID("username")).rejects.toThrow("Cart not found ");

        mockDBGET.mockRestore();
    });
});

describe("Check if cart is not empty", ()=>{
    test("SUCCESS - It should resolve true when cart exists and is not empty", async()=>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback)=>{
            callback(null, {total: 100});
            return {} as Database;
        });

        const result = await cartDAO.NotEmptyCart(1);

        expect(result).toBe(true);

        mockDBGET.mockRestore();
    });
    test("FAILED - it should handle error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("Cart doesn't exist"), null);
            return {} as Database;
        });

        await expect(cartDAO.NotEmptyCart(1)).rejects.toThrow("Cart doesn't exist");

        mockDBGET.mockRestore();
    });
    test("FAILED - Cart not found - it should reject CartNotFoundError when cart is not found", async()=>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback)=>{
            callback(null, {total: undefined});
            return {} as Database;
        });

        await expect(cartDAO.NotEmptyCart(1)).rejects.toThrow(CartNotFoundError);

        mockDBGET.mockRestore();
    });
    test("FAILED - Empty cart - it should reject EmptyCartError when cart is empty", async() =>{
        const cartDAO = new CartDAO();

        const mockDBGET = jest.spyOn(db, "get")
        .mockImplementation((sql, params, callback)=>{
            callback(null, {total: 0});
            return {} as Database;
        });

        await expect(cartDAO.NotEmptyCart(1)).rejects.toThrow(EmptyCartError);

        mockDBGET.mockRestore();
    });
});

describe("Check product availability", ()=>{
    test("SUCCESS - it should resolve true when all products in the cart are available", async()=>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback)=>{
            callback(null, [{model: "model1", availability: 5, requestProduct: 2}, {model: "model2", availability: 10, requestProduct: 1}]);
            return {} as Database; 
        });

        const result = await cartDAO.ProductAvailability(1);

        expect(result).toBe(true);

        mockDBALL.mockRestore();
    });
    test("FAILED - it should handle error", async() =>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("model or cart not found"), null);
            return {} as Database;
        });

        await expect(cartDAO.ProductAvailability(1)).rejects.toThrow("model or cart not found");

        mockDBALL.mockRestore();
    });
    test("FAILED - Product not available - it should reject ProductInCartError", async()=>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback)=>{
            callback(null, [{model: "model1", availability: 0, requestProduct: 2}, { model: "model2", availability: 5, requestProduct: 10 }]);
            return {} as Database;
        });

        await expect(cartDAO.ProductAvailability(1)).rejects.toThrow(ProductInCartError);

        mockDBALL.mockRestore();
    });
});

describe("Get customer carts", ()=>{
    test("SUCCESS - It should resolve an array of carts when carts are retrieved successfully", async()=>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback)=>{
            callback(null, [
                { idCart: 1, username: "user1", paid: 1, paymentDate: "2024-06-01", total: 100 },
                { idCart: 2, username: "user1", paid: 1, paymentDate: "2024-06-02", total: 200 }
            ]);
            return {} as Database;
        });

        const mockGetCartProducts = jest.spyOn(cartDAO, "getCartProducts")
        .mockResolvedValue([]);

        const result = await cartDAO.getCustomerCarts("user1");

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(Cart);
        expect(result[0].customer).toBe("user1");
        expect(result[0].paid).toBe(1);
        expect(result[0].paymentDate).toBe("2024-06-01");
        expect(result[0].total).toBe(100);
        expect(result[1]).toBeInstanceOf(Cart);
        expect(result[1].customer).toBe("user1");
        expect(result[1].paid).toBe(1);
        expect(result[1].paymentDate).toBe("2024-06-02");
        expect(result[1].total).toBe(200);

        mockDBALL.mockRestore();
        mockGetCartProducts.mockRestore();
    });
    test("FAILED - it should handle error", async()=>{
        const cartDAO = new CartDAO();

        const mockDBALL = jest.spyOn(db, "all")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("error in retrieving cart history fot the user"), null);
            return {} as Database;
        });

        await expect(cartDAO.getCustomerCarts("user1")).rejects.toThrow("error in retrieving cart history fot the user");

        mockDBALL.mockRestore();
    });
});

describe("Delete product from cart", () =>{
    test("SUCCESS - It should resolve true when product is deleted succesfully", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback)=>{
            callback(null);
            return {} as Database;
        });

        const mockUpdateCart = jest.spyOn(cartDAO, "updateCart")
        .mockResolvedValue(true);

        const result = await cartDAO.deleteProductFromCart(1, "model1");

        expect(result).toBe(true);
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM productInCart WHERE idCart = ? and model = ?", 
            [1, "model1"], 
            expect.any(Function)
        );
        expect(mockUpdateCart).toHaveBeenCalledWith(1);

        mockDBRUN.mockRestore();
        mockUpdateCart.mockRestore();
    });

    test("FAILED - it should handle error", async () => {
        const cartDAO = new CartDAO();

        // Mock for db.run to simulate an error
        const mockDBRUN = jest.spyOn(db, "run")
            .mockImplementation((sql, params, callback) => {
                callback(new Error("cannot delete this product from the Cart"));
                return {} as Database;
            });

        await expect(cartDAO.deleteProductFromCart(1, "model1")).rejects.toThrow("cannot delete this product from the Cart");
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM productInCart WHERE idCart = ? and model = ?", 
            [1, "model1"], 
            expect.any(Function)
        );

        mockDBRUN.mockRestore();
    });
});

describe("Update remove one unit product from cart", ()=>{
    test("SUCCESS - It should resolve true when one unit of product is removed successfully", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) =>{
            callback(null);
            return {} as Database;
        });

        const mockUpdateCart = jest.spyOn(cartDAO, "updateCart")
        .mockResolvedValue(true);

        const result = await cartDAO.updateRemoveOneUnitProductToCart(1, "model1");

        expect(result).toBe(true);
        expect(mockDBRUN).toHaveBeenCalledWith("UPDATE productInCart SET quantity=quantity-1 WHERE idCart = ? and model = ?", 
        [1, "model1"], 
        expect.any(Function));
        expect(mockUpdateCart).toHaveBeenCalledWith(1);

        mockDBRUN.mockRestore();
        mockUpdateCart.mockRestore();
    });
    test("FAILED - it should handle error", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback) => {
        if (sql.includes("failed to update quantity of a product in cart")) {
            callback(new Error("failed to update quantity of a product in cart"));
        } else {
            callback(null);
        }
        return {} as Database;
    });
        
        await expect(cartDAO.updateRemoveOneUnitProductToCart(1, "model1"));
        expect(mockDBRUN).toHaveBeenCalledWith(
            "UPDATE productInCart SET quantity=quantity-1 WHERE idCart = ? and model = ?", 
            [1, "model1"], 
            expect.any(Function)
            );

            mockDBRUN.mockRestore();
    });
});

describe("Clear cart", ()=>{
    test("SUCCESS - it should resolve true when cart is cleared successfully", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback)=>{
            callback(null);
            return {} as Database;
        });

        const mockUpdateCart = jest.spyOn(cartDAO, "updateCart")
        .mockResolvedValue(true);

        const result = await cartDAO.clearCart(1);

        expect(result).toBe(true);
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM productInCart WHERE idCart = ?", 
            [1], 
            expect.any(Function)
        );
        expect(mockUpdateCart).toHaveBeenCalledWith(1);

        mockDBRUN.mockRestore();
        mockUpdateCart.mockRestore();
    });
    test("FAILED - It should handle error", async () => {
        const cartDAO = new CartDAO();
    
        // Mock for db.run to simulate an error
        const mockDBRUN = jest.spyOn(db, "run")
            .mockImplementation((sql, params, callback) => {
                callback(new Error("failed to delete the current cart"));
                return {} as Database;
            });
    
        await expect(cartDAO.clearCart(1)).rejects.toThrow("failed to delete the current cart");
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM productInCart WHERE idCart = ?", 
            [1], 
            expect.any(Function)
        );
    
        mockDBRUN.mockRestore();
    });
});

describe("Delete all carts", ()=>{
    test("SUCCESS - it should resolve true when all carts are deleted successfully", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback)=>{
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.deleteAllCarts();
        
        expect(result).toBe(true);
        expect(mockDBRUN).toHaveBeenCalledTimes(2);
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM productInCart",
            [],
            expect.any(Function)
        );
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM carts",
            [],
            expect.any(Function)
        );

        mockDBRUN.mockRestore();
    });
    test("FAILED - It should handle error", async()=>{
        const cartDAO = new CartDAO();

        const mockDBRUN = jest.spyOn(db, "run")
        .mockImplementation((sql, params, callback)=>{
            callback(new Error("failed to delete all cart"));
            return {} as Database;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow("failed to delete all cart");
        expect(mockDBRUN).toHaveBeenCalledTimes(2);
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM productInCart",
            [],
            expect.any(Function)
        );
        expect(mockDBRUN).toHaveBeenCalledWith(
            "DELETE FROM carts",
            [],
            expect.any(Function)
        );

        mockDBRUN.mockRestore();
    });
});

describe("Get carts", () =>{
    test("SUCCESS - It should return all carts", async() =>{
        const cartDAO = new CartDAO();

        const mockCarts = [
            { idCart: 1, username: "customer1", paid: true, paymentDate: "2024-02-11", total: 800},
            { idCart: 2, username: "customer2", paid: true, paymentDate: "2024-03-11", total: 700}
        ];

        const mockProducts1 = [
            { model: "model1", quantity: 2, category: Category.SMARTPHONE, price: 800 },
            { model: "model2", quantity: 1, category: Category.SMARTPHONE, price: 700 }
        ];

        const mockProducts2 = [
            { model: "model1", quantity: 2, category: Category.SMARTPHONE, price: 800 },
            { model: "model2", quantity: 1, category: Category.SMARTPHONE, price: 700 }
        ];
    
    //mock db.all to return mockCarts
    const mockDBALL = jest.spyOn(db, "all").mockImplementation((sql, params, callback) =>{
        callback(null, mockCarts)
        return {} as Database
    });

    // Mock getCartProducts to return mockProducts
    const mockGetCartProducts = jest.spyOn(cartDAO, "getCartProducts").mockImplementation(async (idCart) => {
        if (idCart === 1) {
            return mockProducts1.map(p => new ProductInCart(p.model, p.quantity, p.category, p.price));
        } else {
            return mockProducts2.map(p => new ProductInCart(p.model, p.quantity, p.category, p.price));
        }
    });

    const result = await cartDAO.getAllCarts();

    const expectedCarts = [
        new Cart("customer1", true, "2024-02-11", 800, mockProducts1.map(p => new ProductInCart(p.model, p.quantity, p.category, p.price))),
        new Cart("customer2", true, "2024-03-11", 700, mockProducts2.map(p => new ProductInCart(p.model, p.quantity, p.category, p.price)))
    ];

    expect(result).toHaveLength(mockCarts.length);
    expect(result).toEqual(expectedCarts);
    expect(mockDBALL).toHaveBeenCalledTimes(1);    
    expect(mockGetCartProducts).toHaveBeenCalledTimes(mockCarts.length);

    
    //clean up mocks
    mockDBALL.mockRestore();
    mockGetCartProducts.mockRestore();
    });
    
    test("SUCCESS - It should return an empty array if no carts are found", async() => {
        const cartDAO = new CartDAO();
    
        // Mock db.all to return an empty array
        const mockDBALL = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });
    
        // Mock getCartProducts to return an empty array
        const mockGetCartProducts = jest.spyOn(cartDAO, "getCartProducts").mockResolvedValue([]);
    
        const result = await cartDAO.getAllCarts();
    
        expect(result).toEqual([]);
        expect(mockDBALL).toHaveBeenCalledTimes(1);
        expect(mockGetCartProducts).not.toHaveBeenCalled();
    
        // Clean up mocks
        mockDBALL.mockRestore();
        mockGetCartProducts.mockRestore();
    });

   test("FAILED - It should handle errors", async() =>{
        const cartDAO = new CartDAO();

        //mock db.all to return an error
        const mockDBALL = jest.spyOn(db, "all").mockImplementation((sql, params, callback) =>{
            callback(new Error("error in retrieving cart history fot the user"));
            return {} as Database
        });

        // Aggiungere un mock per getCartProducts in caso venga chiamato erroneamente
        const mockGetCartProducts = jest.spyOn(cartDAO, "getCartProducts").mockImplementation(async (idCart) => {
            return []
        });

        await expect(cartDAO.getAllCarts()).rejects.toThrow("error in retrieving cart history fot the user");
        expect(mockDBALL).toHaveBeenCalledTimes(1);
        expect(mockGetCartProducts).not.toHaveBeenCalled();

        // Clean up mocks
        mockDBALL.mockRestore();
        mockGetCartProducts.mockRestore();
    });

})