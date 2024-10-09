import { test, expect, jest, describe } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import { Role, User } from "../../src/components/user"
import { Cart } from "../../src/components/cart"
import { Category, Product } from "../../src/components/product"

import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from '../../src/errors/cartError'
import ProductController from "../../src/controllers/productController"

jest.mock("../../src/dao/cartDAO")

const controller = new CartController();
const testCart = new Cart("customer", true, "2024-01-12", 100, [{ model: "model", quantity: 1, category: Category.SMARTPHONE, price: 100 }]);
const testCart1 = new Cart("customer", true, "2024-02-11", 500, [{ model: "model", quantity: 1, category: Category.LAPTOP, price: 500 }]);
const testCart2 = new Cart("customer", true, "2023-02-11", 400, [{ model: "model", quantity: 1, category: Category.SMARTPHONE, price: 400 }]);
const testUser = new User("username", "name", "surname", Role.CUSTOMER, "", "");
const testProduct = new Product(100, "model", Category.APPLIANCE, "2024-02-11", "", 4);
const emptyCart = new Cart("customer", false, "", 0, []);

describe("addToCart - add a product to cart Test", ()=>{
    test("SUCCESS - it should return true", async()=>{

        jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, 'getCartID').mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, 'updateAddOneUnitProductToCart').mockResolvedValueOnce(true);

        const response = await controller.addToCart(testUser, testProduct.model)

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.updateAddOneUnitProductToCart).toHaveBeenCalledWith(1, testProduct.model);

        expect(response).toBe(true);
    });
    test("SUCCESS - it should add a new product if it is not in cart", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(emptyCart);
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
        jest.spyOn(CartDAO.prototype, "AddNewProductToCart").mockResolvedValueOnce(true);

        const response = await controller.addToCart(testUser, testProduct.model);

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", null, testProduct.model);
        expect(CartDAO.prototype.AddNewProductToCart).toHaveBeenCalledWith(1, testProduct.model, testProduct.category, testProduct.sellingPrice);
        expect(response).toBe(true);
    });
    test("FAILED - It should throw an error if the product is not available", async()=>{
        jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValueOnce(emptyCart);
        jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([]);

        const controller = new CartController();
        await expect(controller.addToCart(testUser, testProduct.model)).rejects.toThrow(ProductNotInCartError);

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", null, testProduct.model);
    });
    test("FAILED - it should handle db error", async()=>{
        jest.spyOn(CartDAO.prototype, 'getCart').mockRejectedValueOnce(new Error("Database error"));

        const controller = new CartController();
        await expect(controller.addToCart(testUser, testProduct.model)).rejects.toThrow("Database error");

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
    });
});

describe("Get Cart", ()=>{
    test("SUCCESS - It should return the user's current cart", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);

        const response = await controller.getCart(testUser);

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(response).toStrictEqual(testCart);
    });
    test("Success - It should return an empty cart if there is no current cart", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(emptyCart);

        const response = await controller.getCart(testUser);

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(response).toStrictEqual(emptyCart);
    });
    test("FAILED - It should handle db error", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockRejectedValueOnce(new Error("Database error"));

        await expect(controller.getCart(testUser)).rejects.toThrow("Database error");

        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
    });
});

describe("Checkout cart", ()=>{
    test("SUCCESS - it should checkout the user's cart and return true", async()=>{
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "NotEmptyCart").mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, "ProductAvailability").mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);
        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(100);

        const response = await controller.checkoutCart(testUser);

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.NotEmptyCart).toHaveBeenCalledWith(1);
        expect(CartDAO.prototype.ProductAvailability).toHaveBeenCalledWith(1);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(1);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testCart.products[0].model, testCart.products[0].quantity, testCart.paymentDate);

        expect(response).toBe(true);
    });
    test("FAILED - it should return false if the cart is empty", async()=>{
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "NotEmptyCart").mockResolvedValueOnce(false);

        const response = await controller.checkoutCart(testUser);

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.NotEmptyCart).toHaveBeenCalledWith(1);

        expect(response).toBe(false);
    });
    test("FAILED - it should return false if the product is not available", async()=>{
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "NotEmptyCart").mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, "ProductAvailability").mockResolvedValueOnce(false);

        const response = await controller.checkoutCart(testUser);

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.NotEmptyCart).toHaveBeenCalledWith(1);
        expect(CartDAO.prototype.ProductAvailability).toHaveBeenCalledWith(1);

        expect(response).toBe(false);
    });
    test("FAILED - It should throw an error if sellProduct fails", async()=>{
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "NotEmptyCart").mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, "ProductAvailability").mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new Error("Product sale error"));

        await expect(controller.checkoutCart(testUser)).rejects.toThrow("Product sale error");

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.NotEmptyCart).toHaveBeenCalledWith(1);
        expect(CartDAO.prototype.ProductAvailability).toHaveBeenCalledWith(1);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(1);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testCart.products[0].model, testCart.products[0].quantity, testCart.paymentDate);
    });
    test("FAILED - it should handle db error", async()=>{
        jest.spyOn(CartDAO.prototype, "getCartID").mockRejectedValueOnce(new Error("Database error"));

        await expect(controller.checkoutCart(testUser)).rejects.toThrow("Database error");

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
    });
});

