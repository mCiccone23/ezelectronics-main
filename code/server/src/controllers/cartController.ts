import { User } from "../components/user";
import { Cart } from "../components/cart";
import { Product } from "../components/product";
import CartDAO from "../dao/cartDAO";
import ProductController from "./productController";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../errors/cartError"


/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO
    private PC: ProductController

    constructor() {
        this.dao = new CartDAO
        this.PC = new ProductController
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, product: string): Promise<Boolean> {
        // retrieve il current cart dell'utente
        const currentCart : Cart = await this.dao.getCart(user.username);
        // retrieve il IDCART 
        const idCart : number = await this.dao.getCartID(user.username);
        // elenco di model presenti nel carrello
        const models: string[] = currentCart.products.map((p: any) => p.model);
        // controllo se c'è già un prodotto dello stesso modello nel carrello
        if(models.includes(product)){
            const ret: any = await this.dao.updateAddOneUnitProductToCart(idCart, product);
            return ret
        } else {
            const products: Product[] = await this.PC.getProducts("model",null,product);
            const p: Product = products.find((p:any) => p.model === product);
            if(p){
                const ret: any = await this.dao.AddNewProductToCart(idCart, p.model, p.category, p.sellingPrice);
                return ret
            } else {
                throw new ProductNotInCartError()
            }         
        }
    }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
     async getCart(user: User) : Promise<Cart>  {
    return this.dao.getCart(user.username);
    }


    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User) :Promise<Boolean> { 
        // retrieve il IDCART 
        const idCart : number = await this.dao.getCartID(user.username);
        // check della disponibilità dei prodotti
        const notemptycart: Boolean = await this.dao.NotEmptyCart(idCart);
        const prodavailable: Boolean = await this.dao.ProductAvailability(idCart);
        if(notemptycart && prodavailable){
            // retrieve il current cart dell'utente
            const currentCart : Cart = await this.dao.getCart(user.username);
            // se il checkout va a buonfine
            if(this.dao.checkoutCart(idCart)){
                // decrease the available quantity of the sold products
                for (const p of currentCart.products) {
                    await this.PC.sellProduct(p.model, p.quantity, currentCart.paymentDate);
                }
                return(true)
            }
            return(true)
        }
        return(false)
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User) :Promise<Cart[]> {
        const carts : Cart[] = await this.dao.getCustomerCarts(user.username);
        return carts
    }

    /**
     * Removes one product unit from the current cart. 
     * In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product: string) :Promise<Boolean> {
        // retrieve il IDCART 
        const idCart : number = await this.dao.getCartID(user.username);
        // retrieve il current cart dell'utente
        const currentCart : Cart = await this.dao.getCart(user.username);
        // se il carrello esiste ma non ci sono prodotti dentro restituisco errore
        if(!currentCart.products.length){
            throw new CartNotFoundError()
        } else {
            // check per verificare l'esistenza del modello
            
            const products: Product[] = await this.PC.getProducts("model",null,product);
            const p: Product = products.find((p:any) => p.model === product);
            if(!p)
                throw new ProductNotInCartError()            
            // check della quantità del prodotto presente nel carrello
            const prodToRemove = currentCart.products.find((p: any) => p.model === product);
            const quantity = prodToRemove ? prodToRemove.quantity : null;
            if(quantity == 1){
                // se nel cart ho 1 prodotto per questo modello devo fare la delete del prodotto
                this.dao.deleteProductFromCart(idCart, product)
            } else if(quantity > 1) {
                // se nel cart ho quantity>1 devo fare la update a quantity-1
                this.dao.updateRemoveOneUnitProductToCart(idCart, product)
            } else {
                //errore se il model non è nel carrello
                throw new ProductNotInCartError()
            }
            return(true)
        }
        
     }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User):Promise<Boolean> {
        const currentCart : Cart = await this.dao.getCart(user.username);
        if(currentCart.products.length === 0)
            throw new CartNotFoundError()
        // retrieve il IDCART 
        const idCart : number = await this.dao.getCartID(user.username);
        const res : Boolean = await this.dao.clearCart(idCart);
        return res;
    }
    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts() :Promise<Boolean> {
        return this.dao.deleteAllCarts();
    }
    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts() :Promise<Cart[]> {
        const carts: Cart[] = await this.dao.getAllCarts();
        return(carts)
    }
}

export default CartController