import { Request } from "express";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { KudAPI, KudTransaction } from "../../../api/KudAPI";
import { ExpensesAPI, TotoIncome } from "../../../api/ExpensesAPI";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

export class CreateTotoIncome implements TotoDelegate {

    /**
     * Creates a Toto Income out of a Kud Transaction, and reconciles the two. 
     * 
     * This delegate is used in a specific scenario: when there are no candidates to 
     * reconcile a Kud Transaction. 
     * 
     * In that case, the user will ask Toto to create a Toto Income that matches the Kud Transaction. 
     * 
     * This method will: 
     * 
     *  1. Create a Toto Income through the Expenses API, taking all the data from the Kud Transaction
     * 
     *  2. Reconcile that Toto Income with the Kud Transaction
     * 
     */
    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        // Extract input
        const kudIncome = req.body.kudIncome as KudTransaction
        const category = req.body.category 

        // Valdiate
        if (!category) throw new ValidationError(400, `Missing category`)

        // 1. Create a Toto Income
        // Create the expense
        const totoIncome = new TotoIncome(Math.abs(kudIncome.amount), kudIncome.date, kudIncome.text, "DKK", userContext.email, req.body.category)

        // Save it 
        const postResult = await new ExpensesAPI(userContext, execContext, String(extractAuthHeader(req))).postIncome(totoIncome);

        // Check that there is an Income Id
        if (!postResult.id) throw new TotoRuntimeError(500, `The POST /incomes has not worked when posting an income for kud payment [${JSON.stringify(kudIncome)}]`)

        // Extract the expense id
        const incomeId = postResult.id

        // Update the expense, adding the Id
        totoIncome.id = incomeId;

        logger.compute(cid, `Created Toto Income [${incomeId}]`)

        // 2. Reconcile the Toto Income with the Kud Payment

        // Post the reconciliation on the Kud API
        logger.compute(cid, `Posting a Kud Reconciliation for Kud Transaction [${kudIncome.id}] and Toto Income [${totoIncome.id}]`)

        await new KudAPI(userContext, execContext, String(extractAuthHeader(req))).postReconciliation(kudIncome, totoIncome);

        // Update the Toto Income on the Income API, marking it as "consolidated"
        logger.compute(cid, `Updating Toto Income [${totoIncome.id}]. Setting to "Consolidated".`)

        await new ExpensesAPI(userContext, execContext, String(extractAuthHeader(req))).consolidateTransaction(totoIncome.id, "income")

        // Done! 
        return { totoIncomeId: incomeId }


    }
}
