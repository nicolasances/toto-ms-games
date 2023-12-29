import { Request } from "express";
import { RekoncileGame } from "../../../games/rekoncile/RekoncileGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export class GetNextTransaction implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Are there rounds (transactions) to skip? 
        const roundsToSkip = req.query.roundsToSkip ?? 0

        // Retrieve the next transaction to reconcile from the Rekoncile Game
        const nextTransaction = await new RekoncileGame(userContext, execContext, String(extractAuthHeader(req))).getNextTransaction(parseInt(String(roundsToSkip)))

        return nextTransaction;

    }
}