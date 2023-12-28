import { Request } from "express";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { KudAPI, KudTransaction } from "../../../api/KudAPI";
import { ExpensesAPI, TotoExpense } from "../../../api/ExpensesAPI";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

export class InvalidateKudTransaction implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        // Extract input
        const kudTransactionId = req.body.kudTransactionId

        // Validate input
        if (!kudTransactionId) throw new ValidationError(400, "Missing Kud Transaction Id")

        // Post the Reconciliation on Kud API
        logger.compute(cid, `Invalidating Kud Transaction [${kudTransactionId}]`)

        await new KudAPI(userContext, execContext, String(extractAuthHeader(req))).invalidateKudTransaction(kudTransactionId)

        return {transationInvalidated: true, kudTransactionId: kudTransactionId}

    }
}
