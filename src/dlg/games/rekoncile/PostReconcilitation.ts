import { Request } from "express";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ValidationError } from "../../../controller/validation/Validator";
import { KudAPI, KudTransaction } from "../../../api/KudAPI";
import { ExpensesAPI, TotoExpense } from "../../../api/ExpensesAPI";

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

        await new ExpensesAPI(userContext, execContext, String(extractAuthHeader(req))).consolidateExpense(totoTransaction.id)

        return {kudReconciled: true, expenseUpdated: true}

    }
}
