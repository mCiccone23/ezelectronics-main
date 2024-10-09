import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../errors/productError"
import db from "../db/db"
import dayjs from "dayjs"
import { Product } from "../components/product";
import { DateError } from "../utilities";
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

     /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
     async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) :Promise<void> { 
         //aggiungere controllo su formato della data
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "INSERT INTO products(model, category, arrivalDate, sellingPrice, quantity, details) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [model, category, arrivalDate, sellingPrice, quantity, details], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: products.model")) reject(new ProductAlreadyExistsError)
                        // se la data è maggiore di quella attuale
                        reject(err)

                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null) :Promise<number>  {

        return new Promise<number>((resolve, reject) => {
            try {
                const selectSql = "SELECT quantity, arrivalDate FROM products WHERE model = ?";
                db.get(selectSql, [model], (err: Error | null, row?: { quantity: number, arrivalDate: string }) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!row) {
                        return reject(new ProductNotFoundError());
                    }

                    const { quantity: currentQuantity, arrivalDate } = row;

                    if (changeDate) {
                        if (!dayjs(changeDate, 'YYYY-MM-DD', true).isValid()) {
                            return reject(new DateError());
                        }
                        if (dayjs(changeDate).isAfter(dayjs())) {
                            return reject(new DateError());
                        }
                        if (dayjs(changeDate).isBefore(dayjs(arrivalDate))) {
                            return reject(new DateError());
                        }

                    } else {
                        changeDate = dayjs().format('YYYY-MM-DD');
                    }

                    const updatedQuantity = currentQuantity + newQuantity;
                    const updateSql = "UPDATE products SET quantity = ? WHERE model = ?";
                    db.run(updateSql, [updatedQuantity, model], (updateErr: Error | null) => {
                        if (updateErr) {
                            return reject(updateErr);
                        }
                        resolve(updatedQuantity);
                    });
                });
            } catch (error) {
                reject(error);
            }

        })

     }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null) :Promise<number> { 
        return new Promise<number>((resolve, reject) => {
            try{

                const sql = "UPDATE products SET quantity = quantity - ? WHERE model == ?";
                const sqlget = "SELECT * FROM products WHERE model == ?";

                db.get(sqlget, [model], (err:Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!row) {
                        return reject(new ProductNotFoundError());
                    }
                    if(row.quantity == 0)
                        return reject(new EmptyProductStockError());
                    if(row.quantity < quantity){
                        return reject(new LowProductStockError());
                    }

                    if(row.arrivalDate > sellingDate)
                        return reject(new DateError());
                    
                    const updatedQuantity = row.quantity - quantity;
                    db.run(sql, [quantity, model], (err:Error | null) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(updatedQuantity);
                    });
                });
            } catch(error) {
                return reject(error);
            }  
        });
     }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) :Promise<Product[]>  { 
        return new Promise<Product[]>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM products";

                if(grouping === "model") {
                    sql += " WHERE model = '" + model + "'";
                } else if (grouping === "category") {
                    sql += " WHERE category = '" + category + "'";
                }

                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if(err){
                        return reject(err);
                    }
                    if (model && rows.length == 0) {
                        return reject(new ProductNotFoundError());
                    }

                    const products: Product[] = rows.map(
                        (row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
                    );
                    return resolve(products);
                })
                
            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) :Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                this.getProducts(grouping, category, model).catch((err) => {
                    return reject(err);
                });
                let sql = "SELECT * FROM products WHERE quantity > 0";
                
                if(grouping === "model") {
                    sql += " AND model = '" + model + "'";
                } else if (grouping === "category") {
                    sql += " AND category = '" + category + "'";
                }

                console.log(sql);

                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if(err){
                        return reject(err);
                    }

                    /*if (model && rows.length == 0) {
                        return reject(new ProductNotFoundError());
                    }*/

                    const productsAvailable: Product[] = rows.map(
                    
                        (row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
                    );
                    return resolve(productsAvailable);
                })
                
            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts() :Promise <Boolean>  {
        return new Promise<Boolean>((resolve, reject) => {
            
                try{
                    const sql = "DELETE FROM products";
                    db.run(sql, (err:Error | null) => {
                        if(err){
                            reject(err);
                        } 
                        return resolve(true);
                    });
                } catch(error) {
                    return reject(error);
                }  
        });
     }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string) :Promise <Boolean>  {
        return new Promise<Boolean>((resolve, reject) => {
            
            try{
                const sql = "DELETE FROM products WHERE model == '" + model + "'";
                const sqlget = "SELECT * FROM products WHERE model == '" + model + "'";
                db.get(sqlget, [], (err:Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!row) {
                        return reject(new ProductNotFoundError());
                    }
                
                    db.run(sql, [], (err:Error | null, row: any) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(true);
                    });
                });
            } catch(error) {
                return reject(error);
            }  
    });
     }

}

export default ProductDAO