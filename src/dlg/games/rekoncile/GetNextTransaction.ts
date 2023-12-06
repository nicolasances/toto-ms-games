import { Request } from "express";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { RekoncileGame } from "../../../games/rekoncile/RekoncileGame";
import { extractAuthHeader } from "../../../util/AuthHeader";

export class GetNextTransaction implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the next transaction to reconcile from the Rekoncile Game
        const nextTransaction = await new RekoncileGame(userContext, execContext, String(extractAuthHeader(req))).getNextTransaction()

        return nextTransaction;

    }
}