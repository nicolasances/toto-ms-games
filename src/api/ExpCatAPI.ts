import http from 'request'
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { TotoExpense } from './ExpensesAPI';

export class ExpCatAPI {

    endpoint: string;
    userEmail: string;
    cid: string;
    authorizationHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authorizationHeader: string) {
        this.endpoint = process.env["EPXCAT_API_ENDPOINT"]!
        this.userEmail = userContext.email
        this.cid = String(execContext.cid);
        this.authorizationHeader = authorizationHeader;
    }

    /**
     * Predicts a category using the ExpCat Model API
     * 
     * @param desc the description of the payment
     * @returns the prediction
     */
    async predictCategory(desc: string): Promise<ExpcatPrediction> {

        return new Promise((success, failure) => {

            http({
                uri: `${this.endpoint}/predict?description=${desc}&email=${this.userEmail}`,
                method: 'GET',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader
                }
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body));

            })
        })
    }

    /**
     * Predicts the category of a batch of expenses using ExpCat API
     * 
     * @param descriptions an array of descriptions
     * @returns the prediction
     */
    async predictCategories(descriptions: string[]): Promise<ExpcatBulkPrediction> {

        return new Promise((success, failure) => {

            http({
                uri: `${this.endpoint}/bulkpredict`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader, 
                    "Content-Type": "application/json"
                }, 
                body: JSON.stringify({
                    descriptions: descriptions
                })
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body));

            })
        })
    }

    /**
     * Predicts the category of a batch of expenses. 
     * 
     * This method is a utility method using predictCategories(), that takes care of extracting
     * the description of the expenses 
     * 
     * @param expenses list of expenses for which to predict the categories
     */
    async predictCategoryOfExpenses(expenses: TotoExpense[]): Promise<ExpcatBulkPrediction> {

        const descriptions = []

        for (let expense of expenses) {
            descriptions.push(expense.description)
        }

        return this.predictCategories(descriptions);

    }
}

export interface ExpcatPrediction {

    category: string

}

export interface ExpcatBulkPrediction {

    categories: string[]

}