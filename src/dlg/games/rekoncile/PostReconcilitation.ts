import { Request } from "express";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { KudAPI, KudTransaction } from "../../../api/KudAPI";
import { ExpensesAPI, TotoExpense } from "../../../api/ExpensesAPI";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

export class PostReconcilitation implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        // Extract input
        const kudPayment = req.body.kudPayment as KudTransaction
        const totoTransaction = req.body.totoTransaction as TotoExpense

        // Validate input
        if (!kudPayment) throw new ValidationError(400, "Missing Kud Payment")
        if (!totoTransaction) throw new ValidationError(400, "Missing Toto Transaction")

        // Post the Reconciliation on Kud API
        logger.compute(cid, `Posting a Kud Reconciliation for Kud Transaction [${kudPayment.id}] and Toto Expense [${totoTransaction.id}]`)

        await new KudAPI(userContext, execContext, String(extractAuthHeader(req))).postReconciliation(kudPayment, totoTransaction);

        // Update the Toto Expense on the Expense API
        logger.compute(cid, `Updating Toto Expense [${totoTransaction.id}]. Setting to "Consolidated".`)

        await new ExpensesAPI(userContext, execContext, String(extractAuthHeader(req))).consolidateExpense(totoTransaction.id!)

        return {kudReconciled: true, expenseUpdated: true}

    }
}
