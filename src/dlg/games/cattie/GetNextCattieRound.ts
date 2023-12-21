import { Request } from "express";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { RekoncileGame } from "../../../games/rekoncile/RekoncileGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { CattieGame } from "../../../games/cattie/CattieGame";

export class GetNextCattieRound implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Instantiate the game
        const cattie = new CattieGame(userContext, execContext, String(extractAuthHeader(req)))

        // Get the next round
        return await cattie.nextRound();

    }
}