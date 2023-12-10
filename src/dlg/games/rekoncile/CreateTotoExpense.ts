import { Request } from "express";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ValidationError } from "../../../controller/validation/Validator";
import { KudAPI, KudTransaction } from "../../../api/KudAPI";
import { ExpensesAPI, TotoExpense } from "../../../api/ExpensesAPI";
import { TotoRuntimeError } from "../../../controller/model/TotoRuntimeError";

export class CreateTotoExpense implements TotoDelegate {

    /**
     * Creates a Toto Expense out of a Kud Payment, and reconciles the two. 
     * 
     * This delegate is used in a specific scenario: when there are no candidates to 
     * reconcile a Kud Payment. 
     * 
     * In that case, the user will ask Toto to create a Toto Expense that matches the Kud Payment. 
     * 
     * This method will: 
     * 
     *  1. Create a Toto Expense through the Expenses API, taking all the data from the Kud Payment
     * 
     *  2. Reconcile that Toto Expense with the Kud Payment
     * 
     */
    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        // Extract input
        const kudPayment = req.body.kudPayment as KudTransaction

        // 1. Create a Toto Expense
        // Create the expense
        const totoExpense = new TotoExpense(Math.abs(kudPayment.amount), kudPayment.date, kudPayment.text, "DKK", userContext.email)

        // Save it 
        const postResult = await new ExpensesAPI(userContext, execContext, String(extractAuthHeader(req))).postExpense(totoExpense);

        // Check that there is an Expense Id
        if (!postResult.id) throw new TotoRuntimeError(500, `The POST expenses has not worked when posting expense for kud payment [${JSON.stringify(kudPayment)}]`)

        // Extract the expense id
        const expenseId = postResult.id

        // Update the expense, adding the Id
        totoExpense.id = expenseId;

        logger.compute(cid, `Created Toto Expense [${expenseId}]`)

        // 2. Reconcile the Toto Expense with the Kud Payment

        // Post the reconciliation on the Kud API
        logger.compute(cid, `Posting a Kud Reconciliation for Kud Transaction [${kudPayment.id}] and Toto Expense [${totoExpense.id}]`)

        await new KudAPI(userContext, execContext, String(extractAuthHeader(req))).postReconciliation(kudPayment, totoExpense);

        // Update the Toto Expense on the Expense API, marking it as "consolidated"
        logger.compute(cid, `Updating Toto Expense [${totoExpense.id}]. Setting to "Consolidated".`)

        await new ExpensesAPI(userContext, execContext, String(extractAuthHeader(req))).consolidateExpense(totoExpense.id)

        // Done! 
        return { totoExpenseId: expenseId }


    }
}
