import { Request } from "express";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { InkomeGame } from "../../../games/inkome/InkomeGame";

export class GetNextIncome implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Are there rounds (transactions) to skip? 
        const roundsToSkip = req.query.roundsToSkip ?? 0

        // Retrieve the next transaction to reconcile from the Inkome Game
        const nextTransaction = await new InkomeGame(userContext, execContext, String(extractAuthHeader(req))).getNextTransaction(parseInt(String(roundsToSkip)))

        return nextTransaction ?? {};

    }
}