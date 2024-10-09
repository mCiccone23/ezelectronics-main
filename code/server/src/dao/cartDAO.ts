import db from "../db/db"
import { Cart, ProductInCart } from "../components/cart";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../errors/cartError";
const dayjs = require('dayjs');

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(username: string): Promise<Cart>{
        return new Promise<Cart>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM carts WHERE username = ? and paid = 0";
                db.get(sql, [username], async (err: Error | null, row: any) => {
                    if (err) {
                        if (err.message.includes("Cart not found "))
                        reject(err)
                    }      
                    // non ci sono carrelli unpaid per questo user
                    // creo un carrello vuoto per l'user
                    if(row == undefined && this.createUserCart(username)){
                        const cart = new Cart(username, false, null, 0, []);
                        resolve(cart);
                    } else {
                        // ho trovato un carrello unpaid per questo user
                        // estraggo i prodotti presenti nel carrello
                        const products: ProductInCart[] = await this.getCartProducts(row.idCart);
                        // se non ci sono prodotti in questo carrello ritorno un oggetto Cart vuoto
                        if (!products.length){
                            const cart = new Cart(row.username, false, null, 0, []);
                            resolve(cart);
                        }
                        
                        // nel carrello ci sono prodotti
                        const cart = new Cart(row.username, row.paid, row.paymentDate, row.total, products);
                        resolve(cart);
                    }
    
                })
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * Create a new cart for a specific user.
     * @param username - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to an empty cart.
     */
    async createUserCart(username: string): Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "INSERT INTO carts(username, total, paymentDate, paid) VALUES(?, 0, null, 0)"
                db.run(sql, [username], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("failed in creating a new cart for the user")) 
                        reject(err)
                    }
                    resolve(true);
            })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * @param idcart - The id of the cart of the user.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async updateAddOneUnitProductToCart(idcart: number, model: string): Promise<Boolean>{
        return new Promise<Boolean>(async (resolve, reject) => {
            try{
                //controllo se la quantità di prodotto disponibile è 0
                const isAvailable = await this.checkProductQuantity(model)
                if(isAvailable){
                    const sql = "UPDATE productInCart SET quantity=quantity+1 WHERE idCart = ? and model = ?";
                    db.run(sql, [idcart, model], (err: Error | null) => {
                        if (err){
                            if(err.message.includes("failed to update quantity of a product in cart"))
                                reject(err)
                        }else{
                        //UPDATE CART total
                        this.updateCart(idcart);
                        resolve(true);}
                    })
                } else
                    reject(new ProductInCartError())
            } catch (error) {
                reject(error)
            }
        })
    }

     /**
     * If the product is not in the cart, it should be added with a quantity of 1.
     * @param idCart - The id of the cart of the user.
     * @param  - The details of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
     async AddNewProductToCart(idcart: number, model: string, category: string, price: number): Promise<Boolean>{
        return new Promise<Boolean>(async (resolve, reject) => {
            try{
                const isAvailable = await this.checkProductQuantity(model)
                if(isAvailable){
                    const sql = "INSERT INTO productInCart(idCart, model, quantity, category, price) VALUES (?, ?, 1, ?, ?)";
                    db.run(sql, [idcart, model, category, price], (err: Error | null) => {
                        if (err){
                            if(err.message.includes("failed to add a new product in cart"))
                                reject(err)
                        }
                        //UPDATE CART total
                        this.updateCart(idcart);
                        resolve(true);
                    })
                } else
                    reject(new ProductInCartError())
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Controlla la disponibilità di un prodotto (quantity > 0)
     */
    async checkProductQuantity(model: string):Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "SELECT quantity FROM products WHERE model = ?";
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        if (err.message.includes("no more available products of this model")) 
                        reject(err)
                    }
                    if (!row || row.quantity === 0)
                        resolve(false)
                    resolve(true)
            })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Fa l'update del costo totale del carrello in seguito all'aggiunta o alla rimozione di un prodotto
     */
    async updateCart(idcart: number):Promise<Boolean>{
    return new Promise<Boolean>((resolve, reject) => {
        try {
            const sql = "UPDATE carts SET total = "
            +"COALESCE((SELECT SUM(price*quantity) FROM productInCart WHERE idCart = ? ), 0)"
            + "WHERE idCart = ?"
            db.run(sql, [idcart, idcart], (err: Error | null) => {
                if (err) {
                    if (err.message.includes("failed in updating the cart for the user"))
                    reject(err)
                }
                resolve(true)
        })
        } catch (error) {
            reject(error)
        }
    })
}

    /**
     * Retrive all the products in the cart of the logged in user
     */
    async getCartProducts(idcart: number): Promise<ProductInCart[]> {
        return new Promise<ProductInCart[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM productInCart WHERE idCart = ?";
                db.all(sql, [idcart], (err: Error | null, rows: any) => {
                    if (err) {
                        if (err.message.includes("failed to find products added to cart"))
                            reject(err)
                    }
                    // creo la lista di prodotti presenti nel carrello
                    let products: ProductInCart[] = [];
                    rows.forEach((row: any) => { products.push(new ProductInCart(row.model, row.quantity, row.category, row.price)); });
                    resolve(products)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(idcart: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try { 
                const sql = "UPDATE carts SET paymentDate = ?, paid = 1 WHERE idCart = ?";
                db.run(sql, [dayjs().format('YYYY-MM-DD'), idcart], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("failed to proceed the payment of the cart"))
                            reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Given the current user cart, retrieve its idCart
     */
    async getCartID(username: string): Promise<number>{
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "SELECT idCart FROM carts WHERE username = ? and paid = 0";
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        if (err.message.includes("Cart not found ")) 
                        reject(err)
                    }
                    if(!row || row.idCart == undefined){
                        reject(new CartNotFoundError())
                    }else 
                    resolve(row.idCart);
                })
            } catch (error) {
                reject(error)
            }
        })
    }    

    /**
     * check per verificare l'esistenza del carrello e assicurarsi che non sia vuoto 
     */
    async NotEmptyCart(idcart: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {               
                const sql = "SELECT total FROM carts WHERE idCart = ? and paid = 0";
                db.get(sql, [idcart], (err: Error | null, row: any) => {
                    if (err) {
                        if (err.message.includes("Cart doesn't exist"))
                            
                            reject(err)
                    }
                    //carrello non trovato
                    if(!row || row.total == undefined)
                        reject(new CartNotFoundError())
                    // carrello senza prodotti
                    else if(row.total == 0)
                        reject(new EmptyCartError())
                    // carrello con prodotti
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * check della disponibilità dei prodotti 
     */
    async ProductAvailability(idcart: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {               
                const sql = "SELECT pc.model as model, p.quantity as availability, " + 
                " pc.quantity as requestProduct " +
                " FROM productInCart as pc, products as p " +
                " WHERE pc.idCart = ? and pc.model=p.model ";
                db.all(sql, [idcart], (err: Error | null, rows: any) => {
                    if (err) {
                        if (err.message.includes("model or cart not found"))
                            reject(err)
                    }
                    //ho estratto da db una tabella che contiene per ogni model la quantità disponibile e la quantità richiesta
                    const productsToBuy = rows.map((row: any) => ({
                        model: row.model,
                        avail: row.availability,
                        reqP: row.requestProduct
                    }));
                    // check availability != 0 o richiesta minore di disponibilità
                    if (productsToBuy.every((p: any) => p.avail > 0) && productsToBuy.every((p :any) => p.avail >= p.reqP)) {
                        resolve(true)
                    } else {
                        reject(new ProductInCartError())
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(username: string) : Promise<Cart[]>{
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM carts WHERE username = ? and paid = 1";
                db.all(sql, [username], async (err: Error | null, rows: any) => {
                    if (err) {
                        if (err.message.includes("error in retrieving cart history fot the user"))
                            reject(err)
                    }
                    //crea la lista di carrelli acquistati da user
                    /*const carts: Cart[] = await Promise.all(
                        rows.map(async (row: any) => {
                            const products = await this.getCartProducts(row.idCart);
                            return new Cart(row.username, row.paid, row.paymentDate, row.total, products);
                        })
                    );
                    resolve(carts)*/
                    //crea la lista di carrelli acquistati da user ma controlla prima che rows non è nulla 
                    if (rows) {
                        const carts: Cart[] = await Promise.all(
                            rows.map(async (row: any) => {
                                const products = await this.getCartProducts(row.idCart);
                                return new Cart(row.username, row.paid, row.paymentDate, row.total, products);
                            })
                        );
                        resolve(carts);
                    } else {
                        resolve([]); // o gestisci il caso in modo diverso, a seconda delle tue esigenze
                    }
                    
                })
            } catch (error) {
                reject(error)
            }
        })

    }

    /**
     * elimino un prodotto dal carrello se la quantità nel carrello = 1
     */
    async deleteProductFromCart(idcart: number, model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {               
                const sql = "DELETE FROM productInCart WHERE idCart = ? and model = ?";
                db.run(sql, [idcart, model], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("cannot delete this product from the Cart")) 
                            
                            reject(err)
                    }
                    //UPDATE CART total
                    this.updateCart(idcart);
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * elimino una unità di prodotto dal carrello quando la quantità nel carrello è > 1
     */
    async updateRemoveOneUnitProductToCart(idcart: number, model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {               
                const sql ="UPDATE productInCart SET quantity=quantity-1 WHERE idCart = ? and model = ?";
                db.run(sql, [idcart, model], (err: Error | null) => {
                    if (err){
                        if(err.message.includes("failed to update quantity of a product in cart")) 
                            reject(err)
                    }
                    //UPDATE CART total
                    this.updateCart(idcart);
                    resolve(true);
                })
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * Removes all products from the current cart.
     */
    async clearCart(idcart: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {               
                const sql ="DELETE FROM productInCart WHERE idCart = ?";
                db.run(sql, [idcart], (err: Error | null) => {
                    if (err){
                        if(err.message.includes("failed to delete the current cart"))
                            reject(err)
                    }
                    //UPDATE CART total
                    this.updateCart(idcart);
                    resolve(true);
                })
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * delete all carts.
     */
    async deleteAllCarts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {    
                // clear db table productInCart           
                const sql1 ="DELETE FROM productInCart";
                db.run(sql1, [], (err: Error | null) => {
                    if (err){
                        if(err.message.includes("failed to delete all cart"))
                            reject(err)
                    }
                    resolve(true);
                })
                // crear db table carts
                const sql2 ="DELETE FROM carts";
                db.run(sql2, [], (err: Error | null) => {
                    if (err){
                        if(err.message.includes("failed to delete all cart"))
                            reject(err)
                    }
                    resolve(true);
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * get all carts
     */
    async getAllCarts() : Promise<Cart[]>{
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM carts";
                db.all(sql, [], async (err: Error | null, rows: any) => {
                    if (err) {
                        if (err.message.includes("error in retrieving cart history fot the user"))
                            reject(err)
                    }if (!rows || rows.length === 0) {
                        resolve([]);
                        return;
                    }
                    if(rows == undefined)
                        resolve([])
                    //crea la lista di carrelli di tutti gli user
                    const carts: Cart[] = await Promise.all(
                        rows.map(async (row: any) => {
                            const products = await this.getCartProducts(row.idCart);
                            return new Cart(row.username, row.paid, row.paymentDate, row.total, products);
                        })
                    );
                    resolve(carts)
                })
            } catch (error) {
                reject(error)
            }
        })

    }




}

export default CartDAO