describe("get customer carts", ()=>{
    test("SUCCESS - it should return a list of paid carts", async()=>{
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([testCart1, testCart2]);

        const response = await controller.getCustomerCarts(testUser);

        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser.username);

        expect(response).toStrictEqual([testCart1, testCart2]);
    });
    test("SUCCESS - it should return an ampty list if no paid carts are found", async()=>{
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([]);

        const response = await controller.getCustomerCarts(testUser);

        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser.username);

        expect(response).toStrictEqual([]);
    });
    test("FAILED - it should handle db error", async()=>{
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error("Database error"));

        await expect(controller.getCustomerCarts(testUser)).rejects.toThrow("Database error");

        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser.username);
    });
});

describe("removeProductFromCart", () => {
    const testUser1: User = {
        username: "testUser",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "123 Test Street",
        birthdate: "2000-01-01"
    };

    const testProduct1: Product = {
        model: "testModel",
        category: Category.APPLIANCE,
        sellingPrice: 100,
        arrivalDate: null,
        details: null,
        quantity: 10
    };

    const testCart3: Cart = {
        customer: "testUser",
        paid: false,
        paymentDate: "",
        total: 300,
        products: [
            {
                model: "testModel",
                quantity: 2,
                category: Category.LAPTOP,
                price: 100
            }
        ]
    };

    test("SUCCESS - it should remove one unit of the product if quantity > 1", async () => {
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart3);
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct1]);
        jest.spyOn(CartDAO.prototype, "updateRemoveOneUnitProductToCart").mockResolvedValueOnce(true);

        const response = await controller.removeProductFromCart(testUser1, "testModel");

        expect(response).toBe(true);
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser1.username);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser1.username);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", null, "testModel");
        expect(CartDAO.prototype.updateRemoveOneUnitProductToCart).toHaveBeenCalledWith(1, "testModel");
    });

    test("SUCCESS - it should remove the product if quantity is 1", async () => {
        const singleProductCart = {
            ...testCart3,
            products: [{
                model: "testModel",
                quantity: 1,
                category: Category.APPLIANCE,
                price: 100
            }]
        };

        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(singleProductCart);
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct1]);
        jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockResolvedValueOnce(true);

        const response = await controller.removeProductFromCart(testUser1, "testModel");

        expect(response).toBe(true);
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser1.username);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser1.username);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", null, "testModel");
        expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenCalledWith(1, "testModel");
    });

    test("FAILURE - it should throw CartNotFoundError if cart is empty", async () => {
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce({ ...testCart3, products: [] });

        await expect(controller.removeProductFromCart(testUser1, "testModel")).rejects.toThrow(CartNotFoundError);

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser1.username);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser1.username);
    });

    test("FAILURE - it should throw ProductNotInCartError if product is not in cart", async () => {
        const cartWithoutProduct = {
            ...testCart3,
            products: [{ model: "otherModel", quantity: 1, category: Category.LAPTOP, price: 100 }]
        };

        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(cartWithoutProduct);
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct1]);

        await expect(controller.removeProductFromCart(testUser1, "testModel")).rejects.toThrow(ProductNotInCartError);

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser1.username);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser1.username);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", null, "testModel");
    });

    test("FAILURE - it should throw ProductNotInCartError if product does not exist in database", async () => {
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart3);
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([]);


        await expect(controller.removeProductFromCart(testUser1, "testModel")).rejects.toThrow(ProductNotInCartError);

        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser1.username);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser1.username);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", null, "testModel");
    });
});

describe("Clear cart", ()=>{
    test("SUCCESS - it should return true when the cart is succesfully cleared", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);

        const response = await controller.clearCart(testUser);

        expect(response).toBe(true);
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(1);
    });
    test("FAILED - it should return false when clearing the cart fails", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(false);

        const response = await controller.clearCart(testUser);

        expect(response).toBe(false);
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(1);
    });
    test("FAILED - it should throw an error when getCartID fails", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, "getCartID").mockRejectedValueOnce(new Error("Failed to get cart ID"));

        await expect(controller.clearCart(testUser)).rejects.toThrow("Failed to get cart ID");
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
    });
    test("FAILED - it should throw an error when clearCart failed", async()=>{
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, "getCartID").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "clearCart").mockRejectedValueOnce(new Error("Failed to clear cart"));

        await expect(controller.clearCart(testUser)).rejects.toThrow("Failed to clear cart");
        expect(CartDAO.prototype.getCartID).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(1);
    });
});

describe("delete all carts", ()=>{
    test("SUCCESS - it should return true when all carts are succesfully deleted", async()=>{
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

        const response = await controller.deleteAllCarts();

        expect(response).toBe(true);
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
    });
    test("FAILED - it should return false when deleting all carts fails", async()=>{
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(false);

        const response = await controller.deleteAllCarts();

        expect(response).toBe(false);
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
    });
    test("FAILED - it should throw an error when deleteAllCarts fails", async()=> {
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error("Failed to delete all carts"));

        await expect(controller.deleteAllCarts()).rejects.toThrow("Failed to delete all carts");
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
    });
});

describe("getAllCarts", ()=>{
    test("SUCCESS - It should return a list of carts", async()=>{
        //mock the getAllCarts method of the DAO
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([testCart1, testCart2]);
        //call the getAllCarts method of the controller
        const response = await controller.getAllCarts();

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
        expect(response).toStrictEqual([testCart1, testCart2]);
    });
    test("SUCCESS - It should return an empty list if there aren't carts", async()=>{
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([]);

        const response = await controller.getAllCarts();

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
        expect(response).toEqual([]);
    });
    test("FAILED - it should handle error", async()=>{
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockRejectedValueOnce(new Error('error in retrieving cart history fot the user'));

        await expect(controller.getAllCarts()).rejects.toThrow("error in retrieving cart history fot the user");

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
    });
});