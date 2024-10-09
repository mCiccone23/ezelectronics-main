import db from "../db/db";
import { ProductReview } from "../components/review";
import dayjs from "dayjs";
import { NoReviewProductError, ExistingReviewError } from "../errors/reviewError";
import {ProductNotFoundError} from "../errors/productError";
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: string, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            //try{

                /*  non serve, controllo già svolto nella route                  
                //check score
                if (score < 1 || score > 5) {
                    return reject(new Error('Invalid score parameter'));
                }
                */
                // Check if the product exists

                const checkProductSql = 'SELECT COUNT(*) AS count FROM products WHERE model = ?';
                db.get(checkProductSql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    }
                    if (row.count === 0) {
                        reject(new ProductNotFoundError())
                    }
                    
                    // Check if the user has already reviewed the product

                    const checkReviewSql = 'SELECT COUNT(*) AS count FROM reviews WHERE model = ? AND username = ?';
                    db.get(checkReviewSql, [model, user], (err: Error | null, row: any) => {
                        if (err) {
                            return reject(err);
                        }
                        if (row.count > 0) {
                            reject(new ExistingReviewError())
                        }

                        // Insert the review

                        const date = dayjs().format('YYYY-MM-DD');
                        const sql = 'INSERT INTO reviews (score, date, comment, username, model) VALUES (?, ?, ?, ?, ?)';
                        db.run(sql, [score, date, comment, user, model], (err: Error | null) => {
                            if (err) {
                                return reject(err);
                            }
                            return resolve();
                        });
                    });
                });
            /*}catch(error){
                return reject(error);
            }*/
        });
    }

     /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) :Promise<ProductReview[]> { 
        return new Promise<ProductReview[]>((resolve, reject)=>{
            try{
                // Check if the product exists
                const checkProductSql = 'SELECT COUNT(*) AS count FROM products WHERE model = ?';
                db.get(checkProductSql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    }
                    if (row.count === 0) {
                        return reject(new ProductNotFoundError());
                    }
                const sql = 'SELECT * FROM reviews WHERE model = ?';
                db.all(sql, [model], (err: Error | null, rows: any[])=>{
                    if(err){
                        return reject(err);
                    }
                    if(rows == undefined)
                        resolve([])

                     // Verifica se rows è definito e non è vuoto
               
                    let productReviews: ProductReview[] = rows.map((row) => new ProductReview(row.model, row.username, row.score, row.date, row.comment));
                    return resolve(productReviews);
                });
            })
            }catch(error){
                return reject(error);
            }
        });
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: string) :Promise<void> {
        return new Promise<void>((resolve, reject) =>{
            //try{

           // Check if the product exists
           const checkProductSql = 'SELECT COUNT(*) AS count FROM products WHERE model = ?';
           db.get(checkProductSql, [model], (err: Error | null, row: any) => {
            if (err) {
                return reject(err);
            }
            if (row.count == 0) {
                reject(new ProductNotFoundError())
            }
            
            // Check if the user has a review for the product
            const checkReviewSql = 'SELECT COUNT(*) AS count FROM reviews WHERE model = ? AND username = ?';
            db.get(checkReviewSql, [model, user], (err: Error | null, row: any) => {
                if (err) {
                    return reject(err);
                }
                if (row.count == 0) {
                    reject(new NoReviewProductError()); 
                }
                
                // Delete the review 
                const sql = 'DELETE FROM reviews WHERE model = ? AND username = ?';
                db.run(sql, [model, user], (err: Error | null) =>{
                    if(err){
                        return reject(err);
                    }
                    return resolve();
                });
            });
        });
    /*}catch(error){
        return reject(error);
    }*/
});
}

      /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string) :Promise<void> {
        return new Promise((resolve, reject) =>{
            //try{

            // Check if the product exists

            const checkProductSql = 'SELECT COUNT(*) AS count FROM products WHERE model = ?';
            db.get(checkProductSql, [model], (err: Error | null, row: any) => {
            if (err) {
                return reject(err);
            }
            if (row.count == 0) {
                reject(new ProductNotFoundError()) 
            }

            // Delete all reviews for the product
                const sql = 'DELETE FROM reviews WHERE model = ?';
                db.run(sql, [model], (err: Error | null)=>{
                    if(err){
                        reject(err);
                    }
                    return resolve();
                });
            });
            /*}catch(error){
                return reject(error);
            }*/
        });
     }

     /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews() :Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = 'DELETE FROM reviews';
            db.run(sql, (err: Error | null) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
     }

    
}

export default ReviewDAO;